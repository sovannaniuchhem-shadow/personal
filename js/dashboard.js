/* ============================================================================
   dashboard.js — Admin dashboard home: stat cards + recent items
   ============================================================================ */

document.addEventListener('DOMContentLoaded', () => {
  initAdminShell('dashboard');
  initProfilePanel();
  initLogoPanel();
  renderStats();
  renderRecent();
});

/* ---------- Website logo panel (view + change site logo from dashboard) ---------- */

function initLogoPanel() {
  const preview = document.getElementById('dash-logo');
  if (!preview) return;

  const settings = getData(DB.SETTINGS, {}) || {};
  const urlInput = document.getElementById('dash-logo-url');
  const fileInput = document.getElementById('dash-logo-file');
  if (urlInput) urlInput.value = settings.logo || '';

  const setPreview = (src) => {
    if (src) { preview.src = src; preview.style.opacity = '1'; }
    else { preview.removeAttribute('src'); preview.style.opacity = '0.35'; }
  };
  setPreview(settings.logo);

  if (urlInput) {
    urlInput.addEventListener('input', () => {
      if (urlInput.value.trim()) setPreview(urlInput.value.trim());
    });
  }
  if (fileInput) {
    fileInput.addEventListener('change', () => {
      readImageFile(fileInput, (dataUrl, meta) => {
        urlInput.value = dataUrl;
        setPreview(dataUrl);
        showToast(imageSavedMessage(meta), 'info');
      }, (err) => showToast(err, 'error'), { maxDim: 600 });
    });
  }

  const saveBtn = document.getElementById('dash-logo-save');
  if (saveBtn) {
    saveBtn.addEventListener('click', () => {
      const s = getData(DB.SETTINGS, {}) || {};
      s.logo = (urlInput ? urlInput.value.trim() : '') || '';
      saveData(DB.SETTINGS, s);
      setPreview(s.logo);
      showToast(s.logo ? 'Website logo updated successfully!' : 'Logo removed.', 'info');
    });
  }

  const removeBtn = document.getElementById('dash-logo-remove');
  if (removeBtn) {
    removeBtn.addEventListener('click', () => {
      const s = getData(DB.SETTINGS, {}) || {};
      s.logo = '';
      saveData(DB.SETTINGS, s);
      if (urlInput) urlInput.value = '';
      setPreview('');
      showToast('Logo removed — default dot + name restored.', 'info');
    });
  }
}

/* ---------- Profile image panel (view + change photo from dashboard) ---------- */

function initProfilePanel() {
  const avatar = document.getElementById('dash-avatar');
  if (!avatar) return;

  const profile = getData(DB.PROFILE, {});
  const setAvatar = (src) => {
    avatar.src = src || 'images/profile.svg';
    // sidebar avatar stays in sync
    const side = document.querySelector('.sidebar-avatar');
    if (side) side.src = src || 'images/profile.svg';
  };

  // Name + title from stored profile
  const nameEl = document.getElementById('dash-name');
  const titleEl = document.getElementById('dash-title');
  if (nameEl) nameEl.textContent = profile.name || '';
  if (titleEl) titleEl.textContent = profile.title || '';

  const urlInput = document.getElementById('dash-avatar-url');
  const fileInput = document.getElementById('dash-avatar-file');
  const saveBtn = document.getElementById('dash-avatar-save');
  if (urlInput) urlInput.value = profile.image || '';

  // Live preview when typing a path/URL
  if (urlInput) {
    urlInput.addEventListener('input', () => {
      if (urlInput.value.trim()) setAvatar(urlInput.value.trim());
    });
  }

  // Upload → preview (not saved until Save is clicked)
  if (fileInput) {
    fileInput.addEventListener('change', () => {
      readImageFile(fileInput, (dataUrl, meta) => {
        urlInput.value = dataUrl;
        setAvatar(dataUrl);
        showToast(imageSavedMessage(meta), 'info');
      }, (err) => showToast(err, 'error'), { maxDim: 600 });
    });
  }

  if (saveBtn) {
    saveBtn.addEventListener('click', () => {
      const src = (urlInput ? urlInput.value.trim() : '') || 'images/profile.svg';
      const p = getData(DB.PROFILE, {});
      p.image = src;
      saveData(DB.PROFILE, p);
      setAvatar(src);
      showToast('Profile photo updated successfully!');
    });
  }
}

/* ---------- Website logo panel (view + change site logo from dashboard) ---------- */

function renderStats() {
  const stats = [
    { icon: 'folder', label: 'Projects', value: getData(DB.PROJECTS, []).length, link: 'projects.html' },
    { icon: 'code', label: 'Skills', value: getData(DB.SKILLS, []).length, link: 'skills.html' },
    { icon: 'file-text', label: 'Blog Posts', value: getData(DB.POSTS, []).length, link: 'blog.html' },
    { icon: 'message-square', label: 'Messages', value: getData(DB.MESSAGES, []).length, link: 'messages.html' }
  ];
  const grid = document.getElementById('stats-grid');
  if (!grid) return;
  grid.innerHTML = stats.map((s) =>
    '<a class="stat-card" href="' + s.link + '">' +
      '<div class="stat-ico">' + icon(s.icon) + '</div>' +
      '<div><div class="stat-num">' + s.value + '</div><div class="stat-label">' + s.label + '</div></div>' +
    '</a>'
  ).join('');
}

function recentItem(thumb, title, sub, badge) {
  const media = thumb
    ? '<img class="r-thumb" src="' + escapeHTML(thumb) + '" alt="">'
    : '<div class="r-thumb r-thumb-ico">' + icon('mail') + '</div>';
  return (
    '<div class="recent-item">' +
      media +
      '<div class="r-body"><div class="r-title">' + escapeHTML(title || '') + '</div><div class="r-sub">' + escapeHTML(sub || '') + '</div></div>' +
      (badge ? '<span class="r-badge">' + badge + '</span>' : '') +
    '</div>'
  );
}

function renderRecent() {
  // Recent projects
  const projects = getData(DB.PROJECTS, []).slice(0, 3);
  const rp = document.getElementById('recent-projects');
  if (rp) {
    rp.innerHTML = projects.length
      ? projects.map((p) => recentItem(p.image, p.title, (p.technologies || []).join(' · '))).join('')
      : '<p class="muted" style="padding:10px">No projects yet.</p>';
  }

  // Recent posts
  const posts = getData(DB.POSTS, []).filter((p) => p.published).slice(0, 3);
  const rposts = document.getElementById('recent-posts');
  if (rposts) {
    rposts.innerHTML = posts.length
      ? posts.map((p) => recentItem(p.image, p.title, formatDate(p.date), '<span class="badge badge-success">Published</span>')).join('')
      : '<p class="muted" style="padding:10px">No published posts yet.</p>';
  }

  // Recent messages
  const messages = getData(DB.MESSAGES, []).slice(0, 3);
  const rm = document.getElementById('recent-messages');
  if (rm) {
    rm.innerHTML = messages.length
      ? messages.map((m) => recentItem('', m.name, m.subject + ' · ' + timeAgo(m.date), m.read
          ? '<span class="badge badge-neutral">Read</span>'
          : '<span class="badge badge-warning">New</span>')).join('')
      : '<p class="muted" style="padding:10px">No messages yet.</p>';
  }
}
