(function () {
  const APPS = {
    // Replace the href values below with your final live app URLs when needed.
    aethon: {
      href: 'https://aethon-fuel.netlify.app/'
    },
    zachfit: {
      href: ''
    },
    salesos: {
      href: ''
    }
  };

  const launchButtons = document.querySelectorAll('[data-app-launch]');
  const phoneCards = document.querySelectorAll('[data-phone-card]');
  const openButtons = document.querySelectorAll('[data-app-open]');

  function setActive(key) {
    launchButtons.forEach((button) => {
      button.classList.toggle('is-active', button.getAttribute('data-app-launch') === key);
    });
    phoneCards.forEach((card) => {
      card.classList.toggle('is-active', card.getAttribute('data-phone-card') === key);
    });
  }

  function openApp(key) {
    const config = APPS[key];
    if (!config || !config.href) return;
    window.open(config.href, '_blank', 'noopener');
  }

  launchButtons.forEach((button) => {
    const key = button.getAttribute('data-app-launch');
    button.addEventListener('click', () => {
      setActive(key);
      openApp(key);
    });
  });

  openButtons.forEach((link) => {
    const key = link.getAttribute('data-app-open');
    const config = APPS[key];
    if (config && config.href) {
      link.href = config.href;
      link.target = '_blank';
    } else {
      link.href = '/request-app/';
      link.textContent = 'Wire URL';
    }
    link.addEventListener('click', () => setActive(key));
  });
})();
