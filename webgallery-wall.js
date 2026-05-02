(function () {
  const scrollEl = document.getElementById('webWallScroll');
  const trackEl = document.getElementById('webWallTrack');
  if (!scrollEl || !trackEl) return;

  const websiteItems = [
    {
      type: 'website',
      title: 'ZachEdwardsLLC.com',
      badge: 'Portfolio / Brand',
      href: 'https://zachedwardsllc.com/',
      preview: '/assets/ocean-study-i.webp',
      frameClass: 'frame-one'
    },
    {
      type: 'cta',
      title: 'Build Your Own Website / Web App',
      badge: 'New module / Start here',
      href: '/build-your-own/',
      actionLabel: 'Launch builder',
      panelClass: 'build-module-panel',
      typeLabel: 'Interactive builder',
      copy: 'Start a guided build flow for your own website or web app. Scope, price, and build your own website or web app inside a dedicated builder workspace.',
      chips: ['Website', 'Web app', 'Guided build']
    },
    {
      type: 'website',
      title: 'SawtoothThrift.com',
      badge: 'Store / Catalog',
      href: 'https://sawtooththrift.com/',
      iframe: 'https://sawtooththrift.com/',
      preview: '/assets/web-design.png',
      frameClass: 'frame-two'
    },
    {
      type: 'website',
      title: 'EdwardsHomeBuilders.com',
      badge: 'Local Service',
      href: 'https://edwardshomebuilders.com/',
      iframe: 'https://edwardshomebuilders.com/',
      mobilePreview: '/assets/edwards-mobile-preview.jpg',
      preview: '/assets/apps.png',
      frameClass: 'frame-three'
    },
    {
      type: 'website',
      title: 'AshNails.netlify.app',
      badge: 'Lead Capture',
      href: 'https://ashnails.netlify.app/',
      preview: '/assets/smart-software.png',
      frameClass: 'frame-four'
    },
    {
      type: 'website',
      title: 'NickEdwardsOfficial.com',
      badge: 'Creator / Brand',
      href: 'https://nickedwardsofficial.com/',
      iframe: 'https://nickedwardsofficial.com/',
      mobilePreview: '/assets/nick-mobile-preview.jpg',
      preview: '/assets/agentic-ai.png',
      frameClass: 'frame-five'
    }
  ];

  const softwareItems = [
    {
      type: 'software',
      title: 'Portable AI SSD',
      badge: 'Remote work / Offline AI',
      href: '/software/jarvas-local/unlock/',
      actionLabel: 'Buy offline AI',
      panelClass: 'software-gallery-panel-blue',
      thumbClass: 'software-thumb-ai software-thumb-has-image',
      thumbImage: '/assets/portable-ai-ssd-preview.png',
      typeLabel: 'Portable AI',
      copy: 'A faster offline local AI setup built for remote work, travel, and private use when you want the most premium portable version.',
      chips: ['SSD setup', 'Offline-first']
    },
    {
      type: 'software',
      title: 'Portable AI Flash Drive',
      badge: 'Entry option / Small model',
      href: '/software/jarvas-local/unlock/',
      actionLabel: 'Buy offline AI',
      panelClass: 'software-gallery-panel-orange',
      thumbClass: 'software-thumb-flash software-thumb-has-image',
      thumbImage: '/assets/portable-ai-flash-preview.png',
      typeLabel: 'Portable AI',
      copy: 'A lighter low-cost portable version for simple local AI use, quick handoff, and an easier entry price for first-time buyers.',
      chips: ['Flash drive', 'Portable']
    },
    {
      type: 'software',
      title: 'Jarvas Desktop for Windows',
      badge: 'Local desktop app / Windows',
      href: '/software/jarvas-local/',
      actionLabel: 'Install for Windows',
      panelClass: 'software-gallery-panel-gray',
      thumbClass: 'software-thumb-companion software-thumb-has-image',
      thumbImage: '/assets/jarvas-local/background.png',
      typeLabel: 'Jarvas desktop',
      copy: 'A local Windows desktop package for Jarvas with a batch installer, local Ollama support, image attachments, chat, and a coding workspace.',
      chips: ['Windows install', 'Local desktop']
    },
    {
      type: 'software',
      title: 'Admin + Support Dashboard',
      badge: 'Accounts / Updates / Support',
      href: '/websites/?filter=software',
      actionLabel: 'View concept',
      panelClass: 'software-gallery-panel-purple',
      thumbClass: 'software-thumb-portal software-thumb-has-image',
      thumbImage: '/assets/admin-support-dashboard-preview.png',
      typeLabel: 'Client-facing software',
      copy: 'The admin side for accounts, rollout, payments, support, and future updates once the portable AI offer grows into a fuller platform.',
      chips: ['Portal', 'Dashboards']
    }
  ];

  const appItems = [
    {
      type: 'app',
      title: 'Aethon Fuel',
      badge: 'AI Fitness App',
      href: '/apps/aethon/',
      icon: '/assets/aethon/aethon-icon.jpg',
      frameClass: 'app-frame-aethon mixed-gallery-app-frame'
    },
    {
      type: 'app',
      title: 'Jarvas AI',
      badge: 'AI Web App',
      href: '/apps/jarvas/',
      icon: '/assets/jarvas-icon.png',
      frameClass: 'app-frame-jarvas mixed-gallery-app-frame'
    }
  ];

  const isMobile = window.innerWidth < 768;
  const ua = navigator.userAgent || '';
  const isIOS = /iPad|iPhone|iPod/i.test(ua);
  const isSafari = /^((?!chrome|android|crios|fxios|edgios).)*safari/i.test(ua);
  const useNickStillPreview = isIOS || isSafari;

  const filterButtons = Array.from(document.querySelectorAll('[data-work-filter]'));
  let currentFilter = 'all';

  function itemsForFilter(filter) {
    if (filter === 'app') return appItems;
    if (filter === 'website') return websiteItems;
    if (filter === 'software') return softwareItems;
    return [...websiteItems, ...softwareItems, ...appItems];
  }

  function offsetsFor(filter) {
    if (filter === 'app') {
      return {
        segmentWidth: isMobile ? 1360 : 1960,
        offsets: isMobile ? [110, 520] : [360, 980],
        focusIndex: 0,
        focusWidth: isMobile ? 228 : 288
      };
    }
    if (filter === 'website') {
      return {
        segmentWidth: isMobile ? 2620 : 3720,
        offsets: isMobile ? [20, 340, 710, 1120, 1510, 1880] : [110, 560, 1030, 1690, 2235, 2785],
        focusIndex: 1,
        focusWidth: isMobile ? 224 : 320
      };
    }
    if (filter === 'software') {
      return {
        segmentWidth: isMobile ? 2380 : 3260,
        offsets: isMobile ? [24, 590, 1156, 1722] : [120, 860, 1600, 2340],
        focusIndex: 1,
        focusWidth: isMobile ? 224 : 320
      };
    }
    return {
      segmentWidth: isMobile ? 4320 : 6400,
      offsets: isMobile ? [20, 340, 710, 1120, 1510, 1880, 2210, 2470, 2730, 2990, 3310, 3610] : [110, 560, 1030, 1690, 2235, 2785, 3325, 3705, 4085, 4465, 4925, 5455],
      focusIndex: 1,
      focusWidth: isMobile ? 224 : 320
    };
  }

  function softwareHtml(item) {
    const chips = (item.chips || []).map((chip) => `<span class="thumb-badge">${chip}</span>`).join('');
    const thumbMedia = item.thumbImage
      ? `<img class="software-thumb-image" src="${item.thumbImage}" alt="${item.title} preview"><div class="software-thumb-scrim"></div>`
      : `
            <div class="software-thumb-chip"></div>
            <div class="software-thumb-bar"></div>
            <div class="software-thumb-card"></div>
            <div class="software-thumb-flash-body"></div>
            <div class="software-thumb-flash-cap"></div>
            <div class="software-thumb-flash-glow"></div>
            <div class="software-thumb-panel">
              <div class="software-thumb-line"></div>
            </div>`;
    return `
      <a class="software-gallery-link" href="${item.href}">
        <article class="project-card software-gallery-card ${item.panelClass}">
          <div class="project-thumb ${item.thumbClass}">
            ${thumbMedia}
            <div class="thumb-overlay">${chips}</div>
          </div>
          <div class="project-body">
            <div class="project-type">${item.typeLabel}</div>
            <h2 class="project-name">${item.title}</h2>
            <p class="project-copy">${item.copy}</p>
            <div class="software-gallery-actions">
              <span class="software-gallery-button">${item.actionLabel}</span>
            </div>
          </div>
        </article>
      </a>
    `;
  }

  function mediaHtml(item) {
    if (item.type === 'software') return softwareHtml(item);

    if (item.type === 'cta') {
      const chips = (item.chips || []).map((chip) => `<span class="thumb-badge">${chip}</span>`).join('');
      return `
        <a class="software-gallery-link" href="${item.href}">
          <article class="project-card software-gallery-card build-module-card ${item.panelClass}">
            <div class="project-thumb build-module-thumb">
              <div class="build-module-orb build-module-orb-one"></div>
              <div class="build-module-orb build-module-orb-two"></div>
              <div class="build-module-grid"></div>
              <div class="build-module-window">
                <span></span><span></span><span></span>
              </div>
              <div class="thumb-overlay">${chips}</div>
            </div>
            <div class="project-body">
              <div class="project-type">${item.typeLabel}</div>
              <h2 class="project-name">${item.title}</h2>
              <p class="project-copy">${item.copy}</p>
              <div class="software-gallery-actions">
                <span class="software-gallery-button build-module-button">${item.actionLabel}</span>
              </div>
            </div>
          </article>
        </a>
      `;
    }

    if (item.type === 'app') {
      const externalAttrs = /^https?:\/\//.test(item.href) ? 'target="_blank" rel="noopener noreferrer"' : '';
      return `
        <a class="app-icon-shell-link" href="${item.href}" ${externalAttrs}>
          <div class="frame-shell app-icon-shell">
            <div class="app-icon-wrap">
              <img class="app-gallery-icon" src="${item.icon}" alt="${item.title} icon">
            </div>
            <div class="app-icon-footer">
              <div class="app-icon-meta">
                <span class="app-icon-badge">${item.badge}</span>
                <strong>${item.title}</strong>
              </div>
            </div>
          </div>
        </a>
      `;
    }

    const shouldUseStillPreview = item.title === 'NickEdwardsOfficial.com' && useNickStillPreview;
    const media = item.iframe && !shouldUseStillPreview
      ? `<div class="webgallery-iframe-scale"><iframe class="webgallery-frame-media" src="${item.iframe}" title="${item.title}" loading="lazy"></iframe></div>`
      : `<img class="webgallery-frame-media" src="${item.mobilePreview || item.preview}" alt="${item.title} preview">`;

    return `
      <div class="drop-shadow"></div>
      <div class="frame-shell">
        <div class="art-wrap webgallery-art-wrap">
          ${media}
        </div>
        <div class="webgallery-frame-footer">
          <div class="webgallery-frame-meta">
            <span class="webgallery-frame-badge">${item.badge}</span>
            <strong>${item.title}</strong>
          </div>
          <div class="webgallery-frame-actions">
            <a class="webgallery-open-link" href="${item.href}" ${/^https?:\/\//.test(item.href) ? 'target="_blank" rel="noopener noreferrer"' : ''}>${/^https?:\/\//.test(item.href) ? 'Open live' : 'Open app'}</a>
          </div>
        </div>
      </div>
    `;
  }

  function render(filter) {
    currentFilter = filter;
    trackEl.innerHTML = '';
    const items = itemsForFilter(filter);
    const { segmentWidth, offsets, focusIndex, focusWidth } = offsetsFor(filter);
    const repeats = filter === 'app' ? 5 : filter === 'software' ? 4 : 3;
    const repeated = [];
    for (let i = 0; i < repeats; i += 1) repeated.push(...items);

    trackEl.style.width = `${segmentWidth * repeats}px`;
    trackEl.style.minWidth = `${segmentWidth * repeats}px`;

    repeated.forEach((item, index) => {
      const block = index % items.length;
      const group = Math.floor(index / items.length);
      const left = group * segmentWidth + (offsets[block] || 0);

      const frame = document.createElement('article');
      frame.className = item.type === 'app'
        ? `wall-frame app-icon-frame ${item.frameClass}`
        : item.type === 'software' || item.type === 'cta'
          ? `wall-frame software-gallery-frame ${item.panelClass}`
          : `wall-frame webgallery-frame ${item.frameClass}`;
      frame.style.left = `${left}px`;
      frame.innerHTML = mediaHtml(item);
      trackEl.appendChild(frame);
    });

    const middleStart = segmentWidth;
    const viewportCenterOffset = Math.max(0, (window.innerWidth - focusWidth) / 2);
    const initialScroll = middleStart + (offsets[focusIndex] || 0) - viewportCenterOffset;
    scrollEl.scrollLeft = Math.max(0, initialScroll);

    filterButtons.forEach((button) => {
      button.classList.toggle('is-active', button.getAttribute('data-work-filter') === filter);
    });

    const nextUrl = filter === 'all' ? '/websites/' : filter === 'software' ? '/websites/?filter=software' : `/websites/?filter=${filter}s`;
    window.history.replaceState({}, '', nextUrl);
  }

  filterButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const filter = button.getAttribute('data-work-filter') || 'all';
      render(filter);
    });
  });

  const params = new URLSearchParams(window.location.search);
  const initialParam = params.get('filter');
  if (initialParam === 'apps') render('app');
  else if (initialParam === 'websites') render('website');
  else if (initialParam === 'software' || initialParam === 'smart-software' || initialParam === 'smartsoftware') render('software');
  else render('all');

  const handleLoop = () => {
    const { segmentWidth } = offsetsFor(currentFilter);
    if (scrollEl.scrollLeft < segmentWidth * 0.5) {
      scrollEl.scrollLeft += segmentWidth;
    } else if (scrollEl.scrollLeft > segmentWidth * 1.5) {
      scrollEl.scrollLeft -= segmentWidth;
    }
  };

  scrollEl.addEventListener('scroll', handleLoop);

  scrollEl.addEventListener('wheel', (event) => {
    if (Math.abs(event.deltaY) > Math.abs(event.deltaX)) {
      event.preventDefault();
      scrollEl.scrollLeft += event.deltaY;
    }
  }, { passive: false });

  let isDown = false;
  let startX = 0;
  let startScrollLeft = 0;

  scrollEl.addEventListener('pointerdown', (event) => {
    if (event.target.closest('iframe') || event.target.closest('a')) return;
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
