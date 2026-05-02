(function () {
  const STORAGE_KEY = 'ze_device_id_v1';
  const PROFILE_CACHE_KEY = 'ze_profile_cache_v1';
  const IDENTITY_READY_KEY = '__ze_identity_ready__';
  const LAST_KNOWN_USER_KEY = '__ze_last_known_user__';
  const HOME_AUTH_KEY = '__ze_home_authenticated__';

  function createRandomId() {
    const bytes = new Uint8Array(18);
    crypto.getRandomValues(bytes);
    return Array.from(bytes).map((b) => b.toString(16).padStart(2, '0')).join('');
  }

  function getDeviceId() {
    let id = localStorage.getItem(STORAGE_KEY);
    if (!id) {
      id = createRandomId();
      localStorage.setItem(STORAGE_KEY, id);
    }
    return id;
  }

  function getIdentity() {
    return window.netlifyIdentity || null;
  }

  function hasStoredIdentitySession() {
    try {
      for (let i = 0; i < localStorage.length; i += 1) {
        const key = localStorage.key(i) || '';
        if (/gotrue\.user/i.test(key) || /netlify.*identity/i.test(key)) {
          const value = localStorage.getItem(key);
          if (value && value !== 'null' && value !== 'undefined') return true;
        }
      }
    } catch {}
    return false;
  }

  function currentUser() {
    const ni = getIdentity();
    if (!ni) return null;
    try {
      return ni.currentUser();
    } catch {
      return null;
    }
  }

  function hasKnownLoggedInState() {
    try {
      return !!(
        currentUser() ||
        hasStoredIdentitySession() ||
        localStorage.getItem(LAST_KNOWN_USER_KEY) === '1' ||
        localStorage.getItem(HOME_AUTH_KEY) === '1'
      );
    } catch {
      return !!currentUser();
    }
  }

  function authHeaders(extra = {}) {
    const headers = { 'Content-Type': 'application/json', 'x-device-id': getDeviceId(), ...extra };
    const user = currentUser();
    const token = user && user.token && user.token.access_token;
    if (token) headers.Authorization = `Bearer ${token}`;
    return headers;
  }

  async function api(path, options = {}) {
    const res = await fetch(path, {
      ...options,
      headers: authHeaders(options.headers || {}),
    });
    let data = {};
    try { data = await res.json(); } catch (e) {}
    if (!res.ok) {
      throw new Error(data.error || `Request failed (${res.status})`);
    }
    return data;
  }

  function initIdentity(callback) {
    const ni = getIdentity();
    if (!ni) return;

    ni.on('init', (user) => {
      window[IDENTITY_READY_KEY] = true;
      if (user) {
        localStorage.setItem(LAST_KNOWN_USER_KEY, '1');
      localStorage.setItem(HOME_AUTH_KEY, '1');
        localStorage.setItem(HOME_AUTH_KEY, '1');
      }
      if (callback) callback('init', user || null);
    });

    ni.on('login', async (user) => {
      ni.close();
      localStorage.setItem(LAST_KNOWN_USER_KEY, '1');
      localStorage.setItem(HOME_AUTH_KEY, '1');
      try { await whoAmI(true); } catch {}
      if (callback) callback('login', user || currentUser());
    });

    ni.on('signup', async (user) => {
      ni.close();
      localStorage.setItem(LAST_KNOWN_USER_KEY, '1');
      localStorage.setItem(HOME_AUTH_KEY, '1');
      try { await whoAmI(true); } catch {}
      if (callback) callback('signup', user || currentUser());
    });

    ni.on('logout', () => {
      localStorage.removeItem(PROFILE_CACHE_KEY);
      localStorage.removeItem(LAST_KNOWN_USER_KEY);
      localStorage.removeItem(HOME_AUTH_KEY);
      if (callback) callback('logout', null);
    });

    ni.init();
  }

  async function identityReady(timeoutMs = 1800) {
    const ni = getIdentity();
    if (!ni) return null;

    const immediate = currentUser();
    if (immediate) return immediate;

    if (hasStoredIdentitySession() || localStorage.getItem(LAST_KNOWN_USER_KEY) === '1') {
      return new Promise((resolve) => {
        let done = false;
        const finish = () => {
          if (done) return;
          done = true;
          resolve(currentUser() || { stored_session: true });
        };

        try { ni.on('init', finish); } catch {}
        window.setTimeout(finish, timeoutMs);
      });
    }

    return null;
  }

  async function whoAmI(force = false) {
    if (!force) {
      const cached = localStorage.getItem(PROFILE_CACHE_KEY);
      if (cached) {
        try { return JSON.parse(cached); } catch {}
      }
    }

    try {
      const data = await api('/.netlify/functions/profile-get');
      localStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify(data));
      if (data && (data.email || data.identity_type === 'user' || data.device_known)) {
        localStorage.setItem(LAST_KNOWN_USER_KEY, '1');
      localStorage.setItem(HOME_AUTH_KEY, '1');
        localStorage.setItem(HOME_AUTH_KEY, '1');
      }
      return data;
    } catch (e) {
      const cached = localStorage.getItem(PROFILE_CACHE_KEY);
      return cached ? JSON.parse(cached) : null;
    }
  }

  async function applyOnboardingGate() {
    const root = document.documentElement;
    const overlay = document.querySelector('[data-onboarding-overlay]');
    if (!overlay) return;

    const readyUser = await identityReady();
    if (readyUser) {
      root.classList.add('has-known-account');
      overlay.hidden = true;
      return;
    }

    const profile = await whoAmI();
    if (profile && (profile.email || profile.device_known)) {
      root.classList.add('has-known-account');
      overlay.hidden = true;
      return;
    }

    root.classList.remove('has-known-account');
    overlay.hidden = false;
  }

  function bindOnboarding(root = document) {
    root.querySelectorAll('[data-onboarding-close]').forEach((el) => {
      el.addEventListener('click', (event) => {
        event.preventDefault();
        const overlay = document.querySelector('[data-onboarding-overlay]');
        if (overlay) overlay.hidden = true;
      });
    });
  }

  function bindAuthButtons(root = document) {
    const ni = getIdentity();
    if (!ni) return;
    root.querySelectorAll('[data-auth-open="login"]').forEach((el) => {
      el.addEventListener('click', (event) => {
        event.preventDefault();
        ni.open('login');
      });
    });
    root.querySelectorAll('[data-auth-open="signup"]').forEach((el) => {
      el.addEventListener('click', (event) => {
        event.preventDefault();
        ni.open('signup');
      });
    });
    root.querySelectorAll('[data-auth-logout]').forEach((el) => {
      el.addEventListener('click', async (event) => {
        event.preventDefault();
        const user = ni.currentUser();
        if (user) await user.logout();
      });
    });
  }

  window.ZEAuth = {
    api,
    getDeviceId,
    getIdentity,
    currentUser,
    hasStoredIdentitySession,
    hasKnownLoggedInState,
    identityReady,
    whoAmI,
    initIdentity,
    bindAuthButtons,
    bindOnboarding,
    applyOnboardingGate,
    authHeaders,
  };
})();
