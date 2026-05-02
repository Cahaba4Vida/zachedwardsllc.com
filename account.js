(async function () {
  const authSummary = document.querySelector('[data-auth-summary]');
  const devicesList = document.querySelector('[data-devices]');
  const quotesList = document.querySelector('[data-quotes]');
  const projectsList = document.querySelector('[data-projects]');
  const banner = document.querySelector('[data-account-banner]');

  function fmtCurrency(cents) {
    if (cents == null) return '—';
    return `$${(Number(cents) / 100).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
  }

  function renderEmpty(el, text) {
    if (!el) return;
    el.innerHTML = `<div class="empty-state">${text}</div>`;
  }

  async function verifyCheckoutIfNeeded() {
    const params = new URLSearchParams(window.location.search);
    const status = params.get('checkout');
    const sessionId = params.get('session_id');
    if (status !== 'success' || !sessionId) return null;

    try {
      const data = await window.ZEAuth.api('/.netlify/functions/verify-service-checkout', {
        method: 'POST',
        body: JSON.stringify({ session_id: sessionId }),
      });
      params.delete('checkout');
      params.delete('session_id');
      const next = window.location.pathname + (params.toString() ? `?${params.toString()}` : '');
      window.history.replaceState({}, '', next);
      return data.project || null;
    } catch (e) {
      return { error: e.message || 'Unable to verify checkout.' };
    }
  }

  function showBanner(project) {
    if (!banner || !project) return;
    banner.hidden = false;
    if (project.error) {
      banner.className = 'account-banner is-error';
      banner.innerHTML = `<div><strong>Checkout needs attention.</strong><span>${project.error}</span></div>`;
      return;
    }
    const setupHref = project.project_id ? `/project-setup/?project_id=${project.project_id}` : '/account/';
    banner.className = 'account-banner is-success';
    banner.innerHTML = `
      <div>
        <strong>Deposit received.</strong>
        <span>Your project is now in the dashboard. The next step is to complete the setup handoff so the build can begin cleanly.</span>
      </div>
      <a class="primary-chip" href="${setupHref}">Complete project setup</a>
    `;
  }

  try {
    const verifiedProject = await verifyCheckoutIfNeeded();
    if (verifiedProject) showBanner(verifiedProject);

    const profile = await window.ZEAuth.whoAmI();
    if (authSummary) {
      authSummary.innerHTML = `
        <div class="account-line"><strong>Status:</strong> ${profile?.email ? 'Signed in' : 'Remembered device'}</div>
        <div class="account-line"><strong>Email:</strong> ${profile?.email || 'Not attached yet'}</div>
        <div class="account-line"><strong>Interests:</strong> ${profile?.interests?.join(', ') || 'Not set yet'}</div>
        <div class="account-line"><strong>Onboarding:</strong> ${profile?.onboarding_complete ? 'Completed' : 'Not completed'}</div>
      `;
      document.querySelectorAll('[data-admin-only]').forEach((el) => {
        if (profile?.is_admin) el.hidden = false;
      });
    }

    const devices = await window.ZEAuth.api('/.netlify/functions/devices-list').catch(() => ({ devices: [] }));
    if (!devices.devices || !devices.devices.length) {
      renderEmpty(devicesList, 'No devices linked yet.');
    } else {
      devicesList.innerHTML = devices.devices.map((d) => `
        <div class="account-card-row">
          <div>
            <div class="row-title">${d.device_name || 'Remembered device'}</div>
            <div class="row-meta">${d.device_id.slice(0, 10)}…</div>
          </div>
          <div class="row-tag ${d.is_current ? 'is-current' : ''}">${d.is_current ? 'Current' : 'Linked'}</div>
        </div>
      `).join('');
    }

    const projects = await window.ZEAuth.api('/.netlify/functions/client-projects-list').catch(() => ({ projects: [] }));
    if (!projects.projects || !projects.projects.length) {
      renderEmpty(projectsList, 'No paid projects yet. Once a deposit goes through, the project will appear here.');
    } else {
      projectsList.innerHTML = projects.projects.map((p) => {
        const setupHref = `/project-setup/?project_id=${p.project_id}`;
        return `
          <div class="project-status-card">
            <div class="project-status-head">
              <div>
                <div class="row-title">${p.project_name || (p.kind === 'website' ? 'Website project' : p.kind === 'app' ? 'App project' : 'Software project')}</div>
                <div class="row-meta">${p.classification} ${p.kind} · created ${new Date(p.created_at).toLocaleDateString()}</div>
              </div>
              <div class="row-tag status-${p.status}">${String(p.status || 'pending').replace(/_/g, ' ')}</div>
            </div>
            <div class="project-status-grid">
              <div><span>Quoted total</span><strong>${p.quoted_total_cents ? fmtCurrency(p.quoted_total_cents) : 'TBD'}</strong></div>
              <div><span>Deposit</span><strong>${p.deposit_paid ? 'Paid' : 'Pending'}</strong></div>
              <div><span>Maintenance</span><strong>${p.maintenance_cents ? fmtCurrency(p.maintenance_cents) + '/mo' : 'TBD'}</strong></div>
              <div><span>Setup</span><strong>${p.setup_completed ? 'Completed' : 'Needs handoff'}</strong></div>
            </div>
            <div class="project-status-copy">${p.next_step || 'Project is waiting for the next status update.'}</div>
            <div class="project-links compact">
              <a class="link-button" href="${setupHref}">${p.setup_completed ? 'Update setup details' : 'Complete project setup'}</a>
            </div>
          </div>
        `;
      }).join('');
    }

    const quotes = await window.ZEAuth.api('/.netlify/functions/quotes-list').catch(() => ({ quotes: [] }));
    if (!quotes.quotes || !quotes.quotes.length) {
      renderEmpty(quotesList, 'No requests yet.');
    } else {
      quotesList.innerHTML = quotes.quotes.map((q) => `
        <div class="account-card-row">
          <div>
            <div class="row-title">${q.kind === 'website' ? 'Website request' : q.kind === 'app' ? 'App request' : 'Software request'} · ${q.classification}</div>
            <div class="row-meta">${q.created_at ? new Date(q.created_at).toLocaleString() : ''}</div>
          </div>
          <div class="quote-mini">
            <div>${fmtCurrency(q.quoted_total_cents)}</div>
            <div class="row-meta">Deposit ${fmtCurrency(q.deposit_cents)}</div>
            <div class="row-meta">${q.monthly_cents ? fmtCurrency(q.monthly_cents) + '/mo' : 'Handled separately'}</div>
            <div class="row-meta">${q.status || 'pending'}</div>
          </div>
        </div>
      `).join('');
    }
  } catch (e) {
    if (authSummary) authSummary.innerHTML = `<div class="empty-state">${e.message}</div>`;
    renderEmpty(devicesList, 'Unable to load devices.');
    renderEmpty(projectsList, 'Unable to load projects.');
    renderEmpty(quotesList, 'Unable to load requests.');
  }
})();
