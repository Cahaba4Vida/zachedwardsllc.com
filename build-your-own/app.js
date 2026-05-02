
import { TEMPLATE_PRESETS, buildSiteFromTemplate, makeBlankSite, deepClone } from './templates.js';

const LS_KEY = 'site_studio_local_v1';
const DEVICE_WIDTHS = { desktop: 1200, tablet: 780, mobile: 390 };
const DEVICE_BREAKPOINTS = { desktop: null, tablet: 980, mobile: 700 };
const PRODUCT_NAME = 'ZachEdwardsLLC Manual Webbuilder';
const FEATURE_DEFS = {
  payments: { label: 'Payments / checkout', price: 50, note: 'Adds a paid feature line item to the build quote.' },
  login: { label: 'Login / account management', price: 10, note: 'Adds protected user accounts or member login flows.' },
  booking: { label: 'Booking / scheduling', price: 0, note: 'Captured for manual scoping later.' },
  cms: { label: 'Editable CMS / blog', price: 0, note: 'Captured for manual scoping later.' },
  forms: { label: 'Advanced forms / CRM', price: 0, note: 'Captured for manual scoping later.' },
  custom: { label: 'Custom automation / integrations', price: 0, note: 'Captured for manual scoping later.' }
};
const STYLE_PRESETS = [
  { id: 'custom', name: 'Keep starter style', note: 'Use the template defaults and fine-tune manually.' },
  { id: 'clean-light', name: 'Clean light', theme: { primary: '#445bff', canvas: '#f8fafc', surface: '#ffffff', text: '#111827', headingFont: 'Manrope', bodyFont: 'Inter' } },
  { id: 'quiet-luxury', name: 'Quiet luxury', theme: { primary: '#b38a45', canvas: '#f5f1e8', surface: '#fffdfa', text: '#1d170d', headingFont: 'Playfair Display', bodyFont: 'DM Sans' } },
  { id: 'bold-saas', name: 'Bold SaaS', theme: { primary: '#7c3aed', canvas: '#f6f2ff', surface: '#ffffff', text: '#1f1640', headingFont: 'Space Grotesk', bodyFont: 'Inter' } },
  { id: 'dark-app', name: 'Dark app', theme: { primary: '#79ffd4', canvas: '#081118', surface: '#0f1722', text: '#e9f6ff', headingFont: 'Space Grotesk', bodyFont: 'Inter' } }
];

const state = {
  user: null,
  sites: [],
  currentSiteId: null,
  currentPageId: null,
  selectedElementId: null,
  device: 'desktop',
  preview: false,
  focusCanvas: false,
  dirty: false,
  backendHealthy: false,
};

const refs = {
  siteSelect: document.getElementById('siteSelect'),
  newSiteBtn: document.getElementById('newSiteBtn'),
  duplicateSiteBtn: document.getElementById('duplicateSiteBtn'),
  saveBtn: document.getElementById('saveBtn'),
  exportBtn: document.getElementById('exportBtn'),
  previewBtn: document.getElementById('previewBtn'),
  focusCanvasBtn: document.getElementById('focusCanvasBtn'),
  loginBtn: document.getElementById('loginBtn'),
  logoutBtn: document.getElementById('logoutBtn'),
  userStatus: document.getElementById('userStatus'),
  saveStatus: document.getElementById('saveStatus'),
  templateGrid: document.getElementById('templateGrid'),
  pageList: document.getElementById('pageList'),
  addPageBtn: document.getElementById('addPageBtn'),
  duplicatePageBtn: document.getElementById('duplicatePageBtn'),
  deletePageBtn: document.getElementById('deletePageBtn'),
  homePageBtn: document.getElementById('homePageBtn'),
  assetUpload: document.getElementById('assetUpload'),
  assetGrid: document.getElementById('assetGrid'),
  canvasIntro: document.getElementById('canvasIntro'),
  canvasStageWrap: document.getElementById('canvasStageWrap'),
  currentSiteName: document.getElementById('currentSiteName'),
  currentPageMeta: document.getElementById('currentPageMeta'),
  canvas: document.getElementById('canvas'),
  siteInspector: document.getElementById('siteInspector'),
  elementInspector: document.getElementById('elementInspector'),
  modalRoot: document.getElementById('modalRoot'),
  emptyCreateBtn: document.getElementById('emptyCreateBtn'),
};

function uid(prefix = 'id') {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}


function slugify(value) {
  return String(value).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'export';
}

function formatMoney(value) {
  return `$${Number(value || 0).toFixed(0)}`;
}

function setBuilderTab(name = 'templates') {
  document.querySelectorAll('[data-panel-tab]').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.panelTab === name);
  });
  document.querySelectorAll('[data-panel-view]').forEach(view => {
    view.classList.toggle('active', view.dataset.panelView === name);
  });
}

function setInspectorTab(name = 'site') {
  document.querySelectorAll('[data-inspector-tab]').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.inspectorTab === name);
  });
  document.querySelectorAll('[data-inspector-view]').forEach(view => {
    view.classList.toggle('active', view.dataset.inspectorView === name);
  });
}


function ensureSiteMeta(site) {
  if (!site) return null;
  site.theme = site.theme || {};
  site.assets = site.assets || [];
  site.builderMeta = site.builderMeta || {};
  site.builderMeta.productName = PRODUCT_NAME;
  site.builderMeta.onboarding = site.builderMeta.onboarding || { createdFromWizard: false, currentStep: 'plan', checklistDismissed: false };
  site.builderMeta.quoteConfig = site.builderMeta.quoteConfig || {};
  site.builderMeta.quoteConfig.basePrice = 100;
  site.builderMeta.quoteConfig.pageCount = site.builderMeta.quoteConfig.pageCount || Math.max(1, site.pages?.length || 1);
  site.builderMeta.quoteConfig.features = { payments: false, login: false, booking: false, cms: false, forms: false, custom: false, ...(site.builderMeta.quoteConfig.features || {}) };
  site.builderMeta.quoteConfig.foundationTemplateId = site.builderMeta.quoteConfig.foundationTemplateId || site.templateId || 'minimal-business';
  site.builderMeta.quoteConfig.stylePresetId = site.builderMeta.quoteConfig.stylePresetId || 'custom';
  site.builderMeta.quoteConfig.customFeatureNotes = site.builderMeta.quoteConfig.customFeatureNotes || '';
  site.builderMeta.intake = site.builderMeta.intake || {
    customerName: '', customerEmail: '', businessName: '', hostPreference: 'zach-host', wantsDomain: false,
    requestedDomain: '', galleryOptIn: false, customerBuiltNote: true, galleryNote: '', deploymentAgreement: false,
    domainDisclaimerAccepted: false, featureNotes: ''
  };
  site.builderMeta.checkout = site.builderMeta.checkout || { paid: false, paidAt: null, paidSessionId: null, orderId: null, lockedQuote: null };
  site.builderMeta.showcase = site.builderMeta.showcase || { previewSlug: slugify(site.name || 'preview'), publicPreviewRequested: false };
  return site.builderMeta;
}

function normalizeSite(site) {
  if (!site) return site;
  ensureSiteMeta(site);
  if (!Array.isArray(site.pages) || !site.pages.length) {
    site.pages = [{ id: uid('page'), name: 'Home', slug: 'index', isHome: true, elements: [] }];
  }
  if (!site.pages.some(page => page.isHome)) site.pages[0].isHome = true;
  site.pages.forEach((page, index) => {
    page.elements = page.elements || [];
    if (!page.slug) page.slug = index === 0 ? 'index' : `page-${index + 1}`;
  });
  return site;
}

function getQuote(site) {
  if (!site) return { basePrice: 100, featureLines: [], subtotal: 100, estimatedDomain: 0, totalNow: 100, featureSummary: [], featureFlags: {} };
  const meta = ensureSiteMeta(site);
  const features = meta.quoteConfig.features || {};
  const basePrice = Number(meta.quoteConfig.basePrice || 100);
  const featureLines = Object.entries(features)
    .filter(([, enabled]) => !!enabled)
    .map(([key]) => ({ key, label: FEATURE_DEFS[key]?.label || key, price: Number(FEATURE_DEFS[key]?.price || 0), note: FEATURE_DEFS[key]?.note || '' }));
  const subtotal = basePrice + featureLines.reduce((sum, line) => sum + line.price, 0);
  const estimatedDomain = meta.intake?.wantsDomain ? 10 : 0;
  return { basePrice, featureLines, subtotal, estimatedDomain, totalNow: subtotal, featureSummary: featureLines.map(line => `${line.label}${line.price ? ` (+${formatMoney(line.price)})` : ' (manual quote later)'}`), featureFlags: features };
}

function quoteSummaryText(site) {
  const quote = getQuote(site);
  const meta = ensureSiteMeta(site);
  const mode = meta.checkout?.paid ? 'Paid · export unlocked' : 'Playground mode';
  const domainNote = meta.intake?.wantsDomain ? ` · domain request noted (${formatMoney(quote.estimatedDomain)}+/yr est.)` : '';
  return `${mode} · ${formatMoney(quote.totalNow)} due at final export${domainNote}`;
}

function applyStylePreset(site, presetId) {
  if (!site || !presetId || presetId === 'custom') return;
  const preset = STYLE_PRESETS.find(item => item.id === presetId);
  if (!preset?.theme) return;
  site.theme = { ...(site.theme || {}), ...preset.theme };
}

function syncPageCount(site, pageCount) {
  if (!site) return;
  const target = Math.max(1, Number(pageCount || 1));
  while (site.pages.length < target) {
    const nextIndex = site.pages.length + 1;
    site.pages.push({ id: uid('page'), name: nextIndex === 1 ? 'Home' : `Page ${nextIndex}`, slug: nextIndex === 1 ? 'index' : `page-${nextIndex}`, isHome: nextIndex === 1, elements: [] });
  }
  while (site.pages.length > target) site.pages.pop();
  if (!site.pages.some(page => page.isHome) && site.pages[0]) site.pages[0].isHome = true;
  site.pages.forEach((page, index) => {
    if (index === 0) { page.name = page.name || 'Home'; page.slug = 'index'; page.isHome = true; }
    else if (!page.slug || page.slug === 'index') page.slug = `page-${index + 1}`;
  });
}

async function saveCurrentSiteSilently() {
  const site = currentSite();
  if (!site) return;
  normalizeSite(site);
  updateCurrentSiteTimestamp();
  saveLocal();
  if (state.user) await pushCurrentSiteRemote();
}

async function postJson(path, payload) {
  const res = await fetch(path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload || {}) });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error || `Request failed (${res.status})`);
  return data;
}

async function verifyCheckoutFromUrl() {
  const url = new URL(window.location.href);
  const checkout = url.searchParams.get('checkout');
  const sessionId = url.searchParams.get('session_id');
  const siteId = url.searchParams.get('site_id');
  if (!checkout) return;
  if (checkout === 'cancelled') {
    setSaveMessage('Checkout was cancelled. Playground mode is still active.');
    url.searchParams.delete('checkout'); url.searchParams.delete('site_id');
    window.history.replaceState({}, '', url.toString());
    return;
  }
  if (checkout !== 'success' || !sessionId || !siteId) return;
  try {
    const data = await postJson('/.netlify/functions/verify-checkout', { sessionId, siteId });
    const site = state.sites.find(item => item.id === siteId);
    if (site) {
      ensureSiteMeta(site);
      site.builderMeta.checkout.paid = !!data.paid;
      site.builderMeta.checkout.paidAt = data.paidAt || new Date().toISOString();
      site.builderMeta.checkout.paidSessionId = sessionId;
      site.builderMeta.checkout.orderId = data.orderId || site.builderMeta.checkout.orderId || null;
      site.builderMeta.checkout.lockedQuote = data.quote || getQuote(site);
      if (data.previewSlug) site.builderMeta.showcase.previewSlug = data.previewSlug;
      saveLocal();
      setCurrentSite(site.id);
      renderAll();
      setSaveMessage(data.paid ? 'Checkout verified. Export is now unlocked for this build.' : 'Checkout verification did not unlock export.');
      if (data.paid) setTimeout(() => openFinalizeExportModal(true), 120);
    }
  } catch (error) {
    setSaveMessage(`Checkout verification failed: ${error.message}`);
  } finally {
    url.searchParams.delete('checkout'); url.searchParams.delete('session_id'); url.searchParams.delete('site_id');
    window.history.replaceState({}, '', url.toString());
  }
}

function markDirty(value = true) {
  state.dirty = value;
  renderStatus();
}

function setSaveMessage(message) {
  refs.saveStatus.textContent = message;
}

function currentSite() {
  return state.sites.find(s => s.id === state.currentSiteId) || null;
}

function currentPage() {
  const site = currentSite();
  if (!site) return null;
  return site.pages.find(p => p.id === state.currentPageId) || site.pages[0] || null;
}

function currentElement() {
  const page = currentPage();
  if (!page) return null;
  return page.elements.find(el => el.id === state.selectedElementId) || null;
}

function sortSites() {
  state.sites.sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''));
}

function saveLocal() {
  localStorage.setItem(LS_KEY, JSON.stringify({ sites: state.sites }));
}

function loadLocal() {
  try {
    const parsed = JSON.parse(localStorage.getItem(LS_KEY) || '{}');
    state.sites = (parsed.sites || []).map(normalizeSite);
    sortSites();
  } catch {
    state.sites = [];
  }
}

