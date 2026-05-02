const LANE_CONFIG = {
  website: {
    basic: {
      deposit_cents: 10000,
      monthly_cents: 1000,
      min_total_cents: 90000,
      max_total_cents: 180000,
      headline: 'Basic website quote',
      summary: 'Your request fits the basic website lane. The quote below is the actual project quote tied to this intake.',
    },
    custom: {
      deposit_cents: 25000,
      monthly_cents: 2500,
      min_total_cents: 250000,
      max_total_cents: 1200000,
      headline: 'Custom website quote',
      summary: 'Your request was routed into the custom website lane. The quote below is the actual project quote tied to this intake.',
    },
  },
  app: {
    basic: {
      deposit_cents: 50000,
      monthly_cents: 3500,
      min_total_cents: 350000,
      max_total_cents: 650000,
      headline: 'Basic app quote',
      summary: 'Your request fits the basic app lane. The quote below is the actual project quote tied to this intake.',
    },
    custom: {
      deposit_cents: 100000,
      monthly_cents: 7500,
      min_total_cents: 850000,
      max_total_cents: 3500000,
      headline: 'Custom app quote',
      summary: 'Your request was routed into the custom app lane. The quote below is the actual project quote tied to this intake.',
    },
  },
  software: {
    basic: {
      deposit_cents: 25000,
      monthly_cents: 0,
      min_total_cents: 200000,
      max_total_cents: 500000,
      headline: 'Basic software quote',
      summary: 'Your request fits the basic custom-software lane. The quote below is the actual project quote tied to this intake.',
    },
    custom: {
      deposit_cents: 75000,
      monthly_cents: 0,
      min_total_cents: 600000,
      max_total_cents: 2500000,
      headline: 'Custom software quote',
      summary: 'Your request was routed into the custom software lane. The quote below is the actual project quote tied to this intake.',
    },
  },
};

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function countPages(pagesNeeded = '') {
  return String(pagesNeeded)
    .split(/[\n,]/)
    .map((s) => s.trim())
    .filter(Boolean).length;
}

function normalizeClassification(kind, value) {
  if (value === 'custom') return 'custom';
  return 'basic';
}

function normalizeKind(kind) {
  if (kind === 'app') return 'app';
  if (kind === 'software') return 'software';
  return 'website';
}

function lane(kind, classification) {
  return LANE_CONFIG[normalizeKind(kind)][normalizeClassification(kind, classification)];
}

function normalizeQuote(kind, quote, payload = {}) {
  const normalizedKind = normalizeKind(kind);
  const classification = normalizeClassification(normalizedKind, quote?.classification);
  const config = lane(normalizedKind, classification);
  const total = clamp(Number(quote?.quoted_total_cents || 0) || config.min_total_cents, config.min_total_cents, config.max_total_cents);
  const projectName = payload.business_name || payload.project_name || payload.name || (normalizedKind === 'website' ? 'Website project' : normalizedKind === 'app' ? 'App project' : 'Software project');

  return {
    classification,
    kind: normalizedKind,
    quoted_total_cents: total,
    deposit_cents: config.deposit_cents,
    monthly_cents: config.monthly_cents,
    headline: String(quote?.headline || config.headline),
    summary: String(quote?.summary || config.summary),
    quote_valid_days: 7,
    project_name: projectName,
  };
}

