/* ============================================================================
   projects.js — Admin: full CRUD for projects
   ============================================================================ */

document.addEventListener('DOMContentLoaded', () => {
  initAdminShell('projects');
  initModalDismiss('project-modal');
  renderProjectsTable();
  bindProjectEvents();
});

let projectFilter = '';
let editingProjectId = null;

function renderProjectsTable() {
  const tbody = document.getElementById('projects-table-body');
  if (!tbody) return;
  const projects = getData(DB.PROJECTS, []);
  const q = projectFilter.toLowerCase();
  const list = projects.filter((p) =>
    !q || (p.title + ' ' + (p.description || '') + ' ' + (p.technologies || []).join(' ')).toLowerCase().includes(q)
  );

  const emptyWrap = document.getElementById('projects-empty');
  if (emptyWrap) {
    emptyWrap.classList.toggle('hidden', list.length > 0);
    emptyWrap.innerHTML = '<div class="admin-empty" style="margin-top:18px"><div class="ae-icon">' + icon('package') + '</div><h3>No projects found.</h3><p>' +
      (q ? 'Try a different search.' : 'Click "Add Project" to create your first project.') + '</p></div>';
  }

  if (!list.length) { tbody.innerHTML = ''; return; }

  tbody.innerHTML = list.map((p) =>
    '<tr>' +
      '<td><span class="thumb-cell"><img src="' + escapeHTML(p.image || 'images/projects/project1.svg') + '" alt=""></span></td>' +
      '<td><strong>' + escapeHTML(p.title) + '</strong><br><span class="muted" style="font-size:12.5px">' + escapeHTML((p.description || '').slice(0, 60)) + '</span></td>' +
      '<td><div class="tech-chips">' + (p.technologies || []).slice(0, 3).map((t) => '<span class="tech-chip">' + escapeHTML(t) + '</span>').join('') + '</div></td>' +
      '<td style="white-space:nowrap">' +
        (p.github && p.github !== '#' ? '<a href="' + escapeHTML(p.github) + '" target="_blank" rel="noopener" title="GitHub">' + icon('github') + '</a> ' : '') +
        (p.demo && p.demo !== '#' ? '<a href="' + escapeHTML(p.demo) + '" target="_blank" rel="noopener" title="Live demo">' + icon('external-link') + '</a>' : '—') +
      '</td>' +
      '<td><div class="actions-cell">' +
        '<button class="icon-btn-sm edit" data-edit="' + p.id + '" title="Edit">' + icon('pencil') + '</button>' +
        '<button class="icon-btn-sm danger" data-delete="' + p.id + '" title="Delete">' + icon('trash') + '</button>' +
      '</div></td>' +
    '</tr>'
  ).join('');
}

function bindProjectEvents() {
  document.getElementById('project-search').addEventListener('input', (e) => {
    projectFilter = e.target.value;
    renderProjectsTable();
  });

  document.getElementById('project-add-btn').addEventListener('click', () => openProjectModal());

  document.getElementById('projects-table-body').addEventListener('click', (e) => {
    const editBtn = e.target.closest('[data-edit]');
    const delBtn = e.target.closest('[data-delete]');
    if (editBtn) openProjectModal(editBtn.dataset.edit);
    if (delBtn) deleteProject(delBtn.dataset.delete);
  });

  document.getElementById('project-form').addEventListener('submit', (e) => {
    e.preventDefault();
    saveProject();
  });

  // Image upload
  const fileInput = document.getElementById('pr-image-file');
  const imgInput = document.getElementById('pr-image');
  const preview = document.getElementById('pr-img-preview');
  fileInput.addEventListener('change', () => {
    readImageFile(fileInput, (dataUrl, meta) => {
      imgInput.value = dataUrl;
      preview.src = dataUrl;
      showToast(imageSavedMessage(meta), 'info');
    }, (err) => showToast(err, 'error'), { maxDim: 1280 });
  });
  imgInput.addEventListener('input', () => {
    if (imgInput.value) preview.src = imgInput.value;
  });
}

function openProjectModal(id = null) {
  editingProjectId = id;
  document.getElementById('project-modal-title').textContent = id ? 'Edit Project' : 'Add Project';
  document.getElementById('project-form').reset();
  document.getElementById('pr-img-preview').src = 'images/projects/project1.svg';

  if (id) {
    const p = getData(DB.PROJECTS, []).find((x) => x.id === id);
    if (!p) return;
    document.getElementById('pr-title').value = p.title || '';
    document.getElementById('pr-desc').value = p.description || '';
    document.getElementById('pr-image').value = p.image || '';
    document.getElementById('pr-img-preview').src = p.image || 'images/projects/project1.svg';
    document.getElementById('pr-tech').value = (p.technologies || []).join(', ');
    document.getElementById('pr-github').value = p.github || '';
    document.getElementById('pr-demo').value = p.demo || '';
  }
  document.getElementById('pr-title').closest('.form-group').classList.remove('invalid');
  openModal('project-modal');
  setTimeout(() => document.getElementById('pr-title').focus(), 50);
}

function saveProject() {
  const title = document.getElementById('pr-title').value.trim();
  const description = document.getElementById('pr-desc').value.trim();
  const image = document.getElementById('pr-image').value.trim();
  const techRaw = document.getElementById('pr-tech').value.trim();
  const github = document.getElementById('pr-github').value.trim();
  const demo = document.getElementById('pr-demo').value.trim();

  let ok = true;
  if (!title) { document.getElementById('pr-title').closest('.form-group').classList.add('invalid'); ok = false; }
  if (!isValidUrl(github)) { document.getElementById('pr-github').closest('.form-group').classList.add('invalid'); ok = false; }
  if (!isValidUrl(demo)) { document.getElementById('pr-demo').closest('.form-group').classList.add('invalid'); ok = false; }
  if (!ok) { showToast('Please fix the highlighted fields.', 'error'); return; }

  const technologies = techRaw.split(',').map((t) => t.trim()).filter(Boolean);
  const data = {
    title,
    description,
    image: image || 'images/projects/project1.svg',
    technologies,
    github: github || '#',
    demo: demo || '#'
  };

  const projects = getData(DB.PROJECTS, []);
  if (editingProjectId) {
    const idx = projects.findIndex((x) => x.id === editingProjectId);
    if (idx !== -1) {
      projects[idx] = { ...projects[idx], ...data };
      saveData(DB.PROJECTS, projects);
      showToast('Project updated successfully!');
    }
  } else {
    projects.unshift({ id: uid(), ...data });
    saveData(DB.PROJECTS, projects);
    showToast('Project added successfully!');
  }
  closeModal('project-modal');
  renderProjectsTable();
}

async function deleteProject(id) {
  const project = getData(DB.PROJECTS, []).find((p) => p.id === id);
  const ok = await confirmDialog({
    title: 'Delete project?',
    message: '"' + (project ? project.title : '') + '" will be permanently removed.',
    confirmText: 'Delete'
  });
  if (!ok) return;
  saveData(DB.PROJECTS, getData(DB.PROJECTS, []).filter((p) => p.id !== id));
  renderProjectsTable();
  showToast('Project deleted successfully!');
}