async function apiRequest(path, options = {}) {
  try {
    const res = await fetch(path, {
      headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
      ...options
    });
    const text = await res.text();
    const data = text ? JSON.parse(text) : null;
    if (!res.ok) throw new Error(data?.error || `Request failed (${res.status})`);
    return data;
  } catch (error) {
    throw error;
  }
}

async function pullRemoteSites() {
  if (!state.user) return;
  try {
    const data = await apiRequest('/.netlify/functions/sites');
    if (Array.isArray(data?.sites) && data.sites.length) {
      const localMap = new Map(state.sites.map(site => [site.id, site]));
      const merged = data.sites.map(site => localMap.get(site.id) ? { ...localMap.get(site.id), ...site } : site);
      // Keep local-only sites too.
      for (const localSite of state.sites) {
        if (!merged.some(site => site.id === localSite.id)) merged.push(localSite);
      }
      state.sites = merged.map(normalizeSite);
      sortSites();
      saveLocal();
      state.backendHealthy = true;
      setSaveMessage('Connected to Netlify Identity + Neon. Remote saves are enabled.');
    } else {
      state.backendHealthy = true;
      setSaveMessage('Connected. No remote sites yet — local saves still work too.');
    }
  } catch {
    state.backendHealthy = false;
    setSaveMessage('Identity is active, but the Neon function is not reachable yet. Local saves still work.');
  }
}

async function pushCurrentSiteRemote() {
  const site = currentSite();
  if (!site || !state.user) return false;
  try {
    await apiRequest('/.netlify/functions/sites', {
      method: 'POST',
      body: JSON.stringify({ site })
    });
    state.backendHealthy = true;
    return true;
  } catch {
    state.backendHealthy = false;
    return false;
  }
}

function setCurrentSite(siteId, pageId = null) {
  state.currentSiteId = siteId || null;
  const site = currentSite();
  state.currentPageId = site ? (pageId || site.pages[0]?.id || null) : null;
  state.selectedElementId = null;
  renderAll();
}

function setCurrentPage(pageId) {
  state.currentPageId = pageId;
  state.selectedElementId = null;
  renderAll();
}

function createNewSite(config) {
  const site = normalizeSite(makeBlankSite(config));
  ensureSiteMeta(site);
  if (config?.stylePresetId) { site.builderMeta.quoteConfig.stylePresetId = config.stylePresetId; applyStylePreset(site, config.stylePresetId); }
  if (config?.features) site.builderMeta.quoteConfig.features = { ...site.builderMeta.quoteConfig.features, ...config.features };
  if (config?.customFeatureNotes) site.builderMeta.quoteConfig.customFeatureNotes = config.customFeatureNotes;
  if (config?.pageCount) { site.builderMeta.quoteConfig.pageCount = Number(config.pageCount); syncPageCount(site, config.pageCount); }
  if (config?.intake) site.builderMeta.intake = { ...site.builderMeta.intake, ...config.intake };
  site.builderMeta.onboarding.createdFromWizard = true;
  site.builderMeta.showcase.previewSlug = slugify(config?.previewSlug || site.name || 'preview');
  state.sites.unshift(site);
  sortSites();
  saveLocal();
  setCurrentSite(site.id);
  markDirty(true);
}

function duplicateCurrentSite() {
  const site = currentSite();
  if (!site) return;
  const copy = deepClone(site);
  copy.id = uid('site');
  copy.name = `${site.name} Copy`;
  copy.updatedAt = new Date().toISOString();
  state.sites.unshift(copy);
  sortSites();
  saveLocal();
  setCurrentSite(copy.id);
  setSaveMessage('Site duplicated locally.');
  markDirty(true);
}

function addPage() {
  const site = currentSite();
  if (!site) return;
  const newIndex = site.pages.length + 1;
  const slugBase = `page-${newIndex}`;
  const page = {
    id: uid('page'),
    name: `Page ${newIndex}`,
    slug: slugBase,
    isHome: false,
    elements: []
  };
  site.pages.push(page);
  site.updatedAt = new Date().toISOString();
  saveLocal();
  setCurrentPage(page.id);
  markDirty(true);
}

function duplicateCurrentPage() {
  const site = currentSite();
  const page = currentPage();
  if (!site || !page) return;
  const copy = deepClone(page);
  copy.id = uid('page');
  copy.name = `${page.name} Copy`;
  copy.slug = `${page.slug}-copy`;
  copy.isHome = false;
  site.pages.push(copy);
  site.updatedAt = new Date().toISOString();
  saveLocal();
  setCurrentPage(copy.id);
  markDirty(true);
}

function deleteCurrentPage() {
  const site = currentSite();
  const page = currentPage();
  if (!site || !page) return;
  if (site.pages.length === 1) {
    alert('Every site needs at least one page.');
    return;
  }
  site.pages = site.pages.filter(p => p.id !== page.id);
  if (!site.pages.some(p => p.isHome)) site.pages[0].isHome = true;
  site.updatedAt = new Date().toISOString();
  saveLocal();
  setCurrentPage(site.pages[0].id);
  markDirty(true);
}

function setHomePage() {
  const site = currentSite();
  const page = currentPage();
  if (!site || !page) return;
  site.pages.forEach(p => p.isHome = p.id === page.id);
  if (page.slug !== 'index') page.slug = 'index';
  site.updatedAt = new Date().toISOString();
  saveLocal();
  renderAll();
  markDirty(true);
}

function defaultStyles(type) {
  const shared = {
    color: '#111827',
    background: 'transparent',
    fontFamily: 'inherit',
    fontSize: 18,
    fontWeight: 600,
    borderRadius: 18,
    borderWidth: 0,
    borderColor: '#dbe2ef',
    padding: 16,
    boxShadow: 'none',
    textAlign: 'left',
    letterSpacing: 0,
    lineHeight: 1.3,
    opacity: 1
  };
  if (type === 'heading') return { ...shared, fontSize: 48, fontWeight: 800 };
  if (type === 'button') return { ...shared, fontSize: 17, fontWeight: 800, color: '#ffffff', background: '#445bff', borderRadius: 16 };
  if (type === 'box') return { ...shared, background: '#ffffff', borderWidth: 1, borderColor: '#dbe2ef', borderRadius: 24 };
  if (type === 'form') return { ...shared, background: '#ffffff', borderWidth: 1, borderColor: '#dbe2ef', borderRadius: 22 };
  return shared;
}

function createElement(type) {
  const device = state.device;
  const x = device === 'mobile' ? 20 : 60;
  const y = getCanvasBottom() + 20;
  let w = device === 'mobile' ? 330 : 380;
  let h = 120;
  const site = currentSite();
  if (type === 'heading') { w = device === 'mobile' ? 330 : 540; h = 88; }
  if (type === 'image') { w = device === 'mobile' ? 330 : 420; h = 240; }
  if (type === 'video') { w = device === 'mobile' ? 330 : 460; h = 260; }
  if (type === 'button') { w = 190; h = 58; }
  if (type === 'box') { w = device === 'mobile' ? 330 : 380; h = 220; }
  if (type === 'form') { w = device === 'mobile' ? 330 : 460; h = 300; }

  const element = {
    id: uid('el'),
    type,
    name: type,
    layouts: {
      desktop: { x, y, w: device === 'desktop' ? w : Math.min(440, Math.round(w * 1.05)), h },
      tablet: { x: Math.max(20, Math.round(x * 0.7)), y, w: Math.min(560, Math.max(190, Math.round(w * 0.82))), h },
      mobile: { x: 20, y, w: Math.min(350, Math.max(180, Math.round(w * 0.85))), h }
    },
    visibleOn: { desktop: true, tablet: true, mobile: true },
    styles: defaultStyles(type),
    content: {}
  };

  if (type === 'text') element.content.text = 'Edit this text block.';
  if (type === 'heading') element.content.text = 'Add a strong headline';
  if (type === 'button') { element.content.text = 'Button'; element.content.href = '#'; }
  if (type === 'box') element.content.text = '';
  if (type === 'form') element.content.title = 'Contact us';
  if (type === 'image') {
    const firstImage = site?.assets?.find(asset => asset.kind === 'image');
    if (firstImage) {
      element.content.src = firstImage.dataUrl;
      element.content.assetId = firstImage.id;
    }
  }
  if (type === 'video') {
    const firstVideo = site?.assets?.find(asset => asset.kind === 'video');
    if (firstVideo) {
      element.content.src = firstVideo.dataUrl;
      element.content.assetId = firstVideo.id;
    } else {
      element.content.src = 'https://www.w3schools.com/html/mov_bbb.mp4';
    }
  }
  return element;
}

function addElement(type) {
  const page = currentPage();
  if (!page) return;
  const el = createElement(type);
  page.elements.push(el);
  state.selectedElementId = el.id;
  updateCurrentSiteTimestamp();
  saveLocal();
  renderAll();
  markDirty(true);
}

function updateCurrentSiteTimestamp() {
  const site = currentSite();
  if (!site) return;
  site.updatedAt = new Date().toISOString();
}

function getCanvasBottom() {
  const page = currentPage();
  if (!page || page.elements.length === 0) return 80;
  return Math.max(...page.elements.map(el => {
    const l = el.layouts[state.device] || el.layouts.desktop;
    return l.y + l.h;
  }));
}

function deleteSelectedElement() {
  const page = currentPage();
  if (!page || !state.selectedElementId) return;
  page.elements = page.elements.filter(el => el.id !== state.selectedElementId);
  state.selectedElementId = null;
  updateCurrentSiteTimestamp();
  saveLocal();
  renderAll();
  markDirty(true);
}

function applyTemplate(templateId) {
  const site = currentSite();
  if (!site) return;
  const incoming = buildSiteFromTemplate(templateId);
  const keepId = site.id;
  const keepName = site.name;
  const keepAssets = site.assets || [];
  Object.assign(site, incoming);
  site.id = keepId;
  site.name = keepName;
  site.assets = keepAssets;
  updateCurrentSiteTimestamp();
  saveLocal();
  setCurrentSite(site.id, site.pages[0]?.id);
  markDirty(true);
}

function renderSiteSelect() {
  refs.siteSelect.innerHTML = '';
  if (!state.sites.length) {
    refs.siteSelect.innerHTML = `<option value="">No sites yet</option>`;
    return;
  }
  state.sites.forEach(site => {
    const option = document.createElement('option');
    option.value = site.id;
    option.textContent = `${site.name} · ${site.kind === 'webapp' ? 'Web app' : 'Website'}`;
    if (site.id === state.currentSiteId) option.selected = true;
    refs.siteSelect.appendChild(option);
  });
}

function renderTemplates() {
  const site = currentSite();
  refs.templateGrid.innerHTML = TEMPLATE_PRESETS.map(template => `
    <button class="template-card ${site?.templateId === template.id ? 'active' : ''}" data-template-id="${template.id}">
      <div class="template-preview"></div>
      <div class="row wrap" style="justify-content:space-between">
        <strong>${template.name}</strong>
        <span class="pill">${template.kind === 'webapp' ? 'App' : 'Site'}</span>
      </div>
      <div class="small muted">${template.description}</div>
    </button>
  `).join('');

  refs.templateGrid.querySelectorAll('[data-template-id]').forEach(btn => {
    btn.addEventListener('click', () => {
      if (!currentSite()) {
        openNewSiteModal(btn.dataset.templateId);
        return;
      }
      applyTemplate(btn.dataset.templateId);
    });
  });
}

function renderPages() {
  const site = currentSite();
  refs.pageList.innerHTML = '';
  if (!site) {
    refs.pageList.innerHTML = `<div class="inspector-empty">Create a site first.</div>`;
    return;
  }
  site.pages.forEach(page => {
    const wrapper = document.createElement('div');
    wrapper.className = `page-card ${page.id === state.currentPageId ? 'active' : ''}`;
    wrapper.innerHTML = `
      <div>
        <strong>${escapeHtml(page.name)} ${page.isHome ? '<span class="pill">Home</span>' : ''}</strong>
        <div class="page-meta">/${page.slug === 'index' ? '' : escapeHtml(page.slug)}</div>
      </div>
      <button class="btn ghost compact">Open</button>
    `;
    wrapper.querySelector('button').addEventListener('click', () => setCurrentPage(page.id));
    wrapper.addEventListener('click', (event) => {
      if (event.target.tagName !== 'BUTTON') setCurrentPage(page.id);
    });
    refs.pageList.appendChild(wrapper);
  });
}

function renderAssets() {
  const site = currentSite();
  refs.assetGrid.innerHTML = '';
  if (!site?.assets?.length) {
    refs.assetGrid.innerHTML = `<div class="inspector-empty">Upload images or videos here, then drop them into the canvas.</div>`;
    return;
  }
  site.assets.forEach(asset => {
    const card = document.createElement('div');
    card.className = 'asset-card';
    const preview = asset.kind === 'image'
      ? `<img src="${asset.dataUrl}" alt="${escapeHtml(asset.name)}" />`
      : `<video src="${asset.dataUrl}" muted playsinline></video>`;
    card.innerHTML = `
      ${preview}
      <div class="small"><strong>${escapeHtml(asset.name)}</strong></div>
      <div class="row wrap">
        <button class="btn ghost compact" data-use>Use</button>
        <button class="btn danger compact" data-remove>Delete</button>
      </div>
    `;
    card.querySelector('[data-use]').addEventListener('click', () => placeAsset(asset));
    card.querySelector('[data-remove]').addEventListener('click', () => removeAsset(asset.id));
    refs.assetGrid.appendChild(card);
  });
}

