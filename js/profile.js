/* ============================================================================
   profile.js — Admin: manage profile (name, title, bio, image, education,
   goals, interests, social links). Saves to LocalStorage `profile` (+ socials
   in `settings`), so the public site updates automatically.
   ============================================================================ */

document.addEventListener('DOMContentLoaded', () => {
  initAdminShell('profile');
  loadProfileForm();
  initProfileForm();
});

const SOCIAL_FIELDS = ['github', 'linkedin', 'twitter', 'email'];

function loadProfileForm() {
  const p = getData(DB.PROFILE, {});
  const s = getData(DB.SETTINGS, {});

  document.getElementById('pf-name').value = p.name || '';
  document.getElementById('pf-title').value = p.title || '';
  document.getElementById('pf-intro').value = p.intro || '';
  document.getElementById('pf-about').value = p.about || '';
  document.getElementById('pf-image').value = p.image || '';
  document.getElementById('pf-img-preview').src = p.image || 'images/profile.svg';
  document.getElementById('pf-goals').value = (p.goals || []).join('\n');
  document.getElementById('pf-interests').value = (p.interests || []).join('\n');

  // Education dynamic rows
  const wrap = document.getElementById('edu-rows');
  const items = p.education && p.education.length ? p.education : [{ degree: '', school: '', year: '' }];
  wrap.innerHTML = '';
  items.forEach((e) => addEduRow(e.degree || '', e.school || '', e.year || ''));

  // Socials (single source of truth: settings)
  const soc = s.socials || {};
  SOCIAL_FIELDS.forEach((f) => {
    const el = document.getElementById('pf-' + f);
    if (el) el.value = soc[f] || '';
  });
}

function addEduRow(degree = '', school = '', year = '') {
  const wrap = document.getElementById('edu-rows');
  const row = document.createElement('div');
  row.className = 'dyn-row';
  row.innerHTML =
    '<input type="text" class="edu-degree" placeholder="Degree (e.g. B.Sc. Computer Science)" value="' + escapeHTML(degree) + '">' +
    '<input type="text" class="edu-school" placeholder="School / university" value="' + escapeHTML(school) + '">' +
    '<input type="text" class="edu-year" placeholder="Year" value="' + escapeHTML(year) + '">' +
    '<button type="button" class="icon-btn-sm danger" title="Remove" aria-label="Remove row">' + icon('close') + '</button>';
  row.querySelector('button').addEventListener('click', () => {
    if (wrap.children.length <= 1) {
      showToast('At least one education row is kept.', 'info');
      return;
    }
    row.remove();
  });
  wrap.appendChild(row);
}

function collectEducation() {
  return [...document.querySelectorAll('#edu-rows .dyn-row')].map((row) => ({
    degree: row.querySelector('.edu-degree').value.trim(),
    school: row.querySelector('.edu-school').value.trim(),
    year: row.querySelector('.edu-year').value.trim()
  })).filter((e) => e.degree || e.school || e.year);
}

function linesToArray(textarea) {
  return textarea.value.split('\n').map((l) => l.trim()).filter(Boolean);
}

function initProfileForm() {
  document.getElementById('edu-add').addEventListener('click', () => addEduRow());

  // Image upload
  const fileInput = document.getElementById('pf-image-file');
  const imgInput = document.getElementById('pf-image');
  const preview = document.getElementById('pf-img-preview');

  fileInput.addEventListener('change', () => {
    readImageFile(fileInput, (dataUrl, meta) => {
      imgInput.value = dataUrl;
      preview.src = dataUrl;
      showToast(imageSavedMessage(meta), 'info');
    }, (err) => showToast(err, 'error'), { maxDim: 600 });
  });
  imgInput.addEventListener('input', () => {
    if (imgInput.value) preview.src = imgInput.value;
  });

  // Reset
  document.getElementById('profile-reset').addEventListener('click', async () => {
    const ok = await confirmDialog({
      title: 'Reset profile?',
      message: 'Your profile will be restored to the default demo content. Other data is not affected.',
      confirmText: 'Reset',
      danger: true
    });
    if (!ok) return;
    saveData(DB.PROFILE, defaultData()[DB.PROFILE]);
    loadProfileForm();
    showToast('Profile restored to defaults.');
  });

  // Submit
  document.getElementById('profile-form').addEventListener('submit', (e) => {
    e.preventDefault();

    const name = document.getElementById('pf-name').value.trim();
    const title = document.getElementById('pf-title').value.trim();
    let ok = true;

    if (!name) { setFieldInvalid('pf-name', true); ok = false; } else setFieldInvalid('pf-name', false);
    if (!title) { setFieldInvalid('pf-title', true); ok = false; } else setFieldInvalid('pf-title', false);

    // Validate social URLs
    const socials = {};
    SOCIAL_FIELDS.forEach((f) => {
      const el = document.getElementById('pf-' + f);
      const val = el.value.trim();
      if (f === 'email') {
        if (val && !isValidEmail(val)) { setFieldInvalid('pf-' + f, true); ok = false; return; }
      } else {
        if (!isValidUrl(val)) { setFieldInvalid('pf-' + f, true); ok = false; return; }
      }
      setFieldInvalid('pf-' + f, false);
      socials[f] = val;
    });

    if (!ok) { showToast('Please fix the highlighted fields.', 'error'); return; }

    const profile = {
      name,
      title,
      intro: document.getElementById('pf-intro').value.trim(),
      about: document.getElementById('pf-about').value.trim(),
      image: document.getElementById('pf-image').value.trim() || 'images/profile.svg',
      education: collectEducation(),
      goals: linesToArray(document.getElementById('pf-goals')),
      interests: linesToArray(document.getElementById('pf-interests'))
    };
    saveData(DB.PROFILE, profile);

    // Merge socials into settings (keep theme/accent)
    const settings = getData(DB.SETTINGS, {}) || {};
    settings.socials = { ...(settings.socials || {}), ...socials };
    saveData(DB.SETTINGS, settings);

    showToast('Profile updated successfully!');
  });
}

function setFieldInvalid(id, invalid) {
  const el = document.getElementById(id);
  if (!el) return;
  el.closest('.form-group').classList.toggle('invalid', invalid);
}
