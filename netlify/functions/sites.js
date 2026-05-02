const { Client } = require('pg');

function json(statusCode, payload) {
  return {
    statusCode,
    headers: {
      'content-type': 'application/json',
      'cache-control': 'no-store'
    },
    body: JSON.stringify(payload)
  };
}

function getUser(context) {
  return context?.clientContext?.user || null;
}

exports.handler = async (event, context) => {
  const user = getUser(context);
  if (!user) return json(401, { error: 'Authentication required. Enable Netlify Identity and log in first.' });

  const connectionString = process.env.NETLIFY_DATABASE_URL || process.env.DATABASE_URL;
  if (!connectionString) {
    return json(500, { error: 'Missing NETLIFY_DATABASE_URL environment variable.' });
  }

  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();

    if (event.httpMethod === 'GET') {
      const result = await client.query(
        `select id, site_name as "name", site_kind as "kind", template_id as "templateId",
                site_data as "siteData", created_at as "createdAt", updated_at as "updatedAt"
         from public.sites
         where owner_id = $1
         order by updated_at desc`,
        [user.sub]
      );

      const sites = result.rows.map(row => ({
        ...row.siteData,
        id: row.id,
        name: row.name,
        kind: row.kind,
        templateId: row.templateId,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt
      }));

      return json(200, { sites });
    }

    if (event.httpMethod === 'POST') {
      const body = JSON.parse(event.body || '{}');
      const site = body.site;
      if (!site?.id) return json(400, { error: 'A site payload with an id is required.' });

      await client.query(
        `insert into public.sites (id, owner_id, site_name, site_kind, template_id, site_data)
         values ($1, $2, $3, $4, $5, $6::jsonb)
         on conflict (id) do update
         set site_name = excluded.site_name,
             site_kind = excluded.site_kind,
             template_id = excluded.template_id,
             site_data = excluded.site_data,
             updated_at = now()`,
        [
          site.id,
          user.sub,
          site.name || 'Untitled site',
          site.kind || 'website',
          site.templateId || null,
          JSON.stringify(site)
        ]
      );

      return json(200, { ok: true });
    }

    if (event.httpMethod === 'DELETE') {
      const body = JSON.parse(event.body || '{}');
      if (!body.id) return json(400, { error: 'Site id is required.' });
      await client.query(`delete from public.sites where id = $1 and owner_id = $2`, [body.id, user.sub]);
      return json(200, { ok: true });
    }

    return json(405, { error: 'Method not allowed.' });
  } catch (error) {
    return json(500, { error: error.message || 'Unexpected server error.' });
  } finally {
    await client.end().catch(() => {});
  }
};
