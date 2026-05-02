
const uid = (prefix = "id") => `${prefix}_${Math.random().toString(36).slice(2, 10)}`;

function layout(x, y, w, h) {
  return {
    desktop: { x, y, w, h },
    tablet: { x: Math.max(20, Math.round(x * 0.66)), y, w: Math.max(180, Math.round(w * 0.7)), h },
    mobile: { x: 20, y, w: Math.min(350, Math.max(180, Math.round(w * 0.78))), h }
  };
}

function element(type, config = {}) {
  const base = {
    id: uid('el'),
    type,
    name: config.name || type,
    layouts: config.layouts || layout(config.x ?? 40, config.y ?? 120, config.w ?? 320, config.h ?? 120),
    visibleOn: config.visibleOn || { desktop: true, tablet: true, mobile: true },
    styles: {
      color: config.color || '#111827',
      background: config.background || 'transparent',
      fontFamily: config.fontFamily || 'inherit',
      fontSize: config.fontSize || 18,
      fontWeight: config.fontWeight || 600,
      borderRadius: config.borderRadius || 18,
      borderWidth: config.borderWidth || 0,
      borderColor: config.borderColor || '#dbe2ef',
      padding: config.padding || 16,
      boxShadow: config.boxShadow || 'none',
      textAlign: config.textAlign || 'left',
      letterSpacing: config.letterSpacing || 0,
      lineHeight: config.lineHeight || 1.3,
      opacity: config.opacity ?? 1
    },
    content: config.content || {},
  };
  return base;
}

function page(name, slug, elements = []) {
  return { id: uid('page'), name, slug, isHome: slug === 'index', elements };
}

