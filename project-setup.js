(async function () {
  const form = document.querySelector('[data-project-setup-form]');
  const result = document.querySelector('[data-project-setup-result]');
  const projectChip = document.querySelector('[data-setup-project-chip]');
  const projectId = new URLSearchParams(window.location.search).get('project_id');

  function show(html, cls = '') {
    if (!result) return;
    result.className = `quote-panel ${cls}`.trim();
    result.innerHTML = html;
  }

  if (!projectId) {
    show('<div class="quote-error">Missing project_id. Open this page from the account dashboard.</div>', 'is-error');
    return;
  }

  async function loadExisting() {
    try {
      const data = await window.ZEAuth.api(`/.netlify/functions/project-setup-get?project_id=${encodeURIComponent(projectId)}`);
      if (projectChip) projectChip.textContent = data.project?.project_name || 'Project setup';
      if (data.project?.project_name) form.querySelector('[name="project_name"]').value = data.project.project_name;
      const answers = data.answers || {};
      Object.entries(answers).forEach(([key, value]) => {
        const field = form.querySelector(`[name="${key}"]`);
        if (field && value != null) field.value = value;
      });
      show(`
        <div class="quote-placeholder">
          <h2>${data.project?.project_name || 'Project setup'}</h2>
          <ol>
            <li>Project status: ${String(data.project?.status || 'deposit_paid').replace(/_/g, ' ')}</li>
            <li>Setup completion: ${data.project?.setup_completed ? 'Completed' : 'Needs input'}</li>
            <li>Save this form any time to update the kickoff details.</li>
          </ol>
        </div>
      `);
    } catch (e) {
      show(`<div class="quote-error">${e.message || 'Unable to load project setup.'}</div>`, 'is-error');
    }
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const btn = form.querySelector('button[type="submit"]');
    btn.disabled = true;
    btn.textContent = 'Saving...';
    try {
      const payload = Object.fromEntries(new FormData(form).entries());
      payload.project_id = projectId;
      await window.ZEAuth.api('/.netlify/functions/project-setup-save', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      show(`
        <div class="quote-result is-ready">
          <div class="quote-badge basic">Saved</div>
          <h2>Project setup saved</h2>
          <p>Your kickoff details are now attached to the project. You can return to the account dashboard to see the updated status.</p>
          <div class="quote-actions">
            <a class="primary-chip" href="/account/">Return to account</a>
          </div>
        </div>
      `, 'is-ready');
    } catch (e) {
      show(`<div class="quote-error">${e.message || 'Unable to save project setup.'}</div>`, 'is-error');
    } finally {
      btn.disabled = false;
      btn.textContent = 'Save project setup';
    }
  });

  window.ZEAuth.initIdentity(() => window.location.reload());
  window.ZEAuth.bindAuthButtons(document);
  loadExisting();
})();
