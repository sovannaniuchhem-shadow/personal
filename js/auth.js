/* ============================================================================
   auth.js — Demo authentication + shared Admin Dashboard shell
   ----------------------------------------------------------------------------
   !! SECURITY NOTE (demo only):
   This is FRONTEND-ONLY authentication. Credentials and the login check live
   in the browser, so anyone can view the source and bypass the login.
   It exists purely to demonstrate the flow — DO NOT use it in production.
   A real project needs a backend with proper session management (e.g. JWT +
   httpOnly cookies, server-side rate limiting, password hashing).
   ============================================================================ */

const DEMO_ADMIN = { email: 'admin@example.com', password: 'Phantom' };

/** Redirects to the login page when the admin is not authenticated. */
function requireAuth() {
  if (sessionStorage.getItem(ADMIN_KEY) !== 'true') {
    window.location.replace('login.html');
    return false;
  }
  return true;
}

function isLoggedIn() {
  return sessionStorage.getItem(ADMIN_KEY) === 'true';
}

/** Logs the admin out and returns to the login page. */
function logout() {
  sessionStorage.removeItem(ADMIN_KEY);
  window.location.replace('login.html');
}

/* ------------------------------ Login page ------------------------------ */

function initLogin() {
  // Already logged in? Straight to the dashboard.
  if (isLoggedIn()) {
    window.location.replace('dashboard.html');
    return;
  }

  applyTheme();

  const form = document.getElementById('login-form');
  const emailInput = document.getElementById('login-email');
  const passInput = document.getElementById('login-password');
  const errBox = document.getElementById('login-err');
  const btn = document.getElementById('login-btn');

  const pwdToggle = document.getElementById('pwd-toggle');
  if (pwdToggle) {
    pwdToggle.addEventListener('click', () => {
      const show = passInput.type === 'password';
      passInput.type = show ? 'text' : 'password';
      pwdToggle.innerHTML = icon(show ? 'eye-off' : 'eye');
    });
  }

  function setError(msg) {
    errBox.textContent = msg;
    errBox.classList.add('show');
  }
  function clearError() { errBox.classList.remove('show'); }

  emailInput.addEventListener('input', () => {
    emailInput.closest('.form-group').classList.remove('invalid');
    clearError();
  });
  passInput.addEventListener('input', () => {
    passInput.closest('.form-group').classList.remove('invalid');
    clearError();
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    clearError();
    let ok = true;

    const email = emailInput.value.trim();
    const password = passInput.value;

    if (!isValidEmail(email)) { emailInput.closest('.form-group').classList.add('invalid'); ok = false; }
    if (!password) { passInput.closest('.form-group').classList.add('invalid'); ok = false; }
    if (!ok) {
      setError('Please enter a valid email and password.');
      return;
    }

    if (email === DEMO_ADMIN.email && password === DEMO_ADMIN.password) {
      btn.disabled = true;
      btn.textContent = 'Signing in…';
      sessionStorage.setItem(ADMIN_KEY, 'true');
      setTimeout(() => { window.location.replace('dashboard.html'); }, 400);
    } else {
      setError('Invalid email or password. Try the demo credentials below.');
      passInput.value = '';
    }
  });
}

/* --------------------------- Admin shell (all pages) -------------------- */

const ADMIN_NAV = [
  { link: 'dashboard', href: 'dashboard.html', icon: 'grid', label: 'Dashboard' },
  { link: 'profile', href: 'profile.html', icon: 'user', label: 'Profile' },
  { link: 'skills', href: 'skills.html', icon: 'code', label: 'Skills' },
  { link: 'projects', href: 'projects.html', icon: 'folder', label: 'Projects' },
  { link: 'blog', href: 'blog.html', icon: 'file-text', label: 'Blog' },
  { link: 'messages', href: 'messages.html', icon: 'message-square', label: 'Messages' },
  { link: 'settings', href: 'settings.html', icon: 'sliders', label: 'Settings' }
];