export const TEMPLATE_PRESETS = [
  {
    id: 'minimal-business',
    name: 'Minimal Business',
    kind: 'website',
    deviceTarget: 'responsive',
    description: 'Clean company site with a modern landing page.',
    site: {
      name: 'Northline Studio',
      theme: {
        primary: '#445bff',
        secondary: '#f8fafc',
        accent: '#111827',
        surface: '#ffffff',
        canvas: '#f8fafc',
        text: '#0f172a',
        headingFont: 'Manrope',
        bodyFont: 'Inter'
      },
      pages: [
        page('Home', 'index', [
          element('heading', { x: 72, y: 120, w: 620, h: 90, fontSize: 58, fontWeight: 800, content: { text: 'Build a cleaner brand presence.' }, color: '#0f172a' }),
          element('text', { x: 76, y: 220, w: 520, h: 80, fontSize: 20, fontWeight: 500, content: { text: 'Use Site Studio to create a premium site, save it to Neon, and export a live Netlify deploy in one click.' }, color: '#334155' }),
          element('button', { x: 78, y: 330, w: 180, h: 54, content: { text: 'Start a project', href: '#contact' }, background: '#445bff', color: '#ffffff', borderRadius: 16, padding: 14, boxShadow: '0 20px 50px rgba(68,91,255,.24)' }),
          element('box', { x: 760, y: 110, w: 340, h: 360, background: 'linear-gradient(135deg,#445bff,#9ec5ff)', borderRadius: 34, boxShadow: '0 26px 80px rgba(68,91,255,.22)' }),
          element('text', { x: 800, y: 168, w: 260, h: 160, fontSize: 28, fontWeight: 700, content: { text: 'Desktop, tablet, and phone layouts inside one builder.' }, color: '#ffffff' }),
          element('box', { x: 70, y: 480, w: 1030, h: 240, background: '#ffffff', borderRadius: 28, borderWidth: 1, borderColor: '#e2e8f0' }),
          element('heading', { x: 110, y: 530, w: 360, h: 60, fontSize: 34, fontWeight: 800, content: { text: 'Why teams use it' }, color: '#0f172a' }),
          element('text', { x: 112, y: 594, w: 880, h: 72, fontSize: 18, fontWeight: 500, content: { text: 'Visual editor, Netlify deploy, Neon persistence, responsive mode switching, template presets, and instant ZIP export.' }, color: '#475569' })
        ]),
        page('Contact', 'contact', [
          element('heading', { x: 72, y: 120, w: 520, h: 80, fontSize: 52, fontWeight: 800, content: { text: 'Let’s build something sharp.' }, color: '#0f172a' }),
          element('form', { x: 72, y: 238, w: 520, h: 320, background: '#ffffff', borderRadius: 26, borderWidth: 1, borderColor: '#e2e8f0', padding: 20 }),
          element('text', { x: 640, y: 250, w: 360, h: 120, fontSize: 22, fontWeight: 600, content: { text: 'This starter includes a form block. You can wire it to Netlify Forms or your own function later.' }, color: '#334155' })
        ])
      ]
    }
  },
  {
    id: 'agency-dark',
    name: 'Dark Agency',
    kind: 'website',
    deviceTarget: 'responsive',
    description: 'High-contrast agency landing page.',
    site: {
      name: 'Obsidian Agency',
      theme: {
        primary: '#79ffd4',
        secondary: '#101828',
        accent: '#ffffff',
        surface: '#0b0f17',
        canvas: '#0b0f17',
        text: '#eff6ff',
        headingFont: 'Space Grotesk',
        bodyFont: 'DM Sans'
      },
      pages: [
        page('Home', 'index', [
          element('heading', { x: 72, y: 128, w: 720, h: 100, fontSize: 60, fontWeight: 800, content: { text: 'Performance design for modern operators.' }, color: '#f8fafc' }),
          element('text', { x: 74, y: 238, w: 500, h: 80, fontSize: 19, fontWeight: 500, content: { text: 'A premium dark starter with bold headings, large CTA zones, and flexible content blocks.' }, color: '#cbd5e1' }),
          element('button', { x: 74, y: 338, w: 190, h: 58, content: { text: 'Book a build', href: '#book' }, background: '#79ffd4', color: '#0b0f17', borderRadius: 18, fontWeight: 800 }),
          element('box', { x: 734, y: 112, w: 360, h: 320, background: 'linear-gradient(135deg,#0f172a,#16213d 55%,#79ffd4)', borderRadius: 34 }),
          element('box', { x: 72, y: 480, w: 1024, h: 240, background: '#101828', borderRadius: 30, borderWidth: 1, borderColor: '#1f2937' }),
          element('text', { x: 112, y: 540, w: 840, h: 84, fontSize: 24, fontWeight: 600, content: { text: 'Mix website pages and app-style screens in the same project. Export a working Netlify package when you’re ready.' }, color: '#e2e8f0' })
        ])
      ]
    }
  },
  {
    id: 'portfolio-editorial',
    name: 'Editorial Portfolio',
    kind: 'website',
    deviceTarget: 'responsive',
    description: 'Great for creators and personal brands.',
    site: {
      name: 'Marlow Portfolio',
      theme: {
        primary: '#d97706',
        secondary: '#faf7f2',
        accent: '#1f2937',
        surface: '#ffffff',
        canvas: '#f7f4ee',
        text: '#111827',
        headingFont: 'Playfair Display',
        bodyFont: 'Inter'
      },
      pages: [
        page('Home', 'index', [
          element('heading', { x: 90, y: 100, w: 580, h: 110, fontSize: 64, fontWeight: 700, content: { text: 'Editorial polish, simple structure.' }, color: '#111827', fontFamily: 'Playfair Display' }),
          element('text', { x: 94, y: 226, w: 430, h: 92, fontSize: 20, fontWeight: 500, content: { text: 'Use this style to launch a personal site, showcase projects, or build a visual story with generous whitespace.' }, color: '#374151' }),
          element('box', { x: 700, y: 96, w: 340, h: 420, background: 'linear-gradient(180deg,#f59e0b,#fde68a)', borderRadius: 34 }),
          element('box', { x: 90, y: 380, w: 520, h: 260, background: '#ffffff', borderRadius: 28, borderWidth: 1, borderColor: '#e5e7eb' }),
          element('text', { x: 132, y: 432, w: 380, h: 100, fontSize: 26, fontWeight: 600, content: { text: 'Replace this panel with a gallery, featured case study, or contact module.' }, color: '#111827' })
        ])
      ]
    }
  },
  {
    id: 'app-landing',
    name: 'App Landing',
    kind: 'webapp',
    deviceTarget: 'responsive',
    description: 'Landing page plus installable PWA export.',
    site: {
      name: 'Pulse App',
      theme: {
        primary: '#6d5efc',
        secondary: '#f8fafc',
        accent: '#0f172a',
        surface: '#ffffff',
        canvas: '#f2f5ff',
        text: '#111827',
        headingFont: 'Space Grotesk',
        bodyFont: 'Inter'
      },
      pages: [
        page('Home', 'index', [
          element('heading', { x: 72, y: 120, w: 550, h: 100, fontSize: 58, fontWeight: 800, content: { text: 'Build the app site and the app shell together.' }, color: '#0f172a' }),
          element('text', { x: 74, y: 232, w: 470, h: 82, fontSize: 20, fontWeight: 500, content: { text: 'This starter exports a PWA-ready project with a manifest and service worker scaffold.' }, color: '#475569' }),
          element('button', { x: 74, y: 334, w: 170, h: 56, content: { text: 'Install app', href: '#' }, background: '#6d5efc', color: '#ffffff', borderRadius: 18 }),
          element('box', { x: 760, y: 102, w: 270, h: 540, background: '#111827', borderRadius: 42 }),
          element('box', { x: 780, y: 132, w: 230, h: 480, background: '#ffffff', borderRadius: 30 }),
          element('heading', { x: 820, y: 180, w: 150, h: 56, fontSize: 30, fontWeight: 800, content: { text: 'Pulse' }, color: '#111827', visibleOn: { desktop: true, tablet: true, mobile: false } }),
          element('text', { x: 814, y: 236, w: 160, h: 88, fontSize: 16, fontWeight: 600, content: { text: 'Track habits, focus, and personal metrics on the go.' }, color: '#475569', visibleOn: { desktop: true, tablet: true, mobile: false } })
        ]),
        page('App Screen', 'app-screen', [
          element('box', { x: 54, y: 64, w: 1110, h: 640, background: '#ffffff', borderRadius: 34, borderWidth: 1, borderColor: '#dbe2ef' }),
          element('heading', { x: 110, y: 118, w: 420, h: 70, fontSize: 40, fontWeight: 800, content: { text: 'App dashboard' }, color: '#0f172a' }),
          element('box', { x: 110, y: 228, w: 300, h: 180, background: 'linear-gradient(135deg,#6d5efc,#9f97ff)', borderRadius: 28 }),
          element('box', { x: 440, y: 228, w: 300, h: 180, background: '#f8fafc', borderRadius: 28, borderWidth: 1, borderColor: '#dbe2ef' }),
          element('box', { x: 770, y: 228, w: 300, h: 180, background: '#f8fafc', borderRadius: 28, borderWidth: 1, borderColor: '#dbe2ef' })
        ])
      ]
    }
  },
  {
    id: 'mobile-app-shell',
    name: 'Mobile App Shell',
    kind: 'webapp',
    deviceTarget: 'mobile',
    description: 'Phone-first layout with a cleaner PWA shell.',
    site: {
      name: 'Orbit Mobile',
      theme: {
        primary: '#0ea5e9',
        secondary: '#ecfeff',
        accent: '#082f49',
        surface: '#ffffff',
        canvas: '#ecfeff',
        text: '#082f49',
        headingFont: 'Manrope',
        bodyFont: 'Inter'
      },
      pages: [
        page('Home', 'index', [
          element('box', { x: 32, y: 42, w: 326, h: 680, background: '#ffffff', borderRadius: 34, borderWidth: 1, borderColor: '#bae6fd', layouts: { desktop: { x: 390, y: 46, w: 360, h: 680 }, tablet: { x: 190, y: 44, w: 360, h: 680 }, mobile: { x: 18, y: 22, w: 354, h: 710 } } }),
          element('heading', { x: 58, y: 92, w: 260, h: 66, fontSize: 34, fontWeight: 800, content: { text: 'Orbit' }, color: '#082f49', layouts: { desktop: { x: 420, y: 96, w: 260, h: 66 }, tablet: { x: 220, y: 94, w: 260, h: 66 }, mobile: { x: 42, y: 50, w: 240, h: 66 } } }),
          element('text', { x: 60, y: 146, w: 240, h: 68, fontSize: 16, fontWeight: 600, content: { text: 'Phone-first starter for app-style products, portals, and dashboards.' }, color: '#475569', layouts: { desktop: { x: 422, y: 150, w: 250, h: 68 }, tablet: { x: 222, y: 148, w: 250, h: 68 }, mobile: { x: 42, y: 110, w: 250, h: 68 } } }),
          element('button', { x: 58, y: 240, w: 240, h: 52, content: { text: 'Get started', href: '#' }, background: '#0ea5e9', color: '#ffffff', borderRadius: 16, layouts: { desktop: { x: 422, y: 250, w: 260, h: 52 }, tablet: { x: 222, y: 248, w: 260, h: 52 }, mobile: { x: 42, y: 198, w: 270, h: 52 } } }),
          element('box', { x: 58, y: 334, w: 240, h: 120, background: '#ecfeff', borderRadius: 24, borderWidth: 1, borderColor: '#bae6fd', layouts: { desktop: { x: 422, y: 346, w: 260, h: 120 }, tablet: { x: 222, y: 344, w: 260, h: 120 }, mobile: { x: 42, y: 284, w: 270, h: 120 } } }),
        ])
      ]
    }
  },
  {
    id: 'desktop-dashboard',
    name: 'Desktop Dashboard',
    kind: 'webapp',
    deviceTarget: 'desktop',
    description: 'Best for internal tools or B2B dashboards.',
    site: {
      name: 'Command Board',
      theme: {
        primary: '#10b981',
        secondary: '#ecfdf5',
        accent: '#064e3b',
        surface: '#ffffff',
        canvas: '#f0fdf4',
        text: '#064e3b',
        headingFont: 'Space Grotesk',
        bodyFont: 'Inter'
      },
      pages: [
        page('Dashboard', 'index', [
          element('box', { x: 36, y: 36, w: 240, h: 640, background: '#052e16', borderRadius: 28 }),
          element('heading', { x: 74, y: 80, w: 170, h: 50, fontSize: 30, fontWeight: 800, content: { text: 'Board' }, color: '#ecfdf5' }),
          element('box', { x: 304, y: 36, w: 840, h: 160, background: 'linear-gradient(135deg,#10b981,#34d399)', borderRadius: 28 }),
          element('heading', { x: 344, y: 84, w: 420, h: 58, fontSize: 36, fontWeight: 800, content: { text: 'Operator dashboard' }, color: '#052e16' }),
          element('box', { x: 304, y: 224, w: 250, h: 200, background: '#ffffff', borderRadius: 24, borderWidth: 1, borderColor: '#bbf7d0' }),
          element('box', { x: 584, y: 224, w: 250, h: 200, background: '#ffffff', borderRadius: 24, borderWidth: 1, borderColor: '#bbf7d0' }),
          element('box', { x: 864, y: 224, w: 280, h: 420, background: '#ffffff', borderRadius: 24, borderWidth: 1, borderColor: '#bbf7d0' }),
          element('box', { x: 304, y: 454, w: 530, h: 190, background: '#ffffff', borderRadius: 24, borderWidth: 1, borderColor: '#bbf7d0' })
        ])
      ]
    }
  }
];

