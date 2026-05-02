(function () {
  const form = document.getElementById('createProjectForm');
  const result = document.getElementById('createProjectResult');
  const submitBtn = document.getElementById('createProjectSubmit');
  const kindInput = document.getElementById('projectKind');
  const typeButtons = Array.from(document.querySelectorAll('[data-project-type]'));
  const TERMS_VERSION = 'v3_2026_03_quote_acceptance';

  function showState(html, cls = '') {
    if (!result) return;
    result.className = `quote-panel quote-result quote-panel-compact ${cls}`.trim();
    result.innerHTML = html;
  }

  function dollars(cents) {
    return `$${(Number(cents || 0) / 100).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  }

  function normalizeCheckoutUrl(value) {
    const raw = String(value || '').trim();
    if (!raw) return '';
    if (/^https?:\/\//i.test(raw)) return raw;
    if (raw.startsWith('//')) return `https:${raw}`;
    if (raw.startsWith('/')) return raw;
    return `https://${raw.replace(/^\/+/, '')}`;
  }

  async function loadProfileTag() {
    const tag = document.querySelector('[data-account-chip]');
    if (!tag || !window.ZEAuth || !window.ZEAuth.whoAmI) return;
    try {
      const profile = await Promise.race([
        window.ZEAuth.whoAmI(),
        new Promise((resolve) => setTimeout(() => resolve(null), 1200))
      ]);
      if (!profile) return;
      if (profile.email) tag.textContent = profile.email;
      else if (profile.identity_type && profile.identity_type.startsWith('device')) tag.textContent = 'Device remembered';
    } catch {}
  }

  function typeLabel(kind) {
    if (kind === 'website') return 'website';
    if (kind === 'app') return 'app';
    return 'custom project';
  }

  function quoteHtml(quote, kind) {
    const monthly = quote.monthly_cents ? `${dollars(quote.monthly_cents)}/mo` : 'Handled separately';
    const deposit = dollars(quote.deposit_cents);
    const total = dollars(quote.quoted_total_cents || 0);
    const remaining = Math.max(0, Number(quote.quoted_total_cents || 0) - Number(quote.deposit_cents || 0));
    const remainingText = dollars(remaining);
    const badge = quote.classification === 'basic' ? 'Basic' : 'Custom';

    return `
      <div class="quote-head">
        <div class="quote-badge ${quote.classification}">${badge}</div>
        <h2>${quote.headline || 'Project quote ready'}</h2>
        <p>${quote.summary || ''}</p>
      </div>
      <div class="quote-grid">
        <div class="quote-metric">
          <div class="quote-label">Project quote</div>
          <div class="quote-value">${total}</div>
        </div>
        <div class="quote-metric">
          <div class="quote-label">Deposit today</div>
          <div class="quote-value">${deposit}</div>
        </div>
        <div class="quote-metric">
          <div class="quote-label">Remaining</div>
          <div class="quote-value">${remainingText}</div>
        </div>
        <div class="quote-metric">
          <div class="quote-label">Maintenance</div>
          <div class="quote-value">${monthly}</div>
        </div>
      </div>
      <div class="quote-terms">
        <p class="terms-intro">The deposit is part of the total, not an extra fee.</p>
        <p class="terms-link-row"><a href="/legal/" target="_blank" rel="noopener noreferrer">Read the project terms</a></p>
        <label class="terms-check">
          <input type="checkbox" data-terms-check>
          <span>I approve this quote and want to pay the deposit for this ${typeLabel(kind)}.</span>
        </label>
      </div>
      <div class="quote-actions">
        <button class="primary-chip quote-checkout" type="button">Pay deposit</button>
      </div>
    `;
  }

  async function startCheckout(quote) {
    const accepted = result.querySelector('[data-terms-check]')?.checked;
    if (!accepted) {
      alert('Please check the agreement box before paying the deposit.');
      return;
    }
    try {
      const data = await window.ZEAuth.api('/.netlify/functions/create-service-checkout', {
        method: 'POST',
        body: JSON.stringify({ quote_id: quote.id, accepted_terms: true, terms_version: TERMS_VERSION }),
      });
      const checkoutUrl = normalizeCheckoutUrl(data.url);
      if (!checkoutUrl) throw new Error('Checkout URL missing from server response.');
      window.location.href = checkoutUrl;
    } catch (e) {
      alert(e.message || 'Checkout failed.');
    }
  }

  function setKind(kind) {
    kindInput.value = kind;
    typeButtons.forEach((button) => {
      button.classList.toggle('is-active', button.getAttribute('data-project-type') === kind);
    });
    document.querySelectorAll('.type-group').forEach((el) => {
      const show = el.classList.contains(`type-${kind}`);
      el.hidden = !show;
      const fields = el.querySelectorAll('input, select, textarea');
      fields.forEach((field) => {
        if (el.hidden) field.removeAttribute('required');
      });
    });
    submitBtn.textContent = kind === 'website' ? 'Get website quote' : kind === 'app' ? 'Get app quote' : 'Get custom quote';
  }

  typeButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const kind = button.getAttribute('data-project-type') || 'website';
      setKind(kind);
      const nextUrl = kind === 'website' ? '/create-project/' : `/create-project/?type=${kind}`;
      window.history.replaceState({}, '', nextUrl);
    });
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    submitBtn.disabled = true;
    submitBtn.textContent = 'Reviewing...';
    showState('<div class="quote-loading"><div class="loading-dots"><span class="loading-dot"></span><span class="loading-dot"></span><span class="loading-dot"></span></div><div>Reviewing your request and preparing your quote.</div></div>');

    const payload = Object.fromEntries(new FormData(form).entries());
    payload.kind = kindInput.value;

    try {
      const data = await window.ZEAuth.api('/.netlify/functions/submit-intake', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      const quote = data.quote || {};
      showState(quoteHtml(quote, kindInput.value), 'is-ready');
      const btn = result.querySelector('.quote-checkout');
      if (btn) btn.addEventListener('click', () => startCheckout(quote));
    } catch (e) {
      showState(`<div class="quote-error">${e.message || 'Something went wrong.'}</div>`, 'is-error');
    } finally {
      setKind(kindInput.value);
      submitBtn.disabled = false;
    }
  });

  window.addEventListener('DOMContentLoaded', () => {
    const startAuth = () => {
      if (!window.ZEAuth) {
        window.setTimeout(startAuth, 120);
        return;
      }
      window.ZEAuth.initIdentity();
      window.ZEAuth.bindAuthButtons(document);
      loadProfileTag();
    };
    startAuth();

    const params = new URLSearchParams(window.location.search);
    const initial = params.get('type');
    if (initial === 'app' || initial === 'software') setKind(initial);
    else setKind('website');
  });
})();