function websiteQuote(payload) {
  const features = `${payload.features || ''} ${payload.project_summary || ''}`.toLowerCase();
  const pages = countPages(payload.pages_needed);
  let total = 95000;
  let complexity = 0;

  const hasStore = /(ecommerce|store|shop|catalog|inventory|stripe|payments|checkout)/.test(features);
  const hasAccounts = /(membership|login|accounts|user account|user accounts|portal)/.test(features);
  const hasDashboard = /(admin|dashboard|crm|portal)/.test(features);
  const hasAutomation = /(automation|ai|bot|api|integration|database|workflow|custom)/.test(features);
  const hasMarketplace = /(marketplace|directory|multi vendor|multi-vendor)/.test(features);
  const hasSimpleLeadFeatures = /(booking|scheduler|calendar|form|lead capture|contact form)/.test(features);

  if (pages >= 4) total += 15000;
  if (pages >= 5) total += 15000;
  if (hasSimpleLeadFeatures) total += 10000;
  if (hasStore) { total += 70000; complexity += 2; }
  if (hasAccounts) { total += 45000; complexity += 2; }
  if (hasDashboard) { total += 55000; complexity += 2; }
  if (hasAutomation) { total += 45000; complexity += 2; }
  if (hasMarketplace) { total += 120000; complexity += 3; }

  const isCustom = pages > 5 || hasStore || hasAccounts || hasDashboard || hasAutomation || hasMarketplace;
  const classification = isCustom ? 'custom' : 'basic';
  const rough = classification === 'custom'
    ? { classification, quoted_total_cents: 250000 + complexity * 60000 + Math.max(0, pages - 5) * 15000 }
    : { classification, quoted_total_cents: total };
  return normalizeQuote('website', rough, payload);
}

function appQuote(payload) {
  const text = JSON.stringify(payload).toLowerCase();
  let total = 350000;
  let complexity = 0;

  if (/(both|ios and android|android and ios)/.test(text)) { total += 125000; complexity += 2; }
  if (/(auth|accounts|login|signup|user profiles)/.test(text)) { total += 50000; complexity += 1; }
  if (/(payments|stripe|subscription|checkout)/.test(text)) { total += 85000; complexity += 2; }
  if (/(voice|image analysis|ai|chatbot|agent|automation)/.test(text)) { total += 125000; complexity += 2; }
  if (/(dashboard|admin|portal|multi-role|team|analytics)/.test(text)) { total += 90000; complexity += 2; }
  if (/(marketplace|social|feed|messaging|real-time|gps|maps)/.test(text)) { total += 140000; complexity += 2; }
  if (/(wearable|healthkit|bluetooth|offline sync|camera|video)/.test(text)) { total += 80000; complexity += 1; }

  const classification = complexity >= 5 || total > 650000 ? 'custom' : 'basic';
  const rough = classification === 'custom'
    ? { classification, quoted_total_cents: 850000 + complexity * 150000 }
    : { classification, quoted_total_cents: total };
  return normalizeQuote('app', rough, payload);
}

function softwareQuote(payload) {
  const text = JSON.stringify(payload).toLowerCase();
  let total = 220000;
  let complexity = 0;

  if (/(dashboard|portal|admin|analytics|reporting)/.test(text)) { total += 70000; complexity += 1; }
  if (/(login|auth|accounts|roles|permissions|multi-role)/.test(text)) { total += 60000; complexity += 1; }
  if (/(automation|workflow|pipeline|crm|operations|internal tool)/.test(text)) { total += 90000; complexity += 2; }
  if (/(ai|chatbot|agent|openai|vision|voice)/.test(text)) { total += 120000; complexity += 2; }
  if (/(stripe|payments|billing|subscription)/.test(text)) { total += 70000; complexity += 1; }
  if (/(api|integration|twilio|webhook|database|sync)/.test(text)) { total += 85000; complexity += 2; }
  if (/(team|client portal|messaging|real-time|gps|complex)/.test(text)) { total += 120000; complexity += 2; }

  const classification = complexity >= 4 || total > 500000 ? 'custom' : 'basic';
  const rough = classification === 'custom'
    ? { classification, quoted_total_cents: 600000 + complexity * 140000 }
    : { classification, quoted_total_cents: total };
  return normalizeQuote('software', rough, payload);
}

function classifyFallback(kind, payload) {
  const normalizedKind = normalizeKind(kind);
  if (normalizedKind === 'website') return websiteQuote(payload);
  if (normalizedKind === 'app') return appQuote(payload);
  return softwareQuote(payload);
}

module.exports = { clamp, countPages, websiteQuote, appQuote, softwareQuote, classifyFallback, normalizeQuote, LANE_CONFIG };
