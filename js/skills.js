/* ============================================================================
   skills.js — Admin: full CRUD for skills (name, icon, level)
   ============================================================================ */

document.addEventListener('DOMContentLoaded', () => {
  initAdminShell('skills');
  initModalDismiss('skill-modal');
  buildIconPicker();
  renderSkills();
  bindSkillEvents();
});

let skillFilter = '';
let editingSkillId = null;
let selectedSkillIcon = 'code';

function buildIconPicker() {
  const picker = document.getElementById('sk-icon-picker');
  if (!picker) return;
  picker.innerHTML = SKILL_ICONS.map((key) =>
    '<button type="button" data-icon-key="' + key + '" title="' + key + '">' + icon(key) + '</button>'
  ).join('');
  picker.querySelectorAll('button').forEach((btn) => {
    btn.addEventListener('click', () => {
      picker.querySelectorAll('button').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      selectedSkillIcon = btn.dataset.iconKey;
    });
  });
}

function renderSkills() {
  const grid = document.getElementById('skills-manage-grid');
  if (!grid) return;
  const skills = getData(DB.SKILLS, []);
  const q = skillFilter.toLowerCase();
  const list = skills.filter((s) => (s.name || '').toLowerCase().includes(q));

  const empty = document.getElementById('skills-empty');
  if (empty) empty.classList.toggle('hidden', list.length > 0);

  if (!list.length) {
    grid.innerHTML = '<div class="admin-empty" style="grid-column:1/-1"><div class="ae-icon">' + icon('code') + '</div><h3>No skills found.</h3><p>' +
      (q ? 'Try a different search.' : 'Click "Add Skill" to create your first skill.') + '</p></div>';
    return;
  }

  grid.innerHTML = list.map((s) => {
    const level = Math.max(0, Math.min(100, Number(s.level) || 0));
    return (
      '<div class="skill-manage-card">' +
        '<div class="sm-top">' +
          '<div class="sm-icon">' + icon(s.icon) + '</div>' +
          '<h3>' + escapeHTML(s.name) + '</h3>' +
          '<span class="sm-level">' + level + '%</span>' +
        '</div>' +
        '<div class="skill-bar"><div class="fill" style="width:' + level + '%"></div></div>' +
        '<div class="sm-actions">' +
          '<button class="btn btn-ghost btn-sm" data-edit="' + s.id + '">' + icon('pencil') + ' Edit</button>' +
          '<button class="btn btn-danger btn-sm" data-delete="' + s.id + '">' + icon('trash') + ' Delete</button>' +
        '</div>' +
      '</div>'
    );
  }).join('');
}

function bindSkillEvents() {
  document.getElementById('skill-search').addEventListener('input', (e) => {
    skillFilter = e.target.value;
    renderSkills();
  });

  document.getElementById('skill-add-btn').addEventListener('click', () => openSkillModal());

  document.getElementById('skills-manage-grid').addEventListener('click', (e) => {
    const editBtn = e.target.closest('[data-edit]');
    const delBtn = e.target.closest('[data-delete]');
    if (editBtn) openSkillModal(editBtn.dataset.edit);
    if (delBtn) deleteSkill(delBtn.dataset.delete);
  });

  document.getElementById('skill-form').addEventListener('submit', (e) => {
    e.preventDefault();
    saveSkill();
  });

  // Live level output
  const levelInput = document.getElementById('sk-level');
  levelInput.addEventListener('input', () => {
    document.getElementById('sk-level-out').textContent = levelInput.value + '%';
  });
}

function openSkillModal(id = null) {
  editingSkillId = id;
  document.getElementById('skill-modal-title').textContent = id ? 'Edit Skill' : 'Add Skill';
  document.getElementById('skill-form').reset();

  const levelInput = document.getElementById('sk-level');
  const picker = document.getElementById('sk-icon-picker');
  if (id) {
    const s = getData(DB.SKILLS, []).find((x) => x.id === id);
    if (!s) return;
    document.getElementById('sk-name').value = s.name || '';
    levelInput.value = s.level || 0;
    selectedSkillIcon = SKILL_ICONS.includes(s.icon) ? s.icon : 'code';
  } else {
    levelInput.value = 0;
    selectedSkillIcon = 'code';
  }
  picker.querySelectorAll('button').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.iconKey === selectedSkillIcon);
  });
  document.getElementById('sk-level-out').textContent = levelInput.value + '%';
  document.getElementById('sk-name').closest('.form-group').classList.remove('invalid');
  openModal('skill-modal');
  setTimeout(() => document.getElementById('sk-name').focus(), 50);
}

function saveSkill() {
  const name = document.getElementById('sk-name').value.trim();
  const iconKey = selectedSkillIcon;
  const level = Number(document.getElementById('sk-level').value);

  if (!name) {
    document.getElementById('sk-name').closest('.form-group').classList.add('invalid');
    showToast('Please fill in the skill name.', 'error');
    return;
  }
  if (isNaN(level) || level < 0 || level > 100) {
    showToast('Skill level must be between 0 and 100.', 'error');
    return;
  }

  const skills = getData(DB.SKILLS, []);
  if (editingSkillId) {
    const idx = skills.findIndex((x) => x.id === editingSkillId);
    if (idx !== -1) {
      skills[idx] = { ...skills[idx], name, icon: iconKey, level };
      saveData(DB.SKILLS, skills);
      showToast('Skill updated successfully!');
    }
  } else {
    skills.push({ id: uid(), name, icon: iconKey, level });
    saveData(DB.SKILLS, skills);
    showToast('Skill added successfully!');
  }
  closeModal('skill-modal');
  renderSkills();
}

async function deleteSkill(id) {
  const skill = getData(DB.SKILLS, []).find((s) => s.id === id);
  const ok = await confirmDialog({
    title: 'Delete skill?',
    message: '"' + (skill ? skill.name : '') + '" will be removed from your site.',
    confirmText: 'Delete'
  });
  if (!ok) return;
  saveData(DB.SKILLS, getData(DB.SKILLS, []).filter((s) => s.id !== id));
  renderSkills();
  showToast('Skill deleted successfully!');
}
