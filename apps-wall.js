(function () {
  const scrollEl = document.getElementById('appsWallScroll');
  const trackEl = document.getElementById('appsWallTrack');
  if (!scrollEl || !trackEl) return;

  const items = [
    {
      title: 'Aethon Fuel',
      badge: 'AI Fitness App',
      href: '/apps/aethon/',
      icon: '/assets/aethon/aethon-icon.jpg',
      frameClass: 'app-frame-aethon'
    },
    {
      title: 'Jarvas AI',
      badge: 'AI Web App',
      href: '/apps/jarvas/',
      icon: '/assets/jarvas-icon.png',
      frameClass: 'app-frame-jarvas'
    }
  ];

  const isMobile = window.innerWidth < 768;
  const segmentWidth = isMobile ? 1360 : 1960;
  const repeats = 5;
  const repeated = [];
  for (let i = 0; i < repeats; i += 1) repeated.push(...items);

  const desktopOffsets = [360, 980];
  const mobileOffsets = [110, 520];
  const leftOffsets = isMobile ? mobileOffsets : desktopOffsets;

  trackEl.style.width = `${segmentWidth * repeats}px`;
  trackEl.style.minWidth = `${segmentWidth * repeats}px`;

  repeated.forEach((item, index) => {
    const block = index % items.length;
    const group = Math.floor(index / items.length);
    const left = group * segmentWidth + (leftOffsets[block] || 0);

    const frame = document.createElement('article');
    frame.className = `wall-frame app-icon-frame ${item.frameClass}`;
    frame.style.left = `${left}px`;

    frame.innerHTML = `
      <div class="drop-shadow"></div>
      <a class="app-icon-shell-link" href="${item.href}" ${/^https?:\/\//.test(item.href) ? 'target="_blank" rel="noopener noreferrer"' : ''}>
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

    trackEl.appendChild(frame);
  });

  const middleStart = segmentWidth;
  const focusWidth = isMobile ? 210 : 268;
  const viewportCenterOffset = Math.max(0, (window.innerWidth - focusWidth) / 2);
  const initialScroll = middleStart + (leftOffsets[0] || 0) - viewportCenterOffset;
  scrollEl.scrollLeft = Math.max(0, initialScroll);

  const handleLoop = () => {
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
    if (event.target.closest('a')) return;
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
