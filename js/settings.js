/* ============================================================================
   settings.js — Admin: site name/description, theme, accent color, socials
   ============================================================================ */

document.addEventListener('DOMContentLoaded', () => {
  initAdminShell('settings');
  loadSettingsForm();
  bindSettingsEvents();
});

const ACCENT_PRESETS = ['#22d3ee', '#9efcff', '#ff4fd8', '#a78bfa', '#34d399', '#fbbf24'];

function loadSettingsForm() {
  const s = getData(DB.SETTINGS, {}) || {};
  document.getElementById('st-name').value = s.siteName || '';
  document.getElementById('st-desc').value = s.siteDescription || '';
  document.getElementById('st-theme-label').textContent = s.theme || 'dark';
  document.getElementById('st-accent').value = s.accent || '#22d3ee';
  document.getElementById('st-logo').value = s.logo || '';
  updateLogoPreview(s.logo);

  const soc = s.socials || {};
  document.getElementById('st-github').value = soc.github || '';
  document.getElementById('st-linkedin').value = soc.linkedin || '';
  document.getElementById('st-twitter').value = soc.twitter || '';
  document.getElementById('st-email').value = soc.email || '';

  updateSwatchState(s.accent || '#22d3ee');
}

function updateLogoPreview(src) {
  const preview = document.getElementById('st-logo-preview');
  if (!preview) return;
  if (src) { preview.src = src; preview.style.opacity = '1'; }
  else { preview.removeAttribute('src'); preview.style.opacity = '0.35'; }
}

function updateSwatchState(accent) {
  document.querySelectorAll('.swatch').forEach((sw) => {
    sw.classList.toggle('active', (sw.dataset.accent || '').toLowerCase() === accent.toLowerCase());
  });
}

function bindSettingsEvents() {
  // Theme toggle (applies instantly)
  document.getElementById('st-theme-toggle').addEventListener('click', () => {
    const s = getData(DB.SETTINGS, {}) || {};
    s.theme = (s.theme === 'light') ? 'dark' : 'light';
    saveData(DB.SETTINGS, s);
    applyTheme();
    document.getElementById('st-theme-label').textContent = s.theme;
    showToast('Theme switched to ' + s.theme + ' mode.', 'info');
  });

  // Accent swatches (apply instantly)
  document.querySelectorAll('.swatch').forEach((sw) => {
    sw.addEventListener('click', () => {
      const s = getData(DB.SETTINGS, {}) || {};
      s.accent = sw.dataset.accent;
      saveData(DB.SETTINGS, s);
      applyTheme();
      document.getElementById('st-accent').value = sw.dataset.accent;
      updateSwatchState(sw.dataset.accent);
      showToast('Accent color updated.');
    });
  });

  // Custom color picker
  document.getElementById('st-accent').addEventListener('input', (e) => {
    const s = getData(DB.SETTINGS, {}) || {};
    s.accent = e.target.value;
    saveData(DB.SETTINGS, s);
    applyTheme();
    updateSwatchState(e.target.value);
  });

  // Logo: upload / URL preview / remove
  const logoInput = document.getElementById('st-logo');
  const logoFile = document.getElementById('st-logo-file');
  logoInput.addEventListener('input', () => {
    if (logoInput.value.trim()) updateLogoPreview(logoInput.value.trim());
  });
  logoFile.addEventListener('change', () => {
    readImageFile(logoFile, (dataUrl, meta) => {
      logoInput.value = dataUrl;
      updateLogoPreview(dataUrl);
      showToast(imageSavedMessage(meta), 'info');
    }, (err) => showToast(err, 'error'), { maxDim: 600 });
  });
  document.getElementById('st-logo-remove').addEventListener('click', () => {
    logoInput.value = '';
    updateLogoPreview('');
    showToast('Logo cleared — remember to save.', 'info');
  });

  // Save form
  document.getElementById('settings-form').addEventListener('submit', (e) => {
    e.preventDefault();

    const name = document.getElementById('st-name').value.trim();
    if (!name) {
      document.getElementById('st-name').closest('.form-group').classList.add('invalid');
      showToast('Website name is required.', 'error');
      return;
    }

    const socials = {};
    let ok = true;
    ['github', 'linkedin', 'twitter'].forEach((f) => {
      const el = document.getElementById('st-' + f);
      const val = el.value.trim();
      if (!isValidUrl(val)) { el.closest('.form-group').classList.add('invalid'); ok = false; return; }
      el.closest('.form-group').classList.remove('invalid');
      socials[f] = val;
    });
    const emailEl = document.getElementById('st-email');
    const email = emailEl.value.trim();
    if (email && !isValidEmail(email)) { emailEl.closest('.form-group').classList.add('invalid'); ok = false; }
    else { emailEl.closest('.form-group').classList.remove('invalid'); socials.email = email; }

    if (!ok) { showToast('Please fix the highlighted fields.', 'error'); return; }

    const s = getData(DB.SETTINGS, {}) || {};
    s.siteName = name;
    s.siteDescription = document.getElementById('st-desc').value.trim();
    s.logo = logoInput.value.trim();
    s.socials = { ...(s.socials || {}), ...socials };
    saveData(DB.SETTINGS, s);
    applyTheme();
    showToast('Settings saved successfully!');
  });

  // Reset all data
  document.getElementById('st-reset-data').addEventListener('click', async () => {
    const ok = await confirmDialog({
      title: 'Reset ALL data?',
      message: 'All projects, skills, posts, messages, profile and settings will be wiped and replaced with the demo content. This cannot be undone.',
      confirmText: 'Reset everything',
      danger: true
    });
    if (!ok) return;
    resetData();
    loadSettingsForm();
    applyTheme();
    showToast('All data reset to defaults.');
  });
}