function placeAsset(asset) {
  const page = currentPage();
  if (!page) return;
  const kind = asset.kind === 'video' ? 'video' : 'image';
  const el = createElement(kind);
  el.content.src = asset.dataUrl;
  el.content.assetId = asset.id;
  page.elements.push(el);
  state.selectedElementId = el.id;
  updateCurrentSiteTimestamp();
  saveLocal();
  renderAll();
  markDirty(true);
}

function removeAsset(assetId) {
  const site = currentSite();
  if (!site) return;
  site.assets = site.assets.filter(asset => asset.id !== assetId);
  site.pages.forEach(page => {
    page.elements.forEach(el => {
      if (el.content?.assetId === assetId) {
        delete el.content.assetId;
      }
    });
  });
  updateCurrentSiteTimestamp();
  saveLocal();
  renderAll();
  markDirty(true);
}

function escapeHtml(value = '') {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function getLayoutForDevice(element, device = state.device) {
  return element.layouts?.[device] || element.layouts?.desktop || { x: 20, y: 20, w: 300, h: 120 };
}

function getCanvasStyles(site) {
  const theme = site.theme || {};
  return `
    --theme-primary:${theme.primary || '#445bff'};
    --theme-secondary:${theme.secondary || '#f8fafc'};
    --theme-accent:${theme.accent || '#111827'};
    --theme-surface:${theme.surface || '#ffffff'};
    --theme-canvas:${theme.canvas || '#f8fafc'};
    --theme-text:${theme.text || '#111827'};
    --theme-heading-font:${(theme.headingFont || 'Manrope').includes(' ') ? `'${theme.headingFont}'` : theme.headingFont}, system-ui, sans-serif;
    --theme-body-font:${(theme.bodyFont || 'Inter').includes(' ') ? `'${theme.bodyFont}'` : theme.bodyFont}, system-ui, sans-serif;
    background:${theme.canvas || '#f8fafc'};
  `;
}

function renderElement(element) {
  const layout = getLayoutForDevice(element);
  const hidden = element.visibleOn?.[state.device] === false;
  const styles = element.styles || {};
  let inner = '';
  if (element.type === 'text' || element.type === 'heading') {
    inner = `<div class="element-inner" style="${inlineElementStyles(element)}">${escapeHtml(element.content?.text || '')}</div>`;
  }
  if (element.type === 'button') {
    inner = `<div class="element-inner" style="${inlineElementStyles(element)};display:flex;align-items:center;justify-content:center;">${escapeHtml(element.content?.text || 'Button')}</div>`;
  }
  if (element.type === 'image') {
    const src = element.content?.src || '';
    inner = src
      ? `<img class="element-inner" src="${src}" alt="${escapeHtml(element.content?.alt || '')}" style="${inlineElementStyles(element)};object-fit:cover;width:100%;height:100%;" />`
      : `<div class="element-inner" style="${inlineElementStyles(element)};display:grid;place-items:center;background:#e2e8f0;color:#475569">Upload an image</div>`;
  }
  if (element.type === 'video') {
    const src = element.content?.src || '';
    inner = src
      ? `<video class="element-inner" src="${src}" controls playsinline style="${inlineElementStyles(element)};object-fit:cover;width:100%;height:100%;"></video>`
      : `<div class="element-inner" style="${inlineElementStyles(element)};display:grid;place-items:center;background:#e2e8f0;color:#475569">Add a video URL or upload</div>`;
  }
  if (element.type === 'box') {
    inner = `<div class="element-inner" style="${inlineElementStyles(element)}">${element.content?.text ? escapeHtml(element.content.text) : ''}</div>`;
  }
  if (element.type === 'form') {
    inner = `
      <div class="element-inner" style="${inlineElementStyles(element)}">
        <div style="font-size:26px;font-weight:800;margin-bottom:14px;">${escapeHtml(element.content?.title || 'Contact us')}</div>
        <div style="display:grid;gap:10px;">
          <input class="input" placeholder="Name" disabled />
          <input class="input" placeholder="Email" disabled />
          <textarea class="textarea" placeholder="Message" disabled></textarea>
          <button class="btn primary" disabled style="opacity:.85">Submit</button>
        </div>
      </div>
    `;
  }

  return `
    <div class="canvas-element ${hidden ? 'hidden-on-device' : ''} ${element.id === state.selectedElementId ? 'selected' : ''}"
      data-element-id="${element.id}"
      style="left:${layout.x}px;top:${layout.y}px;width:${layout.w}px;height:${layout.h}px;opacity:${styles.opacity ?? 1};">
      ${state.preview ? '' : `<div class="element-label">${escapeHtml(element.type)}</div><div class="resize-hint"></div>`}
      ${inner}
    </div>
  `;
}

function inlineElementStyles(element) {
  const s = element.styles || {};
  return [
    `color:${s.color || '#111827'}`,
    `background:${s.background || 'transparent'}`,
    `font-family:${s.fontFamily && s.fontFamily !== 'inherit' ? (s.fontFamily.includes(' ') ? `'${s.fontFamily}'` : s.fontFamily) : 'var(--theme-body-font)'}`,
    `font-size:${s.fontSize || 18}px`,
    `font-weight:${s.fontWeight || 600}`,
    `border-radius:${s.borderRadius || 0}px`,
    `border:${s.borderWidth || 0}px solid ${s.borderColor || 'transparent'}`,
    `padding:${s.padding || 0}px`,
    `box-shadow:${s.boxShadow || 'none'}`,
    `text-align:${s.textAlign || 'left'}`,
    `letter-spacing:${s.letterSpacing || 0}px`,
    `line-height:${s.lineHeight || 1.3}`,
    `width:100%`,
    `height:100%`,
    `display:block`,
    `overflow:hidden`
  ].join(';');
}

function renderCanvas() {
  const site = currentSite();
  const page = currentPage();
  const hasSite = !!site;
  refs.canvasIntro.classList.toggle('hidden', hasSite);
  refs.canvasStageWrap.classList.toggle('hidden', !hasSite);
  if (!site || !page) return;

  const width = DEVICE_WIDTHS[state.device];
  const bottom = Math.max(DEVICE_WIDTHS[state.device] === 390 ? 760 : 700, getCanvasBottom() + 100);
  refs.canvas.style.width = `${width}px`;
  refs.canvas.style.minHeight = `${bottom}px`;
  refs.canvas.style.cssText += `;${getCanvasStyles(site)}`;
  refs.canvas.classList.toggle('site-kind-webapp', site.kind === 'webapp');
  refs.canvas.innerHTML = `
    ${state.preview ? '' : `<div class="canvas-page-linkbar">${site.pages.map(p => `<span class="canvas-page-chip">${escapeHtml(p.name)}</span>`).join('')}</div>`}
    <div class="canvas-top-label">${escapeHtml(`${PRODUCT_NAME} · ${site.kind === 'webapp' ? 'Web app' : 'Website'} · ${state.device}`)}</div>
    ${page.elements.map(renderElement).join('')}
  `;
  refs.currentSiteName.textContent = site.name;
  refs.currentPageMeta.textContent = `${page.name} · /${page.slug === 'index' ? '' : page.slug} · ${site.deviceTarget}`;
  bindCanvasSelection();
  mountInteractions();
}

function bindCanvasSelection() {
  refs.canvas.querySelectorAll('.canvas-element').forEach(node => {
    node.addEventListener('click', (event) => {
      event.stopPropagation();
      state.selectedElementId = node.dataset.elementId;
      setInspectorTab('block');
      renderInspectors();
      renderCanvas();
    });
  });
  refs.canvas.addEventListener('click', (event) => {
    if (event.target === refs.canvas) {
      state.selectedElementId = null;
      renderInspectors();
      renderCanvas();
    }
  });
}

function mountInteractions() {
  if (state.preview || !window.interact) return;
  window.interact('.canvas-element').unset();
  window.interact('.canvas-element').draggable({
    listeners: {
      move(event) {
        const page = currentPage();
        if (!page) return;
        const id = event.target.dataset.elementId;
        const element = page.elements.find(el => el.id === id);
        if (!element) return;
        const layout = getLayoutForDevice(element);
        layout.x = clamp(Math.round(layout.x + event.dx), 0, DEVICE_WIDTHS[state.device] - 60);
        layout.y = Math.max(0, Math.round(layout.y + event.dy));
        event.target.style.left = `${layout.x}px`;
        event.target.style.top = `${layout.y}px`;
        updateCurrentSiteTimestamp();
        markDirty(true);
      },
      end() {
        saveLocal();
        renderCanvas();
      }
    }
  }).resizable({
    edges: { left: false, right: true, bottom: true, top: false },
    listeners: {
      move(event) {
        const page = currentPage();
        if (!page) return;
        const id = event.target.dataset.elementId;
        const element = page.elements.find(el => el.id === id);
        if (!element) return;
        const layout = getLayoutForDevice(element);
        layout.w = clamp(Math.round(event.rect.width), 100, DEVICE_WIDTHS[state.device] - layout.x);
        layout.h = Math.max(40, Math.round(event.rect.height));
        event.target.style.width = `${layout.w}px`;
        event.target.style.height = `${layout.h}px`;
        updateCurrentSiteTimestamp();
        markDirty(true);
      },
      end() {
        saveLocal();
        renderCanvas();
      }
    },
    modifiers: [
      window.interact.modifiers.restrictEdges({ outer: 'parent' }),
      window.interact.modifiers.restrictSize({ min: { width: 100, height: 40 } })
    ]
  });
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function renderSiteInspector() {
  const site = currentSite();
  if (!site) {
    refs.siteInspector.innerHTML = `<div class="inspector-empty">Start the guided setup to define features, quote the build, and unlock the builder.</div>`;
    return;
  }
  normalizeSite(site);
  const theme = site.theme || {};
  const meta = ensureSiteMeta(site);
  const quote = getQuote(site);
  refs.siteInspector.innerHTML = `
    <div class="price-card" style="margin-bottom:14px;">
      <div class="row wrap" style="justify-content:space-between;align-items:flex-start;">
        <div>
          <div class="kicker">${PRODUCT_NAME}</div>
          <div class="price-total">${formatMoney(quote.totalNow)} due at final export</div>
        </div>
        <span class="quote-badge">${meta.checkout?.paid ? 'Export unlocked' : 'Playground mode'}</span>
      </div>
      <div class="form-note">Base build ${formatMoney(quote.basePrice)}${quote.featureLines.length ? ` · ${quote.featureLines.map(item => `${item.label} ${formatMoney(item.price)}`).join(' · ')}` : ''}</div>
      <div class="form-note">Domain is not included. If requested, it is noted separately and usually costs ${formatMoney(10)}–${formatMoney(15)}/year depending on availability.</div>
      <div class="playground-banner">Customers see the price early, build in playground mode, then complete checkout only when they finalize and export.</div>
      <div class="step-actions" style="margin-top:12px;">
        <button class="btn ghost compact" id="rerunWizardBtn">Guided setup</button>
        <button class="btn secondary compact" id="openFinalizeBtn">Finalize / Export</button>
      </div>
    </div>

    <div class="field">
      <label class="field-label">Project name</label>
      <input class="input" id="siteNameInput" value="${escapeHtml(site.name)}" />
    </div>
    <div class="field-grid">
      <div class="field">
        <label class="field-label">Builder type</label>
        <select class="select" id="siteKindInput">
          <option value="website" ${site.kind === 'website' ? 'selected' : ''}>Website</option>
          <option value="webapp" ${site.kind === 'webapp' ? 'selected' : ''}>Web app</option>
        </select>
      </div>
      <div class="field">
        <label class="field-label">Target</label>
        <select class="select" id="deviceTargetInput">
          <option value="responsive" ${site.deviceTarget === 'responsive' ? 'selected' : ''}>Responsive</option>
          <option value="desktop" ${site.deviceTarget === 'desktop' ? 'selected' : ''}>Desktop-first</option>
          <option value="mobile" ${site.deviceTarget === 'mobile' ? 'selected' : ''}>Phone-first</option>
        </select>
      </div>
    </div>

    <div class="field-grid">
      <div class="field">
        <label class="field-label">Heading font</label>
        <select class="select" id="headingFontInput">
          ${['Manrope','Inter','DM Sans','Playfair Display','Space Grotesk','Poppins'].map(font => `<option value="${font}" ${theme.headingFont === font ? 'selected' : ''}>${font}</option>`).join('')}
        </select>
      </div>
      <div class="field">
        <label class="field-label">Body font</label>
        <select class="select" id="bodyFontInput">
          ${['Inter','DM Sans','Manrope','Poppins','Space Grotesk'].map(font => `<option value="${font}" ${theme.bodyFont === font ? 'selected' : ''}>${font}</option>`).join('')}
        </select>
      </div>
    </div>

    <div class="field-grid">
      <div class="field">
        <label class="field-label">Primary</label>
        <input type="color" class="input" id="primaryColorInput" value="${theme.primary || '#445bff'}" />
      </div>
      <div class="field">
        <label class="field-label">Canvas</label>
        <input type="color" class="input" id="canvasColorInput" value="${theme.canvas || '#f8fafc'}" />
      </div>
      <div class="field">
        <label class="field-label">Text</label>
        <input type="color" class="input" id="textColorInput" value="${theme.text || '#111827'}" />
      </div>
      <div class="field">
        <label class="field-label">Surface</label>
        <input type="color" class="input" id="surfaceColorInput" value="${theme.surface || '#ffffff'}" />
      </div>
    </div>

    <div class="notice small">
      Final export stays locked until Stripe checkout succeeds. Once paid, the project can be exported as a Netlify-ready ZIP and included in the public gallery feed if the customer opted in.
    </div>
  `;

  bindInspectorInput('siteNameInput', value => { site.name = value || 'Untitled site'; ensureSiteMeta(site).showcase.previewSlug = slugify(site.name || 'preview'); });
  bindInspectorInput('siteKindInput', value => { site.kind = value; });
  bindInspectorInput('deviceTargetInput', value => { site.deviceTarget = value; });
  bindInspectorInput('headingFontInput', value => { site.theme.headingFont = value; });
  bindInspectorInput('bodyFontInput', value => { site.theme.bodyFont = value; });
  bindInspectorInput('primaryColorInput', value => { site.theme.primary = value; });
  bindInspectorInput('canvasColorInput', value => { site.theme.canvas = value; });
  bindInspectorInput('textColorInput', value => { site.theme.text = value; });
  bindInspectorInput('surfaceColorInput', value => { site.theme.surface = value; });
  document.getElementById('rerunWizardBtn')?.addEventListener('click', () => openNewSiteModal(site.templateId || meta.quoteConfig.foundationTemplateId || 'minimal-business', site));
  document.getElementById('openFinalizeBtn')?.addEventListener('click', () => openFinalizeExportModal(false));
}

function bindInspectorInput(id, handler) {
  const node = document.getElementById(id);
  if (!node) return;
  const eventName = node.tagName === 'SELECT' || node.type === 'color' ? 'input' : 'input';
  node.addEventListener(eventName, () => {
    handler(node.value);
    updateCurrentSiteTimestamp();
    saveLocal();
    renderCanvas();
    markDirty(true);
  });
}

function renderElementInspector() {
  const element = currentElement();
  if (!element) {
    refs.elementInspector.innerHTML = `<div class="inspector-empty">Select a block to edit content, visibility, links, and responsive layout. Use <kbd>Delete</kbd> to remove the selected block.</div>`;
    return;
  }
  const styles = element.styles || {};
  const content = element.content || {};
  const html = `
    <div class="field">
      <label class="field-label">Block type</label>
      <div class="notice small">${escapeHtml(element.type)} · editing <strong>${state.device}</strong> layout</div>
    </div>

    ${(element.type === 'text' || element.type === 'heading' || element.type === 'box') ? `
      <div class="field">
        <label class="field-label">Text</label>
        <textarea class="textarea" id="contentTextInput">${escapeHtml(content.text || '')}</textarea>
      </div>` : ''}

    ${element.type === 'button' ? `
      <div class="field">
        <label class="field-label">Button label</label>
        <input class="input" id="buttonTextInput" value="${escapeHtml(content.text || '')}" />
      </div>
      <div class="field">
        <label class="field-label">Button link</label>
        <input class="input" id="buttonHrefInput" value="${escapeHtml(content.href || '#')}" />
      </div>` : ''}

    ${element.type === 'image' ? `
      <div class="field">
        <label class="field-label">Image source</label>
        <input class="input" id="mediaSrcInput" value="${escapeHtml(content.src || '')}" placeholder="Paste image URL or upload from Assets" />
      </div>
      <div class="field">
        <label class="field-label">Alt text</label>
        <input class="input" id="mediaAltInput" value="${escapeHtml(content.alt || '')}" />
      </div>` : ''}

    ${element.type === 'video' ? `
      <div class="field">
        <label class="field-label">Video source</label>
        <input class="input" id="mediaSrcInput" value="${escapeHtml(content.src || '')}" placeholder="Paste MP4 URL or upload from Assets" />
      </div>` : ''}

    ${element.type === 'form' ? `
      <div class="field">
        <label class="field-label">Form title</label>
        <input class="input" id="formTitleInput" value="${escapeHtml(content.title || 'Contact us')}" />
      </div>` : ''}

    <div class="field-grid">
      <div class="field">
        <label class="field-label">Font size</label>
        <input class="input" type="number" id="fontSizeInput" value="${styles.fontSize || 18}" />
      </div>
      <div class="field">
        <label class="field-label">Weight</label>
        <input class="input" type="number" id="fontWeightInput" value="${styles.fontWeight || 600}" />
      </div>
      <div class="field">
        <label class="field-label">Text color</label>
        <input class="input" type="color" id="fontColorInput" value="${styles.color || '#111827'}" />
      </div>
      <div class="field">
        <label class="field-label">Background</label>
        <input class="input" type="color" id="backgroundInput" value="${normalizeColor(styles.background || '#ffffff')}" />
      </div>
      <div class="field">
        <label class="field-label">Radius</label>
        <input class="input" type="number" id="radiusInput" value="${styles.borderRadius || 0}" />
      </div>
      <div class="field">
        <label class="field-label">Padding</label>
        <input class="input" type="number" id="paddingInput" value="${styles.padding || 0}" />
      </div>
      <div class="field">
        <label class="field-label">Border width</label>
        <input class="input" type="number" id="borderWidthInput" value="${styles.borderWidth || 0}" />
      </div>
      <div class="field">
        <label class="field-label">Border color</label>
        <input class="input" type="color" id="borderColorInput" value="${styles.borderColor || '#dbe2ef'}" />
      </div>
      <div class="field">
        <label class="field-label">Opacity</label>
        <input class="input" type="number" step="0.05" min="0" max="1" id="opacityInput" value="${styles.opacity ?? 1}" />
      </div>
      <div class="field">
        <label class="field-label">Font family</label>
        <select class="select" id="fontFamilyInput">
          ${['inherit','Inter','DM Sans','Manrope','Playfair Display','Space Grotesk','Poppins'].map(font => `<option value="${font}" ${styles.fontFamily === font ? 'selected' : ''}>${font}</option>`).join('')}
        </select>
      </div>
    </div>

    <div class="field-grid">
      <div class="field">
        <label class="field-label">X (${state.device})</label>
        <input class="input" type="number" id="layoutXInput" value="${getLayoutForDevice(element).x}" />
      </div>
      <div class="field">
        <label class="field-label">Y (${state.device})</label>
        <input class="input" type="number" id="layoutYInput" value="${getLayoutForDevice(element).y}" />
      </div>
      <div class="field">
        <label class="field-label">Width (${state.device})</label>
        <input class="input" type="number" id="layoutWInput" value="${getLayoutForDevice(element).w}" />
      </div>
      <div class="field">
        <label class="field-label">Height (${state.device})</label>
        <input class="input" type="number" id="layoutHInput" value="${getLayoutForDevice(element).h}" />
      </div>
    </div>

    <div class="field">
      <label class="field-label">Visibility</label>
      <div class="checkbox-row">
        <label><input type="checkbox" id="visibleDesktopInput" ${element.visibleOn?.desktop !== false ? 'checked' : ''} /> Desktop</label>
        <label><input type="checkbox" id="visibleTabletInput" ${element.visibleOn?.tablet !== false ? 'checked' : ''} /> Tablet</label>
        <label><input type="checkbox" id="visibleMobileInput" ${element.visibleOn?.mobile !== false ? 'checked' : ''} /> Phone</label>
      </div>
    </div>

    <div class="row wrap">
      <button class="btn secondary compact" id="duplicateElementBtn">Duplicate block</button>
      <button class="btn danger compact" id="deleteElementBtn">Delete block</button>
    </div>
  `;
  refs.elementInspector.innerHTML = html;
  bindElementInspectorInputs(element);
}

function normalizeColor(value) {
  if (!value || value === 'transparent' || value.startsWith('linear-gradient')) return '#ffffff';
  return value;
}

function bindElementInspectorInputs(element) {
  const page = currentPage();
  if (!page) return;

  const update = (mutator) => {
    mutator();
    updateCurrentSiteTimestamp();
    saveLocal();
    renderCanvas();
    markDirty(true);
  };

  const on = (id, event, fn) => {
    const node = document.getElementById(id);
    if (!node) return;
    node.addEventListener(event, () => update(() => fn(node)));
  };

  on('contentTextInput', 'input', node => { element.content.text = node.value; });
  on('buttonTextInput', 'input', node => { element.content.text = node.value; });
  on('buttonHrefInput', 'input', node => { element.content.href = node.value; });
  on('mediaSrcInput', 'input', node => { element.content.src = node.value; delete element.content.assetId; });
  on('mediaAltInput', 'input', node => { element.content.alt = node.value; });
  on('formTitleInput', 'input', node => { element.content.title = node.value; });

  on('fontSizeInput', 'input', node => { element.styles.fontSize = Number(node.value) || 16; });
  on('fontWeightInput', 'input', node => { element.styles.fontWeight = Number(node.value) || 600; });
  on('fontColorInput', 'input', node => { element.styles.color = node.value; });
  on('backgroundInput', 'input', node => { element.styles.background = node.value; });
  on('radiusInput', 'input', node => { element.styles.borderRadius = Number(node.value) || 0; });
  on('paddingInput', 'input', node => { element.styles.padding = Number(node.value) || 0; });
  on('borderWidthInput', 'input', node => { element.styles.borderWidth = Number(node.value) || 0; });
  on('borderColorInput', 'input', node => { element.styles.borderColor = node.value; });
  on('opacityInput', 'input', node => { element.styles.opacity = Number(node.value) || 1; });
  on('fontFamilyInput', 'input', node => { element.styles.fontFamily = node.value; });

  on('layoutXInput', 'input', node => { getLayoutForDevice(element).x = Number(node.value) || 0; });
  on('layoutYInput', 'input', node => { getLayoutForDevice(element).y = Number(node.value) || 0; });
  on('layoutWInput', 'input', node => { getLayoutForDevice(element).w = Number(node.value) || 180; });
  on('layoutHInput', 'input', node => { getLayoutForDevice(element).h = Number(node.value) || 40; });

  on('visibleDesktopInput', 'change', node => { element.visibleOn.desktop = node.checked; });
  on('visibleTabletInput', 'change', node => { element.visibleOn.tablet = node.checked; });
  on('visibleMobileInput', 'change', node => { element.visibleOn.mobile = node.checked; });

  document.getElementById('deleteElementBtn')?.addEventListener('click', deleteSelectedElement);
  document.getElementById('duplicateElementBtn')?.addEventListener('click', () => {
    const copy = deepClone(element);
    copy.id = uid('el');
    Object.values(copy.layouts || {}).forEach(layout => { layout.x += 20; layout.y += 20; });
    page.elements.push(copy);
    state.selectedElementId = copy.id;
    updateCurrentSiteTimestamp();
    saveLocal();
    renderAll();
    markDirty(true);
  });
}

function renderInspectors() {
  renderSiteInspector();
  renderElementInspector();
}

function renderStatus() {
  const site = currentSite();
  const scope = state.user ? `Signed in as ${state.user.email || 'user'}` : 'Local mode';
  refs.userStatus.textContent = scope;
  const base = state.user
    ? (state.backendHealthy ? 'Remote + local saves ready.' : 'Identity connected. Backend not ready yet, so saves stay local.')
    : 'Changes are saved in your browser. Log in after you enable Netlify Identity to store projects in Neon.';
  const siteMsg = site ? ` ${quoteSummaryText(site)}.` : ' Start guided setup to quote the build and unlock the editor.';
  refs.saveStatus.textContent = state.dirty ? `${base}${siteMsg} Unsaved changes pending save.` : `${base}${siteMsg}`;
  refs.previewBtn.textContent = state.preview ? 'Edit mode' : 'Preview';
  if (refs.focusCanvasBtn) refs.focusCanvasBtn.textContent = state.focusCanvas ? 'Show panels' : 'Focus canvas';
  refs.exportBtn.textContent = site && ensureSiteMeta(site).checkout?.paid ? 'Export ZIP' : 'Finalize / Export';
  refs.loginBtn.classList.toggle('hidden', !!state.user);
  refs.logoutBtn.classList.toggle('hidden', !state.user);
  document.querySelectorAll('.device-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.device === state.device);
  });
  refs.saveBtn.disabled = !site;
  refs.exportBtn.disabled = !site;
  refs.duplicateSiteBtn.disabled = !site;
  refs.addPageBtn.disabled = !site;
  refs.duplicatePageBtn.disabled = !site;
  refs.deletePageBtn.disabled = !site;
  refs.homePageBtn.disabled = !site;
}

function renderAll() {
  if (!state.currentSiteId && state.sites[0]) {
    state.currentSiteId = state.sites[0].id;
    state.currentPageId = state.sites[0].pages[0]?.id || null;
  }
  renderSiteSelect();
  renderTemplates();
  renderPages();
  renderAssets();
  renderCanvas();
  renderInspectors();
  renderStatus();
}

function openModal(innerHtml, onReady) {
  refs.modalRoot.innerHTML = `
    <div class="modal-backdrop">
      <div class="modal">
        ${innerHtml}
      </div>
    </div>
  `;
  refs.modalRoot.querySelector('.modal-backdrop').addEventListener('click', (event) => {
    if (event.target.classList.contains('modal-backdrop')) closeModal();
  });
  onReady?.();
}

function closeModal() {
  refs.modalRoot.innerHTML = '';
}


function openNewSiteModal(defaultTemplateId = 'minimal-business', existingSite = null) {
  let stepIndex = 0;
  let templateCursor = 0;
  let styleCursor = 0;
  const existingMeta = existingSite ? ensureSiteMeta(existingSite) : null;
  const form = {
    name: existingSite?.name || 'New Project',
    kind: existingSite?.kind || 'website',
    deviceTarget: existingSite?.deviceTarget || 'responsive',
    templateId: existingSite?.templateId || defaultTemplateId,
    pageCount: existingMeta?.quoteConfig?.pageCount || Math.max(1, existingSite?.pages?.length || 3),
    stylePresetId: existingMeta?.quoteConfig?.stylePresetId || 'custom',
    features: { payments: false, login: false, booking: false, cms: false, forms: false, custom: false, ...(existingMeta?.quoteConfig?.features || {}) },
    customFeatureNotes: existingMeta?.quoteConfig?.customFeatureNotes || '',
    intake: {
      customerName: existingMeta?.intake?.customerName || '',
      customerEmail: existingMeta?.intake?.customerEmail || '',
      businessName: existingMeta?.intake?.businessName || '',
      hostPreference: existingMeta?.intake?.hostPreference || 'zach-host',
      wantsDomain: !!existingMeta?.intake?.wantsDomain,
      requestedDomain: existingMeta?.intake?.requestedDomain || '',
      galleryOptIn: !!existingMeta?.intake?.galleryOptIn,
      customerBuiltNote: existingMeta?.intake?.customerBuiltNote ?? true,
      galleryNote: existingMeta?.intake?.galleryNote || '',
      deploymentAgreement: !!existingMeta?.intake?.deploymentAgreement,
      domainDisclaimerAccepted: !!existingMeta?.intake?.domainDisclaimerAccepted,
      featureNotes: existingMeta?.intake?.featureNotes || ''
    },
    previewSlug: existingMeta?.showcase?.previewSlug || slugify(existingSite?.name || 'preview')
  };

  const screens = [
    'kind',
    'focus',
    'payments',
    'login',
    'booking',
    'cms',
    'forms',
    'custom',
    'domain',
    'hosting',
    'pagesMode',
    'pageCount',
    'foundation',
    'style',
    'summary'
  ];

  function filteredTemplates() {
    return [
      {
        id: 'blank-starter',
        name: 'Build from scratch',
        kind: form.kind,
        deviceTarget: form.deviceTarget,
        description: 'Start with a clean canvas and add every block yourself.',
        site: {
          theme: { primary: '#5571ef', canvas: '#f8fafc', surface: '#ffffff', text: '#0f172a' },
          pages: [{
            elements: [
              { type: 'heading', x: 84, y: 84, w: form.deviceTarget === 'mobile' ? 220 : 420, h: 64 },
              { type: 'text', x: 84, y: 170, w: form.deviceTarget === 'mobile' ? 220 : 500, h: 44 },
              { type: 'button', x: 84, y: 240, w: 160, h: 44 },
              { type: 'box', x: form.deviceTarget === 'mobile' ? 84 : 660, y: 84, w: form.deviceTarget === 'mobile' ? 220 : 340, h: 240 }
            ]
          }]
        }
      },
      ...TEMPLATE_PRESETS.filter(t => form.kind === 'webapp' ? t.kind === 'webapp' : t.kind === 'website')
    ];
  }

  function visibleTemplates() {
    const list = filteredTemplates();
    const start = Math.max(0, Math.min(templateCursor, Math.max(0, list.length - 2)));
    return list.slice(start, start + 2);
  }

  function visibleStyles() {
    const list = STYLE_PRESETS;
    const start = Math.max(0, Math.min(styleCursor, Math.max(0, list.length - 2)));
    return list.slice(start, start + 2);
  }

  function elementFrame(el, previewDevice = 'desktop') {
    const fallback = { x: el.x || 0, y: el.y || 0, w: el.w || 120, h: el.h || 40 };
    return { ...fallback, ...(el.layouts?.[previewDevice] || {}) };
  }

  function renderTemplatePreviewCard(template, active = false) {
    const page = template.site?.pages?.[0];
    const previewDevice = form.deviceTarget === 'mobile' || template.deviceTarget === 'mobile' ? 'mobile' : 'desktop';
    const baseWidth = previewDevice === 'mobile' ? 390 : 1200;
    const baseHeight = previewDevice === 'mobile' ? 780 : 760;
    const frameClass = previewDevice === 'mobile' ? 'mini-preview phone' : 'mini-preview';
    const elements = (page?.elements || []).slice(0, 10).map((el) => {
      const frame = elementFrame(el, previewDevice);
      const left = Math.max(0, Math.min(100, (frame.x / baseWidth) * 100));
      const top = Math.max(0, Math.min(100, (frame.y / baseHeight) * 100));
      const width = Math.max(6, Math.min(96, (frame.w / baseWidth) * 100));
      const height = Math.max(4, Math.min(60, (frame.h / baseHeight) * 100));
      const bg = el.type === 'button'
        ? (template.site?.theme?.primary || '#5571ef')
        : el.type === 'box'
          ? (template.site?.theme?.surface || '#ffffff')
          : el.type === 'image' || el.type === 'video'
            ? 'linear-gradient(135deg, rgba(85,113,239,.28), rgba(121,255,212,.18))'
            : 'rgba(15,23,42,.10)';
      const radius = el.type === 'button' ? 999 : el.type === 'box' ? 14 : 8;
      const opacity = el.type === 'heading' ? 1 : el.type === 'text' ? .74 : .92;
      return `<div class="mini-element ${el.type}" style="left:${left}%;top:${top}%;width:${width}%;height:${height}%;background:${bg};border-radius:${radius}px;opacity:${opacity};"></div>`;
    }).join('');
    return `
      <button class="decision-card preview-card ${active ? 'active' : ''}" data-template-option="${template.id}">
        <div class="card-topline">
          <span class="pill">${template.kind === 'webapp' ? 'App' : 'Site'}</span>
          <span class="mini-tag">${template.deviceTarget === 'mobile' ? 'Phone-first' : template.deviceTarget === 'desktop' ? 'Desktop-first' : 'Responsive'}</span>
        </div>
        <div class="${frameClass}" style="background:${template.site?.theme?.canvas || '#f8fafc'};color:${template.site?.theme?.text || '#0f172a'};">
          <div class="mini-browser-bar"></div>
          ${elements}
        </div>
        <div class="decision-copy">
          <strong>${template.name}</strong>
          <div class="small muted">${template.description}</div>
        </div>
      </button>`;
  }

  function renderStylePreviewCard(style, active = false) {
    const theme = style.theme || { primary: '#5571ef', canvas: '#f8fafc', surface: '#ffffff', text: '#0f172a', headingFont: 'Manrope', bodyFont: 'Inter' };
    return `
      <button class="decision-card style-card ${active ? 'active' : ''}" data-style-option="${style.id}">
        <div class="card-topline">
          <span class="pill">Style</span>
          <span class="mini-tag">${style.id === 'custom' ? 'Template native' : 'Theme swap'}</span>
        </div>
        <div class="style-preview" style="background:${theme.canvas};color:${theme.text};">
          <div class="style-swatch-row">
            <span class="style-swatch" style="background:${theme.primary};"></span>
            <span class="style-swatch" style="background:${theme.surface};border:1px solid rgba(15,23,42,.08);"></span>
            <span class="style-swatch" style="background:${theme.text};"></span>
          </div>
          <div class="style-heading" style="font-family:${theme.headingFont || 'Manrope'};">Aa</div>
          <div class="style-lines">
            <span></span><span></span><span></span>
          </div>
          <div class="style-button" style="background:${theme.primary};"></div>
        </div>
        <div class="decision-copy">
          <strong>${style.name}</strong>
          <div class="small muted">${style.note || 'Preview the colors and typography before opening the builder.'}</div>
        </div>
      </button>`;
  }

  function renderBinaryQuestion({ title, copy, left, right, backLabel = 'Back' }) {
    openModal(`
      <div class="decision-shell">
        <div class="row" style="justify-content:space-between;align-items:flex-start;gap:14px;">
          <div>
            <div class="eyebrow">${PRODUCT_NAME}</div>
            <h2 style="margin-top:6px;">${title}</h2>
            <p class="muted" style="max-width:540px;">${copy}</p>
          </div>
          <button class="btn ghost compact" id="closeModalBtn">Close</button>
        </div>
        <div class="decision-card-grid two-up">
          <button class="decision-card ${left.active ? 'active' : ''}" id="decisionLeftBtn">
            ${left.kicker ? `<div class="card-topline"><span class="pill">${left.kicker}</span></div>` : ''}
            ${left.preview || ''}
            <div class="decision-copy"><strong>${left.label}</strong><div class="small muted">${left.note || ''}</div></div>
          </button>
          <button class="decision-card ${right.active ? 'active' : ''}" id="decisionRightBtn">
            ${right.kicker ? `<div class="card-topline"><span class="pill">${right.kicker}</span></div>` : ''}
            ${right.preview || ''}
            <div class="decision-copy"><strong>${right.label}</strong><div class="small muted">${right.note || ''}</div></div>
          </button>
        </div>
        <div class="sub-actions">
          <button class="btn ghost" id="wizardBackBtn" ${stepIndex === 0 ? 'disabled' : ''}>${backLabel}</button>
        </div>
      </div>
    `, () => {
      document.getElementById('closeModalBtn')?.addEventListener('click', closeModal);
      document.getElementById('wizardBackBtn')?.addEventListener('click', prevStep);
      document.getElementById('decisionLeftBtn')?.addEventListener('click', left.onSelect);
      document.getElementById('decisionRightBtn')?.addEventListener('click', right.onSelect);
    });
  }

  function nextStep() {
    stepIndex = Math.min(stepIndex + 1, screens.length - 1);
    if (screens[stepIndex] === 'pageCount' && Number(form.pageCount) === 1) {
      stepIndex += 1;
    }
    renderCurrentStep();
  }

  function prevStep() {
    stepIndex = Math.max(0, stepIndex - 1);
    if (screens[stepIndex] === 'pageCount' && Number(form.pageCount) === 1) {
      stepIndex -= 1;
    }
    renderCurrentStep();
  }

  function jumpNext() {
    nextStep();
  }

  function renderCurrentStep() {
    const screen = screens[stepIndex];

    if (screen === 'kind') {
      renderBinaryQuestion({
        title: 'What are you building?',
        copy: 'Pick the base mode first. You can still change blocks, layout, and styling later.',
        left: {
          kicker: 'Website',
          preview: '<div class="mini-preview"><div class="mini-browser-bar"></div><div class="mini-element heading" style="left:10%;top:18%;width:56%;height:10%;"></div><div class="mini-element text" style="left:10%;top:34%;width:40%;height:7%;opacity:.72;"></div><div class="mini-element button" style="left:10%;top:50%;width:24%;height:10%;background:#5571ef;border-radius:999px;"></div><div class="mini-element box" style="left:62%;top:18%;width:26%;height:42%;background:#ffffff;border-radius:18px;"></div></div>',
          label: 'Website',
          note: 'Best for service sites, landing pages, portfolios, ecommerce pages, and business sites.',
          active: form.kind === 'website',
          onSelect: () => { form.kind = 'website'; if (form.templateId && TEMPLATE_PRESETS.find(t => t.id === form.templateId)?.kind !== 'website' && form.templateId !== 'blank-starter') form.templateId = 'minimal-business'; templateCursor = 0; jumpNext(); }
        },
        right: {
          kicker: 'Web app',
          preview: '<div class="mini-preview phone"><div class="mini-browser-bar"></div><div class="mini-element heading" style="left:14%;top:16%;width:48%;height:10%;"></div><div class="mini-element box" style="left:14%;top:32%;width:72%;height:18%;background:#ffffff;border-radius:18px;"></div><div class="mini-element box" style="left:14%;top:56%;width:34%;height:18%;background:#ffffff;border-radius:18px;"></div><div class="mini-element box" style="left:52%;top:56%;width:34%;height:18%;background:#ffffff;border-radius:18px;"></div></div>',
          label: 'Web app',
          note: 'Best for dashboards, portals, installable PWAs, and phone or desktop app-style layouts.',
          active: form.kind === 'webapp',
          onSelect: () => { form.kind = 'webapp'; if (form.templateId && TEMPLATE_PRESETS.find(t => t.id === form.templateId)?.kind !== 'webapp' && form.templateId !== 'blank-starter') form.templateId = 'app-landing'; templateCursor = 0; jumpNext(); }
        }
      });
      return;
    }

    if (screen === 'focus') {
      renderBinaryQuestion({
        title: 'Which view matters more?',
        copy: 'This just picks the starting canvas emphasis. You will still be able to preview both phone and computer layouts.',
        left: {
          kicker: 'Computer',
          preview: '<div class="mini-preview"><div class="mini-browser-bar"></div><div class="mini-element heading" style="left:9%;top:16%;width:48%;height:9%;"></div><div class="mini-element box" style="left:9%;top:32%;width:32%;height:36%;background:#ffffff;border-radius:16px;"></div><div class="mini-element box" style="left:45%;top:32%;width:20%;height:36%;background:#ffffff;border-radius:16px;"></div><div class="mini-element box" style="left:69%;top:32%;width:20%;height:36%;background:#ffffff;border-radius:16px;"></div></div>',
          label: 'Mostly computer',
          note: 'Starts with a desktop-first layout and wider composition.',
          active: form.deviceTarget === 'desktop' || form.deviceTarget === 'responsive',
          onSelect: () => { form.deviceTarget = 'desktop'; jumpNext(); }
        },
        right: {
          kicker: 'Phone',
          preview: '<div class="mini-preview phone"><div class="mini-browser-bar"></div><div class="mini-element heading" style="left:16%;top:16%;width:42%;height:9%;"></div><div class="mini-element text" style="left:16%;top:30%;width:56%;height:6%;opacity:.72;"></div><div class="mini-element button" style="left:16%;top:42%;width:48%;height:9%;background:#5571ef;border-radius:999px;"></div><div class="mini-element box" style="left:16%;top:58%;width:68%;height:16%;background:#ffffff;border-radius:16px;"></div></div>',
          label: 'Mostly phone',
          note: 'Starts with a phone-first layout and tighter stacked sections.',
          active: form.deviceTarget === 'mobile',
          onSelect: () => { form.deviceTarget = 'mobile'; jumpNext(); }
        }
      });
      return;
    }

    const featureQuestions = {
      payments: { title: 'Do you need payments?', copy: 'Good for selling products, taking deposits, or adding checkout later.', key: 'payments' },
      login: { title: 'Do you need login or account management?', copy: 'Use this for member portals, gated dashboards, or user accounts.', key: 'login' },
      booking: { title: 'Do you need booking or scheduling?', copy: 'Turn this on if the project should handle appointments, availability, or lead scheduling.', key: 'booking' },
      cms: { title: 'Do you need an editable blog or CMS?', copy: 'Best for news, articles, repeated listings, or content you plan to update often.', key: 'cms' },
      forms: { title: 'Do you need advanced forms or CRM capture?', copy: 'Use this for deeper lead capture, multi-step forms, or routing submissions to a system.', key: 'forms' },
      custom: { title: 'Do you need custom automation or integrations?', copy: 'Turn this on if you expect special workflows, API connections, or custom backend logic.', key: 'custom' }
    };

    if (featureQuestions[screen]) {
      const q = featureQuestions[screen];
      renderBinaryQuestion({
        title: q.title,
        copy: q.copy,
        left: {
          kicker: 'Yes',
          label: 'Yes, include it',
          note: 'We will save this into the project scope before the builder opens.',
          active: !!form.features[q.key],
          onSelect: () => { form.features[q.key] = true; jumpNext(); }
        },
        right: {
          kicker: 'No',
          label: 'No, keep it simple',
          note: 'You can still change your mind later before final export.',
          active: !form.features[q.key],
          onSelect: () => { form.features[q.key] = false; jumpNext(); }
        }
      });
      return;
    }

    if (screen === 'domain') {
      renderBinaryQuestion({
        title: 'Do you want help with a domain?',
        copy: 'The base package does not include the domain itself. If you want help, the desired name can be added later before final export.',
        left: {
          kicker: 'Yes',
          label: 'Yes, help me with the domain',
          note: 'We will flag the project so the domain request shows up later in the final intake.',
          active: !!form.intake.wantsDomain,
          onSelect: () => { form.intake.wantsDomain = true; jumpNext(); }
        },
        right: {
          kicker: 'No',
          label: 'No, I will handle the domain',
          note: 'The project still exports cleanly for self-managed domains or hosting.',
          active: !form.intake.wantsDomain,
          onSelect: () => { form.intake.wantsDomain = false; form.intake.requestedDomain = ''; jumpNext(); }
        }
      });
      return;
    }

    if (screen === 'hosting') {
      renderBinaryQuestion({
        title: 'Who should host it?',
        copy: 'This is only used for handoff later. It does not change the playground builder.',
        left: {
          kicker: 'Hosted by Zach',
          label: 'Have Zach host it',
          note: 'Useful when you want the finished project deployed for you.',
          active: form.intake.hostPreference === 'zach-host',
          onSelect: () => { form.intake.hostPreference = 'zach-host'; jumpNext(); }
        },
        right: {
          kicker: 'Self-hosted',
          label: 'I want to host it myself',
          note: 'Useful when you want the ZIP and plan to deploy it on your own.',
          active: form.intake.hostPreference === 'self-host',
          onSelect: () => { form.intake.hostPreference = 'self-host'; jumpNext(); }
        }
      });
      return;
    }

    if (screen === 'pagesMode') {
      renderBinaryQuestion({
        title: 'Is this a one-page build?',
        copy: 'Choose a simple single-page build or a fuller multi-page starter.',
        left: {
          kicker: 'One page',
          label: 'Yes, keep it one page',
          note: 'Great for most landing pages, simple business sites, or tight app marketing pages.',
          active: Number(form.pageCount) === 1,
          onSelect: () => { form.pageCount = 1; jumpNext(); }
        },
        right: {
          kicker: 'Multi-page',
          label: 'No, give me multiple pages',
          note: 'Better for navigation, about pages, contact pages, dashboards, or deeper content.',
          active: Number(form.pageCount) > 1,
          onSelect: () => { form.pageCount = Math.max(3, Number(form.pageCount) || 3); jumpNext(); }
        }
      });
      return;
    }

    if (screen === 'pageCount') {
      renderBinaryQuestion({
        title: 'How big should the starter be?',
        copy: 'This only sets the starting structure. You can still add or remove pages later.',
        left: {
          kicker: 'Lean',
          label: 'Start with 3 pages',
          note: 'Usually enough for Home, About, and Contact or a compact app shell.',
          active: Number(form.pageCount) === 3,
          onSelect: () => { form.pageCount = 3; jumpNext(); }
        },
        right: {
          kicker: 'Expanded',
          label: 'Start with 5 pages',
          note: 'Better if you already know this will need more sections or flows.',
          active: Number(form.pageCount) >= 5,
          onSelect: () => { form.pageCount = 5; jumpNext(); }
        }
      });
      return;
    }

    if (screen === 'foundation') {
      const cards = visibleTemplates().map(template => renderTemplatePreviewCard(template, template.id === form.templateId)).join('');
      openModal(`
        <div class="decision-shell">
          <div class="row" style="justify-content:space-between;align-items:flex-start;gap:14px;">
            <div>
              <div class="eyebrow">${PRODUCT_NAME}</div>
              <h2 style="margin-top:6px;">Pick a starting layout</h2>
              <p class="muted" style="max-width:560px;">You are seeing the actual starter layout shapes here, not just labels. Pick one to open as your base.</p>
            </div>
            <button class="btn ghost compact" id="closeModalBtn">Close</button>
          </div>
          <div class="decision-card-grid two-up">${cards}</div>
          <div class="sub-actions between">
            <button class="btn ghost" id="wizardBackBtn">Back</button>
            <div class="row wrap">
              ${filteredTemplates().length > 2 ? '<button class="btn ghost" id="moreTemplatesBtn">More looks</button>' : ''}
            </div>
          </div>
        </div>
      `, () => {
        document.getElementById('closeModalBtn')?.addEventListener('click', closeModal);
        document.getElementById('wizardBackBtn')?.addEventListener('click', prevStep);
        document.getElementById('moreTemplatesBtn')?.addEventListener('click', () => {
          const list = filteredTemplates();
          templateCursor = templateCursor + 2 >= list.length ? 0 : templateCursor + 2;
          renderCurrentStep();
        });
        document.querySelectorAll('[data-template-option]').forEach(node => node.addEventListener('click', () => {
          form.templateId = node.dataset.templateOption;
          const picked = filteredTemplates().find(t => t.id === form.templateId);
          if (picked) {
            form.kind = picked.kind || form.kind;
            form.deviceTarget = picked.deviceTarget === 'responsive' ? form.deviceTarget : (picked.deviceTarget || form.deviceTarget);
          }
          jumpNext();
        }));
      });
      return;
    }

    if (screen === 'style') {
      const cards = visibleStyles().map(style => renderStylePreviewCard(style, style.id === form.stylePresetId)).join('');
      openModal(`
        <div class="decision-shell">
          <div class="row" style="justify-content:space-between;align-items:flex-start;gap:14px;">
            <div>
              <div class="eyebrow">${PRODUCT_NAME}</div>
              <h2 style="margin-top:6px;">Pick a style</h2>
              <p class="muted" style="max-width:560px;">These cards show the actual theme feel before the builder opens. Choose one or keep the starter’s default look.</p>
            </div>
            <button class="btn ghost compact" id="closeModalBtn">Close</button>
          </div>
          <div class="decision-card-grid two-up">${cards}</div>
          <div class="sub-actions between">
            <button class="btn ghost" id="wizardBackBtn">Back</button>
            <div class="row wrap">
              ${STYLE_PRESETS.length > 2 ? '<button class="btn ghost" id="moreStylesBtn">More styles</button>' : ''}
            </div>
          </div>
        </div>
      `, () => {
        document.getElementById('closeModalBtn')?.addEventListener('click', closeModal);
        document.getElementById('wizardBackBtn')?.addEventListener('click', prevStep);
        document.getElementById('moreStylesBtn')?.addEventListener('click', () => {
          styleCursor = styleCursor + 2 >= STYLE_PRESETS.length ? 0 : styleCursor + 2;
          renderCurrentStep();
        });
        document.querySelectorAll('[data-style-option]').forEach(node => node.addEventListener('click', () => {
          form.stylePresetId = node.dataset.styleOption;
          jumpNext();
        }));
      });
      return;
    }

    if (screen === 'summary') {
      const templateName = filteredTemplates().find(t => t.id === form.templateId)?.name || 'Starter';
      const enabledFeatures = Object.entries(form.features).filter(([, enabled]) => enabled).map(([key]) => FEATURE_DEFS[key]?.label || key);
      const summaryBits = [
        form.kind === 'webapp' ? 'Web app' : 'Website',
        form.deviceTarget === 'mobile' ? 'Phone-first' : 'Computer-first',
        Number(form.pageCount) === 1 ? '1 page' : `${Number(form.pageCount)} pages`,
        templateName,
        STYLE_PRESETS.find(item => item.id === form.stylePresetId)?.name || 'Style selected',
        form.intake.wantsDomain ? 'Domain help requested' : 'No domain help',
        form.intake.hostPreference === 'zach-host' ? 'Hosted by Zach' : 'Self-hosted',
        ...(enabledFeatures.length ? enabledFeatures : ['Base build only'])
      ];
      openModal(`
        <div class="decision-shell">
          <div class="row" style="justify-content:space-between;align-items:flex-start;gap:14px;">
            <div>
              <div class="eyebrow">${PRODUCT_NAME}</div>
              <h2 style="margin-top:6px;">Ready to open the builder?</h2>
              <p class="muted" style="max-width:560px;">No charge happens here. This just opens the playground with your starter choices already set.</p>
            </div>
            <button class="btn ghost compact" id="closeModalBtn">Close</button>
          </div>
          <div class="summary-pill-wrap">${summaryBits.map(item => `<span class="feature-chip">${escapeHtml(item)}</span>`).join('')}</div>
          <div class="playground-banner">The quote is saved behind the scenes, but it stays out of the onboarding. Customers keep building in playground mode until they choose to finalize and export.</div>
          <div class="sub-actions between">
            <button class="btn ghost" id="wizardBackBtn">Back</button>
            <button class="btn primary" id="wizardCreateBtn">${existingSite ? 'Update project' : 'Open builder'}</button>
          </div>
        </div>
      `, () => {
        document.getElementById('closeModalBtn')?.addEventListener('click', closeModal);
        document.getElementById('wizardBackBtn')?.addEventListener('click', prevStep);
        document.getElementById('wizardCreateBtn')?.addEventListener('click', () => {
          form.previewSlug = slugify(form.previewSlug || form.name || templateName || 'preview');
          if (!form.name || form.name === 'New Project') {
            form.name = existingSite?.name || templateName || (form.kind === 'webapp' ? 'New Web App' : 'New Website');
          }
          if (existingSite) {
            existingSite.name = form.name || existingSite.name;
            existingSite.kind = form.kind;
            existingSite.deviceTarget = form.deviceTarget;
            existingSite.templateId = form.templateId;
            existingSite.builderMeta.quoteConfig.features = { ...form.features };
            existingSite.builderMeta.quoteConfig.pageCount = Number(form.pageCount || 1);
            existingSite.builderMeta.quoteConfig.stylePresetId = form.stylePresetId;
            existingSite.builderMeta.quoteConfig.customFeatureNotes = form.customFeatureNotes;
            existingSite.builderMeta.intake = { ...existingSite.builderMeta.intake, ...form.intake };
            existingSite.builderMeta.showcase.previewSlug = slugify(form.previewSlug || form.name);
            syncPageCount(existingSite, form.pageCount);
            updateCurrentSiteTimestamp();
            saveLocal();
            renderAll();
            markDirty(true);
          } else {
            createNewSite({ name: form.name, kind: form.kind, deviceTarget: form.deviceTarget, templateId: form.templateId, pageCount: form.pageCount, stylePresetId: form.stylePresetId, features: form.features, customFeatureNotes: form.customFeatureNotes, intake: form.intake, previewSlug: form.previewSlug });
          }
          closeModal();
        });
      });
    }
  }

  renderCurrentStep();
}


function openFinalizeExportModal(openSuccessState = false) {
  const site = currentSite();
  if (!site) return;
  normalizeSite(site);
  const meta = ensureSiteMeta(site);
  const quote = getQuote(site);
  const intake = { ...meta.intake };

  function renderFinalize() {
    const paid = !!meta.checkout?.paid;
    openModal(`
      <div class="row" style="justify-content:space-between;align-items:flex-start;">
        <div>
          <div class="eyebrow">${PRODUCT_NAME}</div>
          <h2 style="margin-top:6px;">${paid || openSuccessState ? 'Export unlocked' : 'Finalize and unlock export'}</h2>
        </div>
        <button class="btn ghost compact" id="closeModalBtn">Close</button>
      </div>
      <div class="hr"></div>
      ${(paid || openSuccessState) ? `
        <div class="success-card">
          <strong>Payment verified.</strong><br />This project can now export as a Netlify-ready ZIP. ${meta.showcase?.previewSlug ? `Preview slug saved: <code>${escapeHtml(meta.showcase.previewSlug)}</code>.` : ''}
        </div>
      ` : `
        <div class="summary-grid">
          <div>
            <div class="field-grid">
              <div class="field">
                <label class="field-label">Customer name</label>
                <input class="input" id="finCustomerName" value="${escapeHtml(intake.customerName || '')}" />
              </div>
              <div class="field">
                <label class="field-label">Customer email</label>
                <input class="input" id="finCustomerEmail" value="${escapeHtml(intake.customerEmail || '')}" />
              </div>
            </div>
            <div class="field-grid">
              <div class="field">
                <label class="field-label">Business / brand name</label>
                <input class="input" id="finBusinessName" value="${escapeHtml(intake.businessName || site.name || '')}" />
              </div>
              <div class="field">
                <label class="field-label">Hosting preference</label>
                <select class="select" id="finHostPreference">
                  <option value="zach-host" ${intake.hostPreference === 'zach-host' ? 'selected' : ''}>Have Zach host it</option>
                  <option value="self-host" ${intake.hostPreference === 'self-host' ? 'selected' : ''}>Customer will host it</option>
                </select>
              </div>
            </div>
            <label class="checkbox-row"><input type="checkbox" id="finWantsDomain" ${intake.wantsDomain ? 'checked' : ''} /> Request a domain through Zach</label>
            <div class="field ${intake.wantsDomain ? '' : 'hidden'}" id="finDomainWrap">
              <label class="field-label">Requested domain name</label>
              <input class="input" id="finRequestedDomain" value="${escapeHtml(intake.requestedDomain || '')}" />
              <div class="form-note">Domain is not included in the base price. It usually costs about ${formatMoney(10)}–${formatMoney(15)}/year depending on availability.</div>
            </div>
            <label class="checkbox-row"><input type="checkbox" id="finGalleryOptIn" ${intake.galleryOptIn ? 'checked' : ''} /> Allow Zach to include this build in the Zach Edwards LLC gallery</label>
            <div class="field ${intake.galleryOptIn ? '' : 'hidden'}" id="finGalleryWrap">
              <label class="field-label">Gallery note</label>
              <input class="input" id="finGalleryNote" value="${escapeHtml(intake.galleryNote || '')}" placeholder="Optional note for the gallery card" />
              <label class="checkbox-row" style="margin-top:10px;"><input type="checkbox" id="finCustomerBuiltNote" ${intake.customerBuiltNote ? 'checked' : ''} /> Add a “built by customer” note for Zach's advertising/gallery</label>
              <div class="field" style="margin-top:10px;">
                <label class="field-label">Gallery preview slug</label>
                <input class="input" id="finPreviewSlug" value="${escapeHtml(meta.showcase?.previewSlug || slugify(site.name))}" />
              </div>
            </div>
            <div class="field">
              <label class="field-label">Additional feature notes / scoping details</label>
              <textarea class="textarea" id="finFeatureNotes">${escapeHtml(intake.featureNotes || meta.quoteConfig.customFeatureNotes || '')}</textarea>
            </div>
            <label class="checkbox-row"><input type="checkbox" id="finTermDeploy" ${intake.deploymentAgreement ? 'checked' : ''} /> I understand the build is targeted to be deployed within one week after finalization.</label>
            <label class="checkbox-row"><input type="checkbox" id="finTermDomain" ${intake.domainDisclaimerAccepted ? 'checked' : ''} /> I understand the domain is not included and may cost extra depending on availability.</label>
          </div>
          <div>
            <div class="price-card">
              <div class="kicker">Checkout summary</div>
              <div class="price-row"><span>Base package</span><strong>${formatMoney(quote.basePrice)}</strong></div>
              ${quote.featureLines.map(item => `<div class="price-row"><span>${item.label}</span><strong>${item.price ? formatMoney(item.price) : 'Quoted later'}</strong></div>`).join('') || `<div class="price-row"><span>No paid add-ons</span><strong>${formatMoney(0)}</strong></div>`}
              <div class="price-row"><span>Due now</span><strong class="price-total">${formatMoney(quote.totalNow)}</strong></div>
              <div class="price-row"><span>Domain later</span><strong>${intake.wantsDomain ? `${formatMoney(10)}–${formatMoney(15)}/yr est.` : 'Not requested'}</strong></div>
            </div>
            <div class="notice" style="margin-top:12px;">
              Export is locked until checkout succeeds. The customer can still keep building in playground mode without being charged.
            </div>
            <div class="hero-stat" style="margin-top:12px;"><strong>Public gallery feed</strong><span class="inline-note">Opted-in paid projects are exposed through <code>/.netlify/functions/public-projects</code> so your main Zach Edwards LLC site can preview them.</span></div>
          </div>
        </div>`}
      <div class="step-actions">
        <button class="btn ghost" id="saveFinalizeDraftBtn">Save draft</button>
        <div class="row wrap">
          ${(paid || openSuccessState) ? `<button class="btn primary" id="downloadAfterPaidBtn">Download ZIP now</button>` : `<button class="btn primary" id="startCheckoutBtn">Continue to Stripe checkout</button>`}
        </div>
      </div>
    `, () => {
      document.getElementById('closeModalBtn')?.addEventListener('click', closeModal);
      document.getElementById('finWantsDomain')?.addEventListener('change', (e) => { intake.wantsDomain = e.target.checked; renderFinalize(); });
      document.getElementById('finGalleryOptIn')?.addEventListener('change', (e) => { intake.galleryOptIn = e.target.checked; renderFinalize(); });
      document.getElementById('saveFinalizeDraftBtn')?.addEventListener('click', async () => {
        intake.customerName = document.getElementById('finCustomerName')?.value || intake.customerName;
        intake.customerEmail = document.getElementById('finCustomerEmail')?.value || intake.customerEmail;
        intake.businessName = document.getElementById('finBusinessName')?.value || intake.businessName;
        intake.hostPreference = document.getElementById('finHostPreference')?.value || intake.hostPreference;
        intake.requestedDomain = document.getElementById('finRequestedDomain')?.value || intake.requestedDomain;
        intake.galleryNote = document.getElementById('finGalleryNote')?.value || intake.galleryNote;
        intake.customerBuiltNote = document.getElementById('finCustomerBuiltNote')?.checked ?? intake.customerBuiltNote;
        intake.featureNotes = document.getElementById('finFeatureNotes')?.value || intake.featureNotes;
        intake.deploymentAgreement = document.getElementById('finTermDeploy')?.checked ?? intake.deploymentAgreement;
        intake.domainDisclaimerAccepted = document.getElementById('finTermDomain')?.checked ?? intake.domainDisclaimerAccepted;
        meta.intake = { ...meta.intake, ...intake };
        if (document.getElementById('finPreviewSlug')) meta.showcase.previewSlug = slugify(document.getElementById('finPreviewSlug').value || site.name);
        await saveCurrentSiteSilently();
        setSaveMessage('Finalization draft saved. The project is still in playground mode until checkout succeeds.');
        closeModal();
      });
      document.getElementById('downloadAfterPaidBtn')?.addEventListener('click', async () => { closeModal(); await exportCurrentSiteZip(); });
      document.getElementById('startCheckoutBtn')?.addEventListener('click', async () => {
        intake.customerName = document.getElementById('finCustomerName')?.value || '';
        intake.customerEmail = document.getElementById('finCustomerEmail')?.value || '';
        intake.businessName = document.getElementById('finBusinessName')?.value || '';
        intake.hostPreference = document.getElementById('finHostPreference')?.value || 'zach-host';
        intake.requestedDomain = document.getElementById('finRequestedDomain')?.value || '';
        intake.galleryNote = document.getElementById('finGalleryNote')?.value || '';
        intake.customerBuiltNote = document.getElementById('finCustomerBuiltNote')?.checked ?? true;
        intake.featureNotes = document.getElementById('finFeatureNotes')?.value || '';
        intake.deploymentAgreement = document.getElementById('finTermDeploy')?.checked || false;
        intake.domainDisclaimerAccepted = document.getElementById('finTermDomain')?.checked || false;
        if (!intake.customerEmail || !intake.customerName) { alert('Customer name and email are required before checkout.'); return; }
        if (!intake.deploymentAgreement || !intake.domainDisclaimerAccepted) { alert('Please accept the deployment and domain terms before checkout.'); return; }
        meta.intake = { ...meta.intake, ...intake };
        meta.showcase.previewSlug = slugify(document.getElementById('finPreviewSlug')?.value || site.name || 'preview');
        meta.showcase.publicPreviewRequested = !!intake.galleryOptIn;
        meta.checkout.lockedQuote = quote;
        await saveCurrentSiteSilently();
        try {
          const data = await postJson('/.netlify/functions/create-checkout-session', { siteId: site.id, siteName: site.name, siteSnapshot: site, quote, intake: meta.intake, previewSlug: meta.showcase.previewSlug, ownerId: state.user?.sub || null, ownerEmail: state.user?.email || null });
          if (data?.url) window.location.href = data.url;
        } catch (error) {
          alert(`Unable to start Stripe checkout: ${error.message}`);
        }
      });
    });
  }

  renderFinalize();
}

async function handleSave() {
  const site = currentSite();
  if (!site) return;
  site.updatedAt = new Date().toISOString();
  saveLocal();
  let remoteSaved = false;
  if (state.user) {
    remoteSaved = await pushCurrentSiteRemote();
  }
  markDirty(false);
  setSaveMessage(remoteSaved
    ? 'Saved locally and to Neon.'
    : state.user
      ? 'Saved locally. Remote save failed, so Neon needs setup or function fixes.'
      : 'Saved locally. Enable Identity + Neon later for remote storage.');
  renderStatus();
}

async function handleAssetUpload(event) {
  const files = Array.from(event.target.files || []);
  const site = currentSite();
  if (!site || !files.length) return;
  for (const file of files) {
    const dataUrl = await readFileAsDataUrl(file);
    const kind = file.type.startsWith('video/') ? 'video' : 'image';
    site.assets.push({
      id: uid('asset'),
      name: file.name,
      fileName: sanitizeFileName(file.name),
      mimeType: file.type,
      kind,
      dataUrl
    });
  }
  updateCurrentSiteTimestamp();
  saveLocal();
  renderAssets();
  markDirty(true);
  event.target.value = '';
}

function sanitizeFileName(name) {
  const parts = name.split('.');
  const ext = parts.length > 1 ? parts.pop() : 'bin';
  const stem = parts.join('.').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'asset';
  return `${stem}-${Math.random().toString(36).slice(2, 7)}.${ext.toLowerCase()}`;
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function dataUrlToBytes(dataUrl) {
  const [meta, body] = dataUrl.split(',');
  const isBase64 = meta.includes(';base64');
  if (!isBase64) return new TextEncoder().encode(decodeURIComponent(body));
  const binary = atob(body);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function pageFileName(page) {
  return page.isHome || page.slug === 'index' ? 'index.html' : `${page.slug}.html`;
}

function elementCssRules(element, index, prefix = 'page') {
  const safePrefix = String(prefix).replace(/[^a-z0-9_-]+/gi, '-');
  const id = `${safePrefix}-node-${index}`;
  const style = element.styles || {};
  const rules = [];
  const addRule = (device, query) => {
    const l = element.layouts?.[device] || element.layouts?.desktop;
    if (!l) return;
    const css = `
      #${id}{
        left:${l.x}px;
        top:${l.y}px;
        width:${l.w}px;
        height:${l.h}px;
        ${element.visibleOn?.[device] === false ? 'display:none;' : ''}
      }
    `;
    if (query) rules.push(`${query}{${css}}`);
    else rules.push(css);
  };
  addRule('desktop', null);
  addRule('tablet', '@media (max-width: 980px)');
  addRule('mobile', '@media (max-width: 700px)');
  const shared = `
    #${id}{
      position:absolute;
      color:${style.color || '#111827'};
      background:${style.background || 'transparent'};
      font-family:${style.fontFamily && style.fontFamily !== 'inherit' ? (style.fontFamily.includes(' ') ? `'${style.fontFamily}'` : style.fontFamily) : 'var(--body-font)'}, system-ui, sans-serif;
      font-size:${style.fontSize || 18}px;
      font-weight:${style.fontWeight || 600};
      border-radius:${style.borderRadius || 0}px;
      border:${style.borderWidth || 0}px solid ${style.borderColor || 'transparent'};
      padding:${style.padding || 0}px;
      box-shadow:${style.boxShadow || 'none'};
      text-align:${style.textAlign || 'left'};
      letter-spacing:${style.letterSpacing || 0}px;
      line-height:${style.lineHeight || 1.3};
      opacity:${style.opacity ?? 1};
      overflow:hidden;
      box-sizing:border-box;
    }
  `;
  rules.unshift(shared);
  return { id, css: rules.join('\n') };
}

function getExportedSiteWidth(site) {
  if (site.deviceTarget === 'mobile') return 390;
  if (site.deviceTarget === 'desktop') return 1200;
  return 'min(100%, 1200px)';
}

function exportElementHtml(element, nodeId, assetPathMap) {
  const content = element.content || {};
  if (element.type === 'text' || element.type === 'heading') {
    const tag = element.type === 'heading' ? 'h1' : 'div';
    return `<${tag} id="${nodeId}">${escapeHtml(content.text || '')}</${tag}>`;
  }
  if (element.type === 'button') {
    return `<a id="${nodeId}" href="${escapeHtml(content.href || '#')}" class="site-btn">${escapeHtml(content.text || 'Button')}</a>`;
  }
  if (element.type === 'image') {
    const src = content.assetId && assetPathMap[content.assetId] ? assetPathMap[content.assetId] : (content.src || '');
    return `<img id="${nodeId}" src="${src}" alt="${escapeHtml(content.alt || '')}" />`;
  }
  if (element.type === 'video') {
    const src = content.assetId && assetPathMap[content.assetId] ? assetPathMap[content.assetId] : (content.src || '');
    return `<video id="${nodeId}" src="${src}" controls playsinline></video>`;
  }
  if (element.type === 'box') {
    return `<div id="${nodeId}">${escapeHtml(content.text || '')}</div>`;
  }
  if (element.type === 'form') {
    return `
      <form id="${nodeId}" name="contact" method="POST" data-netlify="true">
        <input type="hidden" name="form-name" value="contact" />
        <div class="form-title">${escapeHtml(content.title || 'Contact us')}</div>
        <div class="form-grid">
          <input type="text" name="name" placeholder="Name" />
          <input type="email" name="email" placeholder="Email" />
          <textarea name="message" placeholder="Message"></textarea>
          <button type="submit">Submit</button>
        </div>
      </form>
    `;
  }
  return `<div id="${nodeId}"></div>`;
}

function buildPageHtml(site, page, assetPathMap) {
  const pagePrefix = page.slug || page.id;
  const elementBlocks = page.elements.map((element, index) => {
    const { id, css } = elementCssRules(element, index + 1, pagePrefix);
    return {
      html: exportElementHtml(element, id, assetPathMap),
      css
    };
  });

  const pageCss = elementBlocks.map(b => b.css).join('\n');
  const navLinks = site.pages.map(p => `<a href="${pageFileName(p)}"${p.id === page.id ? ' class="active"' : ''}>${escapeHtml(p.name)}</a>`).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(site.name)} · ${escapeHtml(page.name)}</title>
  <meta name="description" content="${escapeHtml(site.name)} exported from ZachEdwardsLLC Manual Webbuilder." />
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&family=Inter:wght@400;500;600;700;800&family=Manrope:wght@400;500;700;800&family=Playfair+Display:wght@600;700&family=Poppins:wght@400;500;600;700&family=Space+Grotesk:wght@400;500;700&display=swap" rel="stylesheet">
  ${site.kind === 'webapp' ? `<link rel="manifest" href="/manifest.webmanifest" />` : ''}
  <link rel="stylesheet" href="/site.css" />
  <style>${pageCss}</style>
</head>
<body class="${site.kind === 'webapp' ? 'kind-webapp' : 'kind-website'}">
  <header class="site-header">
    <div class="site-header-inner">
      <strong>${escapeHtml(site.name)}</strong>
      <nav>${navLinks}</nav>
    </div>
  </header>

  <main class="site-main">
    <section class="site-canvas">
      ${elementBlocks.map(b => b.html).join('\n')}
    </section>
  </main>

  <script src="/site.js"></script>
</body>
</html>
<!-- page:${page.name} -->`;
}

function buildExportCss(site) {
  const theme = site.theme || {};
  const desktopWidth = site.deviceTarget === 'mobile' ? 390 : 1200;
  return `
:root{
  --primary:${theme.primary || '#445bff'};
  --canvas:${theme.canvas || '#f8fafc'};
  --surface:${theme.surface || '#ffffff'};
  --text:${theme.text || '#111827'};
  --heading-font:${(theme.headingFont || 'Manrope').includes(' ') ? `'${theme.headingFont}'` : theme.headingFont};
  --body-font:${(theme.bodyFont || 'Inter').includes(' ') ? `'${theme.bodyFont}'` : theme.bodyFont};
}
*{box-sizing:border-box}
html,body{margin:0;padding:0}
body{
  font-family:var(--body-font),system-ui,sans-serif;
  background:var(--canvas);
  color:var(--text);
}
a{color:inherit;text-decoration:none}
.site-header{
  position:sticky;top:0;z-index:20;
  backdrop-filter:blur(12px);
  background:rgba(255,255,255,.82);
  border-bottom:1px solid rgba(15,23,42,.08);
}
.kind-webapp .site-header{background:rgba(255,255,255,.88)}
.site-header-inner{
  max-width:1200px;margin:0 auto;padding:16px 20px;
  display:flex;justify-content:space-between;align-items:center;gap:16px;
}
.site-header nav{display:flex;gap:12px;flex-wrap:wrap}
.site-header nav a{
  padding:10px 12px;border-radius:999px;background:rgba(15,23,42,.05);font-weight:700;
}
.site-header nav a.active{background:var(--primary);color:#fff}
.site-main{padding:24px 16px 48px}
.site-canvas{
  position:relative;
  width:min(100%, ${desktopWidth}px);
  min-height:700px;
  margin:0 auto;
  background:var(--canvas);
}
.kind-webapp .site-canvas{
  border-radius:28px;
  box-shadow:0 20px 80px rgba(0,0,0,.12);
}
.site-btn{
  display:flex;align-items:center;justify-content:center;
  text-decoration:none;
}
.site-canvas img,.site-canvas video{width:100%;height:100%;display:block;object-fit:cover}
.site-canvas h1,.site-canvas div,.site-canvas form,.site-canvas a,.site-canvas img,.site-canvas video{margin:0}
.form-title{font-size:26px;font-weight:800;margin-bottom:14px}
.form-grid{display:grid;gap:10px}
.form-grid input,.form-grid textarea,.form-grid button{
  width:100%;font:inherit;border-radius:12px;border:1px solid rgba(15,23,42,.1);padding:12px 14px;
}
.form-grid textarea{min-height:120px;resize:vertical}
.form-grid button{background:var(--primary);color:white;border:none;font-weight:800}
@media (max-width:980px){
  .site-canvas{width:min(100%, 780px);min-height:760px}
}
@media (max-width:700px){
  .site-header-inner{padding:14px 14px}
  .site-main{padding:16px 10px 32px}
  .site-canvas{width:min(100%, 390px);min-height:820px}
}
`;
}

function buildExportJs(site) {
  return `
${site.kind === 'webapp' ? `
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('/service-worker.js').catch(() => {}));
}
` : ''}

let deferredPrompt;
window.addEventListener('beforeinstallprompt', (event) => {
  event.preventDefault();
  deferredPrompt = event;
  document.querySelectorAll('[href="#install"]').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.preventDefault();
      if (!deferredPrompt) return;
      deferredPrompt.prompt();
      deferredPrompt = null;
    });
  });
});
`;
}

function buildManifest(site) {
  return JSON.stringify({
    name: site.name,
    short_name: site.name.slice(0, 12),
    start_url: '/index.html',
    display: 'standalone',
    background_color: site.theme?.canvas || '#ffffff',
    theme_color: site.theme?.primary || '#445bff',
    icons: []
  }, null, 2);
}

function buildServiceWorker() {
  return `
