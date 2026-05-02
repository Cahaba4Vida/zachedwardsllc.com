(async function () {
  const globalMessage = document.querySelector('[data-admin-global-message]');
  const loginCard = document.querySelector('[data-admin-login-card]');
  const loginForm = document.querySelector('[data-admin-login-form]');
  const loginMessage = document.querySelector('[data-admin-login-message]');
  const appShell = document.querySelector('[data-admin-app]');
  const logoutButton = document.querySelector('[data-admin-logout]');
  const statsEl = document.querySelector('[data-admin-stats]');
  const form = document.querySelector('[data-admin-config-form]');
  const wallItemsEl = document.querySelector('[data-admin-wall-items]');
  const serviceCardsEl = document.querySelector('[data-admin-service-cards]');
  const saveState = document.querySelector('[data-admin-save-state]');
  const projectsEl = document.querySelector('[data-admin-projects]');

  const wallIds = ['ocean-study-i', 'ocean-study-ii', 'coastal-study-iii', 'alpine-study-iv', 'horizon-study-v'];
  const serviceKeys = ['websites', 'agents', 'apps', 'software', 'investing', 'project'];

  let currentConfig = null;
  let currentProjects = [];

  function setMessage(target, text, cls = '') {
    if (!target) return;
    target.className = cls ? `${target.className.split(' ')[0]} ${cls}` : target.className.split(' ')[0];
    target.textContent = text || '';
  }

  function rowTemplate(prefix, item, index, type) {
    const title = type === 'wall' ? (item.id || `wall-${index + 1}`) : (item.key || `card-${index + 1}`);
    return `
      <div class="ze-admin-editor-card">
        <div class="ze-admin-editor-card-title">${title}</div>
        <label><span>Label</span><input name="${prefix}.${index}.label" value="${escapeAttr(item.label || item.title || '')}"></label>
        <label><span>Copy</span><textarea name="${prefix}.${index}.copy" rows="3">${escapeHtml(item.copy || item.description || '')}</textarea></label>
        <label><span>Href</span><input name="${prefix}.${index}.href" value="${escapeAttr(item.href || '')}"></label>
        ${type === 'wall' ? `
          <label><span>Image path</span><input name="${prefix}.${index}.image" value="${escapeAttr(item.image || '')}"></label>
          <label><span>Frame class</span><input name="${prefix}.${index}.frameClass" value="${escapeAttr(item.frameClass || '')}"></label>
          <label><span>Title</span><input name="${prefix}.${index}.title" value="${escapeAttr(item.title || '')}"></label>
          <label><span>Price / subtitle</span><input name="${prefix}.${index}.price" value="${escapeAttr(item.price || '')}"></label>
        ` : ''}
      </div>
    `;
  }

  function escapeHtml(value) {
    return String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function escapeAttr(value) {
    return escapeHtml(value).replace(/'/g, '&#39;');
  }

  function buildForm(config) {
    currentConfig = config;
    form.elements['welcome.kicker'].value = config.welcome?.kicker || '';
    form.elements['welcome.title'].value = config.welcome?.title || '';
    form.elements['welcome.copy'].value = config.welcome?.copy || '';
    form.elements['welcome.explore_label'].value = config.welcome?.explore_label || '';
    form.elements['welcome.account_label'].value = config.welcome?.account_label || '';
    form.elements['welcome.updates_label'].value = config.welcome?.updates_label || '';
    form.elements['welcome.live_updates_url'].value = config.welcome?.live_updates_url || '';
    wallItemsEl.innerHTML = (config.wall_items || []).map((item, index) => rowTemplate('wall_items', item, index, 'wall')).join('');
    serviceCardsEl.innerHTML = (config.service_cards || []).map((item, index) => rowTemplate('service_cards', item, index, 'card')).join('');
  }

  function formToConfig() {
    const data = new FormData(form);
    const config = { welcome: {}, wall_items: [], service_cards: [] };
    config.welcome.kicker = data.get('welcome.kicker') || '';
    config.welcome.title = data.get('welcome.title') || '';
    config.welcome.copy = data.get('welcome.copy') || '';
    config.welcome.explore_label = data.get('welcome.explore_label') || '';
    config.welcome.account_label = data.get('welcome.account_label') || '';
    config.welcome.updates_label = data.get('welcome.updates_label') || '';
    config.welcome.live_updates_url = data.get('welcome.live_updates_url') || '';

    wallIds.forEach((id, i) => {
      config.wall_items.push({
        id,
        title: data.get(`wall_items.${i}.title`) || '',
        price: data.get(`wall_items.${i}.price`) || '',
        description: data.get(`wall_items.${i}.copy`) || '',
        image: data.get(`wall_items.${i}.image`) || '',
        frameClass: data.get(`wall_items.${i}.frameClass`) || '',
        href: data.get(`wall_items.${i}.href`) || '',
      });
    });

    serviceKeys.forEach((key, i) => {
      config.service_cards.push({
        key,
        label: data.get(`service_cards.${i}.label`) || '',
        copy: data.get(`service_cards.${i}.copy`) || '',
        href: data.get(`service_cards.${i}.href`) || '',
      });
    });
    return config;
  }

  function renderStats() {
    const projects = currentProjects || [];
    const completed = projects.filter((project) => project.status === 'completed').length;
    const inFlight = projects.filter((project) => ['deposit_paid', 'setup_in_progress', 'in_build', 'review'].includes(project.status)).length;
    const revenue = projects.reduce((sum, project) => sum + (Number(project.quoted_total_cents || 0) / 100), 0);
    const setupReady = projects.filter((project) => !project.setup_completed).length;

    statsEl.innerHTML = [
      ['Total projects', String(projects.length), 'Tracked inside the admin pipeline'],
      ['In flight', String(inFlight), 'Currently moving through setup/build/review'],
      ['Completed', String(completed), 'Projects marked complete'],
      ['Quoted revenue', `$${revenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}`, `${setupReady} still need setup completion`],
    ].map(([label, value, copy]) => `
      <div class="ze-admin-stat">
        <div class="ze-admin-kicker">${label}</div>
        <div class="ze-admin-stat-value">${value}</div>
        <div class="ze-admin-stat-copy">${copy}</div>
      </div>
    `).join('');
  }

  function projectCard(project) {
    return `
      <div class="ze-admin-project-card" data-project-id="${project.project_id}">
        <div class="ze-admin-project-top">
          <div>
            <div class="ze-admin-project-title">${escapeHtml(project.project_name || fallbackProjectName(project.kind))}</div>
            <div class="ze-admin-project-meta">${escapeHtml(project.email || 'No email')} · ${escapeHtml(project.classification || 'basic')} ${escapeHtml(project.kind || 'website')}</div>
          </div>
          <div class="ze-admin-project-badge">${escapeHtml(String(project.status || 'deposit_paid').replace(/_/g, ' '))}</div>
        </div>
        <div class="ze-admin-project-fields">
          <label><span>Status</span>
            <select data-project-status>
              ${['deposit_paid', 'setup_in_progress', 'in_build', 'review', 'completed'].map((status) => `<option value="${status}" ${project.status === status ? 'selected' : ''}>${status.replace(/_/g, ' ')}</option>`).join('')}
            </select>
          </label>
          <label><span>Approved</span>
            <select data-project-approved>
              <option value="false" ${!project.client_approved ? 'selected' : ''}>No</option>
              <option value="true" ${project.client_approved ? 'selected' : ''}>Yes</option>
            </select>
          </label>
          <label><span>Setup complete</span>
            <select data-project-setup>
              <option value="false" ${!project.setup_completed ? 'selected' : ''}>No</option>
              <option value="true" ${project.setup_completed ? 'selected' : ''}>Yes</option>
            </select>
          </label>
        </div>
        <div class="ze-admin-project-actions">
          <button class="ze-admin-secondary" type="button" data-project-save>Save project</button>
          <a class="ze-admin-secondary" href="/project-setup/?project_id=${project.project_id}">Open setup</a>
        </div>
      </div>
    `;
  }

  function fallbackProjectName(kind) {
    if (kind === 'app') return 'App project';
    if (kind === 'software') return 'Software project';
    return 'Website project';
  }

  async function fetchJson(url, options = {}) {
    const res = await fetch(url, {
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
      ...options,
    });
    let data = {};
    try { data = await res.json(); } catch {}
    if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
    return data;
  }

  async function loadProjects() {
    const data = await fetchJson('/.netlify/functions/admin-projects-list');
    currentProjects = data.projects || [];
    if (!currentProjects.length) {
      projectsEl.innerHTML = '<div class="ze-admin-empty">No client projects yet.</div>';
      renderStats();
      return;
    }
    projectsEl.innerHTML = currentProjects.map(projectCard).join('');
    renderStats();

    projectsEl.querySelectorAll('[data-project-save]').forEach((button) => {
      button.addEventListener('click', async () => {
        const card = button.closest('[data-project-id]');
        button.disabled = true;
        const original = button.textContent;
        button.textContent = 'Saving...';
        try {
          await fetchJson('/.netlify/functions/admin-project-update', {
            method: 'POST',
            body: JSON.stringify({
              project_id: Number(card.getAttribute('data-project-id')),
              status: card.querySelector('[data-project-status]').value,
              client_approved: card.querySelector('[data-project-approved]').value === 'true',
              setup_completed: card.querySelector('[data-project-setup]').value === 'true',
            }),
          });
          button.textContent = 'Saved';
          await loadProjects();
          setTimeout(() => { button.textContent = original; }, 900);
        } catch (error) {
          button.textContent = error.message || 'Save failed';
        } finally {
          button.disabled = false;
        }
      });
    });
  }

  async function loadAdmin() {
    const configData = await fetchJson('/.netlify/functions/admin-site-config');
    buildForm(configData.config || {});
    await loadProjects();
  }

  async function showAdmin() {
    loginCard.hidden = true;
    appShell.hidden = false;
    logoutButton.hidden = false;
    setMessage(globalMessage, 'Admin unlocked.', 'ze-admin-inline-status is-success');
    await loadAdmin();
  }

  async function checkStatus() {
    const status = await fetchJson('/.netlify/functions/admin-auth-status');
    if (!status.password_configured) {
      setMessage(globalMessage, 'Set ADMIN_PASSWORD in Netlify environment variables, then redeploy or trigger a fresh function build.', 'ze-admin-inline-status is-error');
      return;
    }
    if (status.authenticated) {
      await showAdmin();
      return;
    }
    loginCard.hidden = false;
    setMessage(globalMessage, 'Enter the admin password to unlock this page.', 'ze-admin-inline-status');
  }

  loginForm?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const button = loginForm.querySelector('button[type="submit"]');
    const password = loginForm.password.value;
    button.disabled = true;
    button.textContent = 'Unlocking...';
    setMessage(loginMessage, '');
    try {
      await fetchJson('/.netlify/functions/admin-auth-login', {
        method: 'POST',
        body: JSON.stringify({ password }),
      });
      loginForm.reset();
      await showAdmin();
    } catch (error) {
      setMessage(loginMessage, error.message || 'Unable to unlock admin.', 'ze-admin-help is-error');
    } finally {
      button.disabled = false;
      button.textContent = 'Unlock admin';
    }
  });

  logoutButton?.addEventListener('click', async () => {
    try { await fetchJson('/.netlify/functions/admin-auth-logout', { method: 'POST' }); } catch {}
    appShell.hidden = true;
    logoutButton.hidden = true;
    loginCard.hidden = false;
    setMessage(globalMessage, 'Logged out.', 'ze-admin-inline-status');
  });

  form?.addEventListener('submit', async (event) => {
    event.preventDefault();
    saveState.textContent = 'Saving...';
    try {
      currentConfig = formToConfig();
      await fetchJson('/.netlify/functions/admin-site-config', {
        method: 'POST',
        body: JSON.stringify({ config: currentConfig }),
      });
      saveState.textContent = 'Saved.';
    } catch (error) {
      saveState.textContent = error.message || 'Save failed.';
    }
  });

  await checkStatus();
})();