export function deepClone(value) {
  return JSON.parse(JSON.stringify(value));
}

export function buildSiteFromTemplate(templateId) {
  const found = TEMPLATE_PRESETS.find(t => t.id === templateId) || TEMPLATE_PRESETS[0];
  const site = deepClone(found.site);
  site.id = uid('site');
  site.kind = found.kind;
  site.deviceTarget = found.deviceTarget;
  site.templateId = found.id;
  site.assets = [];
  site.createdAt = new Date().toISOString();
  site.updatedAt = new Date().toISOString();
  return site;
}

export function makeBlankSite({
  name = 'New Project',
  kind = 'website',
  deviceTarget = 'responsive',
  templateId = 'minimal-business'
} = {}) {
  let site;
  if (templateId === 'blank-starter') {
    site = {
      id: uid('site'),
      name,
      kind,
      deviceTarget,
      templateId,
      theme: {
        primary: '#5571ef',
        secondary: '#f8fafc',
        accent: '#0f172a',
        surface: '#ffffff',
        canvas: '#f8fafc',
        text: '#0f172a',
        headingFont: 'Manrope',
        bodyFont: 'Inter'
      },
      assets: [],
      pages: [
        page('Home', 'index', [
          element('heading', { x: 86, y: 92, w: deviceTarget === 'mobile' ? 230 : 470, h: 76, fontSize: deviceTarget === 'mobile' ? 34 : 56, fontWeight: 800, content: { text: kind === 'webapp' ? 'Build your app from scratch' : 'Build your site from scratch' }, color: '#0f172a' }),
          element('text', { x: 88, y: deviceTarget === 'mobile' ? 180 : 186, w: deviceTarget === 'mobile' ? 230 : 520, h: 72, fontSize: 18, fontWeight: 500, content: { text: 'A clean starter so you can place every block yourself.' }, color: '#475569' }),
          element('button', { x: 88, y: deviceTarget === 'mobile' ? 280 : 290, w: 180, h: 54, content: { text: 'Get started', href: '#' }, background: '#5571ef', color: '#ffffff', borderRadius: 18 }),
          element('box', { x: deviceTarget === 'mobile' ? 88 : 720, y: 92, w: deviceTarget === 'mobile' ? 220 : 320, h: deviceTarget === 'mobile' ? 200 : 280, background: '#ffffff', borderRadius: 28, borderWidth: 1, borderColor: '#dbe2ef' })
        ])
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  } else {
    site = buildSiteFromTemplate(templateId);
    site.name = name;
    site.kind = kind;
    site.deviceTarget = deviceTarget;
  }
  return site;
}