const CACHE = 'site-studio-export-v1';
const ASSETS = ['/', '/index.html', '/site.css', '/site.js', '/manifest.webmanifest'];
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', event => {
  event.waitUntil(self.clients.claim());
});
self.addEventListener('fetch', event => {
  event.respondWith(caches.match(event.request).then(response => response || fetch(event.request)));
});
`;
}

async function exportCurrentSiteZip() {
  const site = currentSite();
  if (!site || !window.JSZip) return;
  const zip = new window.JSZip();
  const assetPathMap = {};
  const assetsFolder = zip.folder('assets');

  (site.assets || []).forEach(asset => {
    const path = `assets/${asset.fileName || sanitizeFileName(asset.name || 'asset.bin')}`;
    assetPathMap[asset.id] = path;
    if (asset.dataUrl) assetsFolder.file(path.replace('assets/', ''), dataUrlToBytes(asset.dataUrl), { binary: true });
  });

  site.pages.forEach(page => {
    zip.file(pageFileName(page), buildPageHtml(site, page, assetPathMap));
  });

  zip.file('site.css', buildExportCss(site));
  zip.file('site.js', buildExportJs(site));
  zip.file('README-export.txt', `Exported from ZachEdwardsLLC Manual Webbuilder
Project: ${site.name}
Type: ${site.kind}
Deploy by dragging this folder or zip into Netlify.`);
  zip.file('netlify.toml', `[[redirects]]
