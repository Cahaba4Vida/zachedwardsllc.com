const { Client } = require('pg');

function json(statusCode, payload) {
  return {
    statusCode,
    headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
    body: JSON.stringify(payload)
  };
}

exports.handler = async () => {
  const connectionString = process.env.NETLIFY_DATABASE_URL || process.env.DATABASE_URL;
  if (!connectionString) return json(500, { error: 'Missing NETLIFY_DATABASE_URL environment variable.' });

  const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });
  try {
    await client.connect();
    const result = await client.query(
      `select preview_slug, site_name, business_name, gallery_note, customer_built_note, quote_json, site_snapshot, created_at, updated_at
         from public.builder_gallery_projects
        where preview_enabled = true
        order by updated_at desc
        limit 100`
    );

    const projects = result.rows.map(row => ({
      previewSlug: row.preview_slug,
      siteName: row.site_name,
      businessName: row.business_name,
      galleryNote: row.gallery_note,
      customerBuiltNote: row.customer_built_note,
      quote: row.quote_json,
      siteSnapshot: row.site_snapshot,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }));

    return json(200, { projects });
  } catch (error) {
    return json(500, { error: error.message || 'Unable to load public projects.' });
  } finally {
    await client.end().catch(() => {});
  }
};
