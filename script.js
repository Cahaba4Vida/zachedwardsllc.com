(async function () {
  async function getConfig() {
    const [fallbackProductsRes, publicConfigRes] = await Promise.all([
      fetch('/products.json'),
      fetch('/.netlify/functions/site-config-public').catch(() => null),
    ]);

    const fallbackProducts = await fallbackProductsRes.json();
    let publicConfig = {};
    if (publicConfigRes && publicConfigRes.ok) {
      publicConfig = await publicConfigRes.json();
    } else {
      try {
        publicConfig = await (await fetch('/site-config.json')).json();
      } catch (e) {
        publicConfig = {};
      }
    }

    const config = publicConfig.config || publicConfig || {};
    return {
      products: Array.isArray(config.wall_items) && config.wall_items.length ? config.wall_items : fallbackProducts,
      config,
    };
  }

  function applyExternalBehavior(el, href) {
    if (!el) return;
    const isExternal = /^https?:\/\//.test(href || '');
    if (isExternal) {
      el.setAttribute('rel', 'noopener noreferrer');
      el.setAttribute('target', '_blank');
    } else {
      el.removeAttribute('target');
      el.removeAttribute('rel');
    }
  }

  function applyHomeConfig(config) {
    if (!config) return;
    const welcome = config.welcome || {};
    const liveUpdatesUrl = welcome.live_updates_url || 'https://jarvas-auto-updates.netlify.app/';

    const kicker = document.querySelector('[data-home-kicker]');
    const title = document.querySelector('[data-home-title]');
    const copy = document.querySelector('[data-home-copy]');
    const explore = document.querySelector('[data-home-explore]');
    const account = document.querySelector('[data-home-account]');
    const updates = document.querySelector('[data-home-updates]');

    if (kicker && welcome.kicker) kicker.textContent = welcome.kicker;
    if (title && welcome.title) title.textContent = welcome.title;
    if (copy && welcome.copy) copy.textContent = welcome.copy;
    if (explore && welcome.explore_label) explore.textContent = welcome.explore_label;
    if (account && welcome.account_label) account.textContent = welcome.account_label;
    if (updates && welcome.updates_label) updates.textContent = welcome.updates_label;

    document.querySelectorAll('[data-live-updates-link]').forEach((link) => {
      link.href = liveUpdatesUrl;
      applyExternalBehavior(link, liveUpdatesUrl);
    });

    (config.service_cards || []).forEach((item) => {
      const card = document.querySelector(`[data-service-card="${item.key}"]`);
      if (!card) return;
      card.href = item.href || '#';
      applyExternalBehavior(card, item.href || '');
      const label = card.querySelector('[data-service-label]');
      const copyNode = card.querySelector('[data-service-copy]');
      if (label && item.label) label.textContent = item.label;
      if (copyNode && item.copy) copyNode.textContent = item.copy;
    });
  }

  const { products, config } = await getConfig();
  applyHomeConfig(config);

  if (window.ZEAuth && window.ZEAuth.whoAmI) {
    window.ZEAuth.whoAmI().then((profile) => {
      document.querySelectorAll('[data-admin-only]').forEach((el) => {
        if (profile?.is_admin) el.hidden = false;
      });
    }).catch(() => {});
  }

  const scrollEl = document.getElementById('wallScroll');
  const trackEl = document.getElementById('wallTrack');
  if (!scrollEl || !trackEl) return;

  const isMobile = window.innerWidth < 768;
  const segmentWidth = isMobile ? 1440 : 2860;
  const repeats = 3;
  const repeated = [];
  for (let i = 0; i < repeats; i += 1) repeated.push(...products);

  const desktopOffsets = [130, 610, 1115, 1620, 2125];
  const mobileOffsets = [48, 285, 530, 775, 1020];
  const leftOffsets = isMobile ? mobileOffsets : desktopOffsets;

  trackEl.style.width = `${segmentWidth * repeats}px`;
  trackEl.style.minWidth = `${segmentWidth * repeats}px`;

  repeated.forEach((product, index) => {
    const block = index % products.length;
    const group = Math.floor(index / products.length);
    const left = group * segmentWidth + (leftOffsets[block] || 0);

    const frame = document.createElement('a');
    frame.className = `wall-frame ${product.frameClass}`;
    frame.href = product.href || `/products/${product.id}/`;
    frame.style.left = `${left}px`;
    frame.setAttribute('aria-label', `Open ${product.title}`);
    applyExternalBehavior(frame, frame.href);

    frame.innerHTML = `
      <div class="drop-shadow"></div>
      <div class="frame-shell">
        <div class="art-wrap">
          <img src="${product.image}" alt="${product.title}">
        </div>
      </div>
    `;

    trackEl.appendChild(frame);
  });

  const middleStart = segmentWidth;
  scrollEl.scrollLeft = middleStart;

  const handleLoop = () => {
    if (scrollEl.scrollLeft < segmentWidth * 0.5) {
      scrollEl.scrollLeft += segmentWidth;
    } else if (scrollEl.scrollLeft > segmentWidth * 1.5) {
      scrollEl.scrollLeft -= segmentWidth;
    }
  };

  scrollEl.addEventListener('scroll', () => {
    handleLoop();
  });

  scrollEl.addEventListener(
    'wheel',
    (event) => {
      if (Math.abs(event.deltaY) > Math.abs(event.deltaX)) {
        event.preventDefault();
        scrollEl.scrollLeft += event.deltaY;
      }
    },
    { passive: false }
  );

  let isDown = false;
  let startX = 0;
  let startScrollLeft = 0;

  scrollEl.addEventListener('pointerdown', (event) => {
    hideWelcomeIfMoved();
    isDown = true;
    scrollEl.classList.add('is-dragging');
    startX = event.clientX;
    startScrollLeft = scrollEl.scrollLeft;
  });

  window.addEventListener('pointerup', () => {
    isDown = false;
    scrollEl.classList.remove('is-dragging');
  });

  window.addEventListener('pointermove', (event) => {
    if (!isDown) return;
    const dx = event.clientX - startX;
    scrollEl.scrollLeft = startScrollLeft - dx;
  });
})();
