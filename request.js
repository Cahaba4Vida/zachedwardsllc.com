(function () {
  const form = document.querySelector('[data-request-form]');
  const result = document.querySelector('[data-request-result]');
  const submitBtn = form ? form.querySelector('button[type="submit"]') : null;
  const kind = form ? form.getAttribute('data-kind') : null;
  const TERMS_VERSION = 'v3_2026_03_quote_acceptance';

  function showState(html, cls = '') {
    if (!result) return;
    result.className = `quote-panel quote-result ${cls}`.trim();
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
      document.querySelectorAll('[data-admin-only]').forEach((el) => {
        if (profile.is_admin) el.hidden = false;
      });
    } catch {}
  }

  function quoteHtml(quote, requestKindLabel) {
    const monthly = quote.monthly_cents ? `${dollars(quote.monthly_cents)}/mo` : 'Handled separately';
    const deposit = dollars(quote.deposit_cents);
    const total = dollars(quote.quoted_total_cents || 0);
    const remaining = Math.max(0, Number(quote.quoted_total_cents || 0) - Number(quote.deposit_cents || 0));
    const remainingText = dollars(remaining);
    const badge = quote.classification === 'basic' ? 'Basic' : 'Custom';
    const validText = quote.quote_valid_days ? `This quote is intended to stay valid for ${quote.quote_valid_days} days unless scope changes.` : '';
    const postApprovalLine = requestKindLabel === 'website'
      ? 'Maintenance for basic websites is handled separately after delivery and approval. You can send the subscription link manually when the project is ready.'
      : requestKindLabel === 'app'
      ? 'Maintenance for basic apps is handled separately after delivery and approval. You can send the subscription link manually when the project is ready.'
      : 'Maintenance and support for software projects are handled separately if needed after scope confirmation and delivery.';

    return `
      <div class="quote-head">
        <div class="quote-badge ${quote.classification}">${badge}</div>
        <h2>${quote.headline || 'Project quote ready'}</h2>
        <p>${quote.summary || ''}</p>
      </div>
      <div class="quote-grid">
        <div class="quote-metric">
          <div class="quote-label">Actual project quote</div>
          <div class="quote-value">${total}</div>
        </div>
        <div class="quote-metric">
          <div class="quote-label">Deposit due now</div>
          <div class="quote-value">${deposit}</div>
        </div>
        <div class="quote-metric">
          <div class="quote-label">Remaining after deposit</div>
          <div class="quote-value">${remainingText}</div>
        </div>
        <div class="quote-metric">
          <div class="quote-label">Post-completion maintenance</div>
          <div class="quote-value">${monthly}</div>
        </div>
      </div>
      <div class="quote-terms">
        <h3>Quote terms</h3>
        <p class="terms-intro">This quote is the actual project quote tied to this request. The deposit is part of that total, not an extra fee on top. Ongoing maintenance starts after the project is complete and approved.</p>
        <div class="terms-copy">
          <p><strong>Quoted project total:</strong> ${total}</p>
          <p><strong>Deposit collected now:</strong> ${deposit}</p>
          <p><strong>Remaining balance after deposit:</strong> ${remainingText}</p>
          <p>${postApprovalLine}</p>
          <p>${validText}</p>
          <p>If the scope changes, the quote may need to be updated before the project is finished.</p>
        </div>
        <p class="terms-link-row"><a href="/legal/" target="_blank" rel="noopener noreferrer">Read the project terms</a></p>
        <label class="terms-check">
          <input type="checkbox" data-terms-check>
          <span>By checking this box, I agree to the quoted total of ${total}, the deposit due today of ${deposit}, the remaining balance shown above, and the project terms linked here.</span>
        </label>
      </div>
      <div class="quote-actions">
        <button class="primary-chip quote-checkout" type="button">Pay deposit</button>
      </div>
    `;
  }

  if (!form || !kind) {
    loadProfileTag();
    return;
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    submitBtn.disabled = true;
    submitBtn.textContent = 'Reviewing...';
    showState('<div class="quote-loading"><div class="loading-dots"><span class="loading-dot"></span><span class="loading-dot"></span><span class="loading-dot"></span></div><div>Reviewing your request and preparing your quote.</div></div>');

    const payload = Object.fromEntries(new FormData(form).entries());
    payload.kind = kind;

    try {
      const data = await window.ZEAuth.api('/.netlify/functions/submit-intake', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      const quote = data.quote || {};
      showState(quoteHtml(quote, kind), 'is-ready');
      const btn = result.querySelector('.quote-checkout');
      if (btn) btn.addEventListener('click', () => startCheckout(quote));
    } catch (e) {
      showState(`<div class="quote-error">${e.message || 'Something went wrong.'}</div>`, 'is-error');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = kind === 'website' ? 'Review website request' : kind === 'app' ? 'Review app request' : 'Review software request';
    }
  });

  loadProfileTag();
})();