/** Builds the sidebar navigation with SVG icons. */
function renderSidebar(page) {
  const sidebar = document.getElementById('sidebar');
  if (!sidebar) return;

  const settings = getData(DB.SETTINGS, {});
  const profile = getData(DB.PROFILE, {});
  sidebar.innerHTML =
    '<div class="sidebar-brand"><img class="sidebar-avatar" src="' + escapeHTML(profile.image || 'images/profile.svg') + '" alt="Avatar"><span class="brand-name">' + escapeHTML(settings.siteName || 'My Portfolio') + '</span></div>' +
    '<nav class="sidebar-nav">' +
      '<span class="nav-label">Menu</span>' +
      ADMIN_NAV.map((n) =>
        '<a href="' + n.href + '" data-link="' + n.link + '"' + (n.link === page ? ' class="active"' : '') + '>' +
          '<span class="nav-ico">' + icon(n.icon) + '</span> ' + n.label +
        '</a>'
      ).join('') +
      '<a href="#" id="logout-btn" class="logout-link"><span class="nav-ico">' + icon('log-out') + '</span> Logout</a>' +
    '</nav>' +
    '<div class="sidebar-foot">v1.0 · LocalStorage demo</div>';
}

/**
 * Sets up the shared admin layout: auth guard, active sidebar link,
 * sidebar toggle (mobile), theme toggle, logout button, branding.
 */
function initAdminShell(page) {
  if (!requireAuth()) return;

  applyTheme();
  renderSidebar(page);

  // Page title
  const topTitle = document.querySelector('.topbar .page-title');
  if (topTitle) {
    const names = { dashboard: 'Dashboard', profile: 'Profile', skills: 'Skills', projects: 'Projects', blog: 'Blog', messages: 'Messages', settings: 'Settings' };
    topTitle.textContent = names[page] || 'Dashboard';
  }

  // Sidebar (mobile)
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebar-overlay');
  const toggle = document.getElementById('sidebar-toggle');
  if (toggle && sidebar && overlay) {
    const open = () => { sidebar.classList.add('open'); overlay.classList.add('show'); };
    const close = () => { sidebar.classList.remove('open'); overlay.classList.remove('show'); };
    toggle.addEventListener('click', open);
    overlay.addEventListener('click', close);
    sidebar.querySelectorAll('.sidebar-nav a').forEach((a) => a.addEventListener('click', close));
  }

  // Theme toggle
  const themeBtn = document.getElementById('theme-toggle');
  if (themeBtn) themeBtn.addEventListener('click', toggleTheme);

  // Logout
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', (e) => {
      e.preventDefault();
      confirmDialog({
        title: 'Log out?',
        message: 'You will be returned to the login page.',
        confirmText: 'Log out',
        danger: false
      }).then((ok) => { if (ok) logout(); });
    });
  }
}

/* --------------------------- Modal helpers ------------------------------ */

function openModal(id) {
  const m = document.getElementById(id);
  if (m) { m.classList.remove('hidden'); document.body.style.overflow = 'hidden'; }
}

function closeModal(id) {
  const m = document.getElementById(id);
  if (m) { m.classList.add('hidden'); document.body.style.overflow = ''; }
}

/** Closes a modal via its close buttons or clicking the backdrop. */
function initModalDismiss(id) {
  const modal = document.getElementById(id);
  if (!modal) return;
  modal.querySelectorAll('[data-close="' + id + '"]').forEach((btn) => {
    btn.addEventListener('click', () => closeModal(id));
  });
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal(id);
  });
}

/* -------------------------------- Boot ---------------------------------- */

document.addEventListener('DOMContentLoaded', () => {
  const body = document.body;
  if (body.classList.contains('login-body')) {
    initLogin();
  } else {
    const page = body.dataset.page || '';
    initAdminShell(page);
  }
});
