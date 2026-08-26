/* ============================================================================
   storage.js
   ----------------------------------------------------------------------------
   LocalStorage data layer + shared utilities for the whole site.

   All editable content (profile, skills, projects, posts, messages, settings)
   lives in the browser's LocalStorage, so the Admin Dashboard and the public
   website stay in sync automatically — no backend required.

   LocalStorage keys:
     profile    -> { name, title, intro, about, image, education[], goals[], interests[] }
     skills     -> [{ id, name, level, icon }]
     projects   -> [{ id, title, description, image, technologies[], github, demo }]
     posts      -> [{ id, title, category, content, image, published, date }]
     messages   -> [{ id, name, email, subject, message, date, read }]
     settings   -> { siteName, siteDescription, theme, accent, socials{} }
   SessionStorage key:
     adminLoggedIn -> 'true' while the admin is logged in (demo auth)
   ============================================================================ */

const DB = {
  PROFILE: 'profile',
  SKILLS: 'skills',
  PROJECTS: 'projects',
  POSTS: 'posts',
  MESSAGES: 'messages',
  SETTINGS: 'settings'
};

const SEED_KEY = 'pf_seeded_v3';  // bumped so the rename applies to existing browsers
const ADMIN_KEY = 'adminLoggedIn';

/* ----------------------------- CRUD helpers ----------------------------- */

function saveData(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
  return value;
}

function getData(key, fallback = null) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (err) {
    console.error('[storage] Failed to parse key "' + key + '":', err);
    return fallback;
  }
}

function updateData(key, updater) {
  const current = getData(key);
  const next = updater(current);
  saveData(key, next);
  return next;
}

function deleteData(key) {
  localStorage.removeItem(key);
}

/* ----------------------------- Small utils ------------------------------ */

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function escapeHTML(str) {
  return String(str ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
}

function nl2br(str) {
  return escapeHTML(str).replace(/\n/g, '<br>');
}

function formatDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function timeAgo(iso) {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  const diff = Date.now() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return mins + 'm ago';
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return hrs + 'h ago';
  const days = Math.floor(hrs / 24);
  if (days < 30) return days + 'd ago';
  return formatDate(iso);
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidUrl(url) {
  if (!url) return true;                 // optional
  if (url === '#') return true;
  try {
    const u = new URL(url);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch (e) {
    return false;
  }
}

/* ------------------------------ Theme ----------------------------------- */

function applyTheme() {
  const s = getData(DB.SETTINGS, {});
  const theme = s.theme === 'light' ? 'light' : 'dark';
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.setProperty('--accent', s.accent || '#6366f1');
  const toggle = document.getElementById('theme-toggle');
  if (toggle) toggle.innerHTML = icon(theme === 'dark' ? 'sun' : 'moon');
}

function toggleTheme() {
  const s = getData(DB.SETTINGS, {}) || {};
  s.theme = (s.theme === 'light') ? 'dark' : 'light';
  saveData(DB.SETTINGS, s);
  applyTheme();
}

/* ------------------------------ Toasts ---------------------------------- */

function showToast(message, type = 'success') {
  let wrap = document.getElementById('toast-wrap');
  if (!wrap) {
    wrap = document.createElement('div');
    wrap.id = 'toast-wrap';
    wrap.className = 'toast-wrap';
    document.body.appendChild(wrap);
  }
  const t = document.createElement('div');
  t.className = 'toast toast-' + type;
  const iconName = type === 'success' ? 'check' : type === 'error' ? 'x' : 'info';
  t.innerHTML = '<span class="toast-icon">' + icon(iconName) + '</span><span>' + escapeHTML(message) + '</span>';
  wrap.appendChild(t);
  requestAnimationFrame(() => t.classList.add('show'));
  setTimeout(() => {
    t.classList.remove('show');
    setTimeout(() => t.remove(), 300);
  }, 3200);
}

/* --------------------------- Confirm dialog ----------------------------- */

function confirmDialog(opts = {}) {
  const {
    title = 'Are you sure?',
    message = 'This action cannot be undone.',
    confirmText = 'Delete',
    cancelText = 'Cancel',
    danger = true
  } = opts;

  return new Promise((resolve) => {
    let wrap = document.getElementById('confirm-wrap');
    if (!wrap) {
      wrap = document.createElement('div');
      wrap.id = 'confirm-wrap';
      document.body.appendChild(wrap);
    }
    wrap.innerHTML =
      '<div class="modal-backdrop confirm-backdrop">' +
        '<div class="modal confirm-modal" role="dialog" aria-modal="true">' +
          '<h3 class="confirm-title">' + escapeHTML(title) + '</h3>' +
          '<p class="confirm-message">' + escapeHTML(message) + '</p>' +
          '<div class="confirm-actions">' +
            '<button class="btn btn-ghost" data-cancel>' + escapeHTML(cancelText) + '</button>' +
            '<button class="btn ' + (danger ? 'btn-danger' : 'btn-primary') + '" data-ok>' + escapeHTML(confirmText) + '</button>' +
          '</div>' +
        '</div>' +
      '</div>';
    wrap.classList.add('open');

    const close = (result) => {
      wrap.classList.remove('open');
      setTimeout(() => { wrap.innerHTML = ''; }, 250);
      resolve(result);
    };
    wrap.querySelector('[data-cancel]').addEventListener('click', () => close(false));
    wrap.querySelector('[data-ok]').addEventListener('click', () => close(true));
    wrap.querySelector('.confirm-backdrop').addEventListener('click', (e) => {
      if (e.target === e.currentTarget) close(false);
    });
    document.addEventListener('keydown', function esc(e) {
      if (e.key === 'Escape') { document.removeEventListener('keydown', esc); close(false); }
    });
  });
}

/* --------------------------- Image file input --------------------------- */

/**
 * Reads an <input type="file"> as a data-URL and calls onSuccess(dataUrl, meta).
 *
 * Images are AUTO-COMPRESSED before storing so LocalStorage (≈5 MB total)
 * can hold many images:
 *   - resized to at most `maxDim` px on the longest side,
 *   - re-encoded as WebP (transparency kept), falling back to JPEG,
 *   - quality ~0.82, and the original is kept when it is already smaller.
 *
 * meta = { originalSize, finalSize, compressed } (bytes).
 */
function readImageFile(input, onSuccess, onError, opts = {}) {
  const maxDim = opts.maxDim || 1280;
  const quality = (opts.quality === undefined) ? 0.82 : opts.quality;

  const file = input.files && input.files[0];
  if (!file) { if (onError) onError('No file selected.'); return; }
  if (!file.type.startsWith('image/')) {
    if (onError) onError('Please choose an image file (PNG, JPG, WebP, GIF or SVG).');
    input.value = '';
    return;
  }
  if (file.size > 15 * 1024 * 1024) {
    if (onError) onError('Source image is too large (max 15 MB).');
    input.value = '';
    return;
  }

  const reader = new FileReader();
  reader.onload = () => {
    const original = reader.result;
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
      // Small images are kept as-is (no point re-encoding them)
      if (scale >= 1 && file.size <= 200 * 1024) {
        onSuccess(original, { originalSize: file.size, finalSize: file.size, compressed: false });
        return;
      }
      const w = Math.max(1, Math.round(img.width * scale));
      const h = Math.max(1, Math.round(img.height * scale));
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, w, h);

      let out = null;
      try {
        const webp = canvas.toDataURL('image/webp', quality);
        if (webp.startsWith('data:image/webp')) out = webp; // keeps transparency
      } catch (e) { /* webp unsupported */ }
      if (!out) {
        // JPEG fallback — flatten onto white first
        ctx.globalCompositeOperation = 'destination-over';
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, w, h);
        out = canvas.toDataURL('image/jpeg', quality);
      }

      const finalSize = Math.round(out.length * 3 / 4); // base64 → bytes
      // Keep the original when compression did not help
      if (finalSize >= file.size) {
        onSuccess(original, { originalSize: file.size, finalSize: file.size, compressed: false });
        return;
      }
      onSuccess(out, { originalSize: file.size, finalSize, compressed: true });
    };
    img.onerror = () => { if (onError) onError('Could not read the image.'); };
    img.src = original;
  };
  reader.onerror = () => { if (onError) onError('Could not read the file.'); };
  reader.readAsDataURL(file);
}