from = "/*"
to = "/index.html"
status = 200
`);
  if (site.kind === 'webapp') {
    zip.file('manifest.webmanifest', buildManifest(site));
    zip.file('service-worker.js', buildServiceWorker());
  }
  const blob = await zip.generateAsync({ type: 'blob' });
  downloadBlob(blob, `${slugify(site.name || 'site-studio-export')}.zip`);
  markDirty(false);
  setSaveMessage('ZIP exported. You can drag it straight into Netlify Deploys.');
}

async function handleExportFlow() {
  const site = currentSite();
  if (!site) return;
  normalizeSite(site);
  const meta = ensureSiteMeta(site);
  if (!meta.checkout?.paid) {
    openFinalizeExportModal(false);
    return;
  }
  await exportCurrentSiteZip();
}

function downloadBlob(blob, fileName) {
  const href = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = href;
  link.download = fileName;
  link.click();
  setTimeout(() => URL.revokeObjectURL(href), 1000);
}

function wireIdentity() {
  if (!window.netlifyIdentity) return;
  window.netlifyIdentity.init();
  state.user = window.netlifyIdentity.currentUser() || null;
  if (state.user) {
    pullRemoteSites();
  }
  window.netlifyIdentity.on('login', (user) => {
    state.user = user;
    closeModal();
    renderStatus();
    pullRemoteSites().then(renderAll);
  });
  window.netlifyIdentity.on('logout', () => {
    state.user = null;
    state.backendHealthy = false;
    renderStatus();
  });
}

function wireEvents() {
  refs.siteSelect.addEventListener('change', () => setCurrentSite(refs.siteSelect.value));
  refs.newSiteBtn.addEventListener('click', () => openNewSiteModal());
  refs.emptyCreateBtn.addEventListener('click', () => openNewSiteModal());
  refs.duplicateSiteBtn.addEventListener('click', duplicateCurrentSite);
  refs.addPageBtn.addEventListener('click', addPage);
  refs.duplicatePageBtn.addEventListener('click', duplicateCurrentPage);
  refs.deletePageBtn.addEventListener('click', deleteCurrentPage);
  refs.homePageBtn.addEventListener('click', setHomePage);
  refs.saveBtn.addEventListener('click', handleSave);
  refs.exportBtn.addEventListener('click', handleExportFlow);
  refs.previewBtn.addEventListener('click', () => {
    state.preview = !state.preview;
    renderCanvas();
    renderStatus();
  });
  refs.focusCanvasBtn?.addEventListener('click', () => {
    state.focusCanvas = !state.focusCanvas;
    document.body.classList.toggle('focus-canvas', state.focusCanvas);
    renderStatus();
  });
  refs.loginBtn.addEventListener('click', () => window.netlifyIdentity?.open('login'));
  refs.logoutBtn.addEventListener('click', () => window.netlifyIdentity?.logout());
  refs.assetUpload.addEventListener('change', handleAssetUpload);

  document.querySelectorAll('.device-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      state.device = btn.dataset.device;
      renderCanvas();
      renderElementInspector();
      renderStatus();
    });
  });

  document.querySelectorAll('[data-add]').forEach(btn => {
    btn.addEventListener('click', () => {
      setBuilderTab('blocks');
      addElement(btn.dataset.add);
      setInspectorTab('block');
    });
  });

  document.querySelectorAll('[data-panel-tab]').forEach(btn => {
    btn.addEventListener('click', () => setBuilderTab(btn.dataset.panelTab));
  });
  document.querySelectorAll('[data-inspector-tab]').forEach(btn => {
    btn.addEventListener('click', () => setInspectorTab(btn.dataset.inspectorTab));
  });

  window.addEventListener('keydown', (event) => {
    if (event.key === 'Delete' && state.selectedElementId) {
      const tag = document.activeElement?.tagName;
      if (!['INPUT', 'TEXTAREA', 'SELECT'].includes(tag)) deleteSelectedElement();
    }
  });

  window.addEventListener('beforeunload', (event) => {
    if (state.dirty) {
      event.preventDefault();
      event.returnValue = '';
    }
  });
}

function init() {
  loadLocal();
  sortSites();
  state.currentSiteId = state.sites[0]?.id || null;
  state.currentPageId = state.sites[0]?.pages[0]?.id || null;
  wireEvents();
  setBuilderTab('templates');
  setInspectorTab('site');
  wireIdentity();
  renderAll();
  verifyCheckoutFromUrl();
  if (!state.sites.length) {
    setTimeout(() => openNewSiteModal('minimal-business'), 120);
  }
}

init();