function formatBytes(bytes) {
  if (bytes >= 1024 * 1024) return (bytes / 1048576).toFixed(1) + ' MB';
  if (bytes >= 1024) return Math.round(bytes / 1024) + ' KB';
  return bytes + ' B';
}

/** Toast text after an upload: shows the storage saving when compressed. */
function imageSavedMessage(meta, savedVerb = 'loaded') {
  if (!meta || !meta.compressed) return 'Image ' + savedVerb + ' — click Save to apply it.';
  return 'Image optimized: ' + formatBytes(meta.originalSize) + ' → ' + formatBytes(meta.finalSize);
}

/* ------------------------------ Seed data ------------------------------- */

function defaultData() {
  return {
    [DB.PROFILE]: {
      name: 'Sovanna CHHEM',
      title: 'Full-Stack Web Developer',
      intro: 'I design and build modern, fast and accessible web experiences — from clean interfaces to robust logic behind them.',
      about: 'Hi, I\'m Sovanna — a developer who loves turning ideas into polished products. I started coding as a hobby and never stopped. Over the years I\'ve worked on everything from small landing pages to full web applications, always caring about performance, usability and maintainable code.\n\nWhen I\'m not coding, I\'m usually learning something new, contributing to open source, or exploring UI/UX design.',
      image: 'images/profile.svg',
      education: [
        { degree: 'B.Sc. in Computer Science', school: 'State University', year: '2019 – 2023' },
        { degree: 'Full-Stack Web Development Bootcamp', school: 'Online Academy', year: '2023' }
      ],
      goals: [
        'Build products people love to use',
        'Contribute to open-source projects',
        'Master cloud architecture',
        'Mentor junior developers'
      ],
      interests: ['Web Development', 'UI/UX Design', 'Open Source', 'Photography', 'Gaming']
    },
    [DB.SKILLS]: [
      { id: uid(), name: 'HTML', level: 90, icon: 'html' },
      { id: uid(), name: 'CSS', level: 85, icon: 'css' },
      { id: uid(), name: 'JavaScript', level: 75, icon: 'js' },
      { id: uid(), name: 'Python', level: 70, icon: 'python' },
      { id: uid(), name: 'Git & GitHub', level: 80, icon: 'git' },
      { id: uid(), name: 'UI/UX Design', level: 65, icon: 'layout' }
    ],
    [DB.PROJECTS]: [
      {
        id: uid(),
        title: 'AnimeVerse',
        description: 'A fan-made anime discovery platform with search, categories and a watchlist — built as a fully client-side app.',
        image: 'images/projects/project1.svg',
        technologies: ['HTML', 'CSS', 'JavaScript'],
        github: '#',
        demo: '#'
      },
      {
        id: uid(),
        title: 'TaskFlow',
        description: 'A kanban-style task manager with drag & drop, local persistence and a clean, distraction-free interface.',
        image: 'images/projects/project2.svg',
        technologies: ['JavaScript', 'CSS'],
        github: '#',
        demo: '#'
      },
      {
        id: uid(),
        title: 'Weatherly',
        description: 'A minimal weather app that shows forecasts for any city with a beautiful gradient UI and animated states.',
        image: 'images/projects/project3.svg',
        technologies: ['HTML', 'CSS', 'JavaScript', 'API'],
        github: '#',
        demo: '#'
      },
      {
        id: uid(),
        title: 'DevBlog',
        description: 'A fast, markdown-friendly blog engine for developers, with syntax highlighting and a reading-time widget.',
        image: 'images/projects/project4.svg',
        technologies: ['JavaScript', 'Markdown', 'CSS'],
        github: '#',
        demo: '#'
      }
    ],
    [DB.POSTS]: [
      {
        id: uid(),
        title: 'My Web Development Journey',
        category: 'Development',
        content: 'It started with a single HTML page and a lot of curiosity. From "Hello World" to shipping full projects, here is how my journey went — the tools I learned, the mistakes I made, and the habits that stuck.\n\nThe most important lesson: build things. Tutorials help, but real progress happens when you ship. Every project teaches you something no course can.',
        image: 'images/blog/blog1.svg',
        published: true,
        date: '2026-08-20'
      },
      {
        id: uid(),
        title: 'Designing for Readability',
        category: 'Design',
        content: 'Good typography is invisible — it simply lets the reader focus on the content. In this post I break down line height, measure, contrast and spacing, and why they matter more than any fancy effect.\n\nRule of thumb: if you spend an hour picking a font, spend two on spacing.',
        image: 'images/blog/blog2.svg',
        published: true,
        date: '2026-08-12'
      },
      {
        id: uid(),
        title: 'Vanilla JS vs Frameworks',
        category: 'Development',
        content: 'Do you really need a framework for that landing page? Sometimes a few lines of vanilla JavaScript are all you need. A practical look at when to reach for tools and when to keep it simple.\n\n(Draft — this one is still being written.)',
        image: 'images/blog/blog3.svg',
        published: false,
        date: '2026-08-05'
      }
    ],
    [DB.MESSAGES]: [
      {
        id: uid(),
        name: 'Sarah Mitchell',
        email: 'sarah@example.com',
        subject: 'Freelance project inquiry',
        message: 'Hi Sovanna, I saw your portfolio and I\'d love to talk about a project. Are you available for a short call this week?',
        date: new Date(Date.now() - 86400000 * 2).toISOString(),
        read: false
      },
      {
        id: uid(),
        name: 'James Lee',
        email: 'james@example.com',
        subject: 'Thanks for the tutorial',
        message: 'Your blog post on readability was super helpful. Keep up the great work!',
        date: new Date(Date.now() - 86400000 * 5).toISOString(),
        read: true
      }
    ],
    [DB.SETTINGS]: {
      siteName: 'Sovanna CHHEM',
      siteDescription: 'Personal portfolio of Sovanna CHHEM — Full-Stack Web Developer. Projects, blog and contact.',
      theme: 'dark',
      accent: '#22d3ee',
      logo: '',
      socials: {
        github: 'https://github.com/',
        linkedin: 'https://linkedin.com/',
        twitter: 'https://twitter.com/',
        email: 'hello@sovanna.dev'
      }
    }
  };
}

function seedData() {
  if (localStorage.getItem(SEED_KEY)) return false;
  const data = defaultData();
  Object.entries(data).forEach(([key, value]) => {
    if (!localStorage.getItem(key)) saveData(key, value);
  });
  localStorage.setItem(SEED_KEY, 'true');
  return true;
}

/** Wipes everything and restores the demo content. */
function resetData() {
  Object.keys(DB).forEach((k) => localStorage.removeItem(DB[k]));
  localStorage.removeItem(SEED_KEY);
  seedData();
  applyTheme();
}

/* ---------------------------- Init on load ------------------------------ */

(function init() {
  seedData();
})();
