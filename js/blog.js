/* ============================================================================
   blog.js — Admin: full CRUD for blog posts (with publish/unpublish)
   ============================================================================ */

document.addEventListener('DOMContentLoaded', () => {
  initAdminShell('blog');
  initModalDismiss('post-modal');
  buildStatusChips();
  renderPostsTable();
  bindPostEvents();
});

let postFilter = '';
let postStatusFilter = 'all'; // all | published | draft

function renderPostsTable() {
  const tbody = document.getElementById('posts-table-body');
  if (!tbody) return;
  const posts = getData(DB.POSTS, []);
  const q = postFilter.toLowerCase();
  let list = posts.filter((p) =>
    !q || (p.title + ' ' + (p.category || '') + ' ' + (p.content || '')).toLowerCase().includes(q)
  );
  if (postStatusFilter === 'published') list = list.filter((p) => p.published);
  if (postStatusFilter === 'draft') list = list.filter((p) => !p.published);

  const emptyWrap = document.getElementById('posts-empty');
  if (emptyWrap) {
    emptyWrap.classList.toggle('hidden', list.length > 0);
    emptyWrap.innerHTML = '<div class="admin-empty" style="margin-top:18px"><div class="ae-icon">' + icon('file-text') + '</div><h3>No posts found.</h3><p>' +
      (q || postStatusFilter !== 'all' ? 'Try different search or filters.' : 'Click "Add Post" to create your first post.') + '</p></div>';
  }

  if (!list.length) { tbody.innerHTML = ''; return; }

  tbody.innerHTML = list.map((p) =>
    '<tr>' +
      '<td><span class="thumb-cell"><img src="' + escapeHTML(p.image || 'images/blog/blog1.svg') + '" alt=""></span></td>' +
      '<td><strong>' + escapeHTML(p.title) + '</strong></td>' +
      '<td><span class="badge badge-accent">' + escapeHTML(p.category || 'General') + '</span></td>' +
      '<td>' + escapeHTML(formatDate(p.date)) + '</td>' +
      '<td>' + (p.published
        ? '<span class="badge badge-success">● Published</span>'
        : '<span class="badge badge-neutral">○ Draft</span>') + '</td>' +
      '<td><div class="actions-cell">' +
        '<button class="icon-btn-sm" data-toggle="' + p.id + '" title="' + (p.published ? 'Unpublish' : 'Publish') + '">' + icon(p.published ? 'eye-off' : 'globe') + '</button>' +
        '<button class="icon-btn-sm edit" data-edit="' + p.id + '" title="Edit">' + icon('pencil') + '</button>' +
        '<button class="icon-btn-sm danger" data-delete="' + p.id + '" title="Delete">' + icon('trash') + '</button>' +
      '</div></td>' +
    '</tr>'
  ).join('');
}

function buildStatusChips() {
  const wrap = document.getElementById('post-filter-chips');
  if (!wrap) return;
  const counts = getData(DB.POSTS, []).reduce((acc, p) => {
    acc.all++;
    p.published ? acc.published++ : acc.draft++;
    return acc;
  }, { all: 0, published: 0, draft: 0 });

  wrap.innerHTML = [
    ['all', 'All (' + counts.all + ')'],
    ['published', 'Published (' + counts.published + ')'],
    ['draft', 'Drafts (' + counts.draft + ')']
  ].map(([val, label]) =>
    '<button class="chip' + (postStatusFilter === val ? ' active' : '') + '" data-status="' + val + '">' + label + '</button>'
  ).join('');

  wrap.querySelectorAll('.chip').forEach((chip) => {
    chip.addEventListener('click', () => {
      postStatusFilter = chip.dataset.status;
      buildStatusChips();
      renderPostsTable();
    });
  });
}

function bindPostEvents() {
  document.getElementById('post-search').addEventListener('input', (e) => {
    postFilter = e.target.value;
    renderPostsTable();
  });

  document.getElementById('post-add-btn').addEventListener('click', () => openPostModal());

  document.getElementById('posts-table-body').addEventListener('click', (e) => {
    const toggleBtn = e.target.closest('[data-toggle]');
    const editBtn = e.target.closest('[data-edit]');
    const delBtn = e.target.closest('[data-delete]');
    if (toggleBtn) togglePost(toggleBtn.dataset.toggle);
    if (editBtn) openPostModal(editBtn.dataset.edit);
    if (delBtn) deletePost(delBtn.dataset.delete);
  });

  document.getElementById('post-form').addEventListener('submit', (e) => {
    e.preventDefault();
    savePost();
  });

  // Image upload
  const fileInput = document.getElementById('po-image-file');
  const imgInput = document.getElementById('po-image');
  const preview = document.getElementById('po-img-preview');
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

function openPostModal(id = null) {
  editingPostId = id;
  document.getElementById('post-modal-title').textContent = id ? 'Edit Post' : 'Add Post';
  document.getElementById('post-form').reset();
  document.getElementById('po-img-preview').src = 'images/blog/blog1.svg';
  document.getElementById('po-published').checked = true;
  document.getElementById('po-date').value = new Date().toISOString().slice(0, 10);

  if (id) {
    const p = getData(DB.POSTS, []).find((x) => x.id === id);
    if (!p) return;
    document.getElementById('po-title').value = p.title || '';
    document.getElementById('po-category').value = p.category || '';
    document.getElementById('po-date').value = (p.date || '').slice(0, 10);
    document.getElementById('po-published').checked = !!p.published;
    document.getElementById('po-image').value = p.image || '';
    document.getElementById('po-img-preview').src = p.image || 'images/blog/blog1.svg';
    document.getElementById('po-content').value = p.content || '';
  }
  document.getElementById('po-title').closest('.form-group').classList.remove('invalid');
  document.getElementById('po-category').closest('.form-group').classList.remove('invalid');
  document.getElementById('po-content').closest('.form-group').classList.remove('invalid');
  openModal('post-modal');
  setTimeout(() => document.getElementById('po-title').focus(), 50);
}
let editingPostId = null;

function savePost() {
  const title = document.getElementById('po-title').value.trim();
  const category = document.getElementById('po-category').value.trim();
  const date = document.getElementById('po-date').value;
  const published = document.getElementById('po-published').checked;
  const image = document.getElementById('po-image').value.trim();
  const content = document.getElementById('po-content').value.trim();

  let ok = true;
  if (!title) { document.getElementById('po-title').closest('.form-group').classList.add('invalid'); ok = false; }
  if (!category) { document.getElementById('po-category').closest('.form-group').classList.add('invalid'); ok = false; }
  if (content.length < 10) { document.getElementById('po-content').closest('.form-group').classList.add('invalid'); ok = false; }
  if (!ok) { showToast('Please fill in all required fields.', 'error'); return; }

  const data = {
    title,
    category,
    date: date || new Date().toISOString().slice(0, 10),
    published,
    image: image || 'images/blog/blog1.svg',
    content
  };

  const posts = getData(DB.POSTS, []);
  if (editingPostId) {
    const idx = posts.findIndex((x) => x.id === editingPostId);
    if (idx !== -1) {
      posts[idx] = { ...posts[idx], ...data };
      saveData(DB.POSTS, posts);
      showToast('Post updated successfully!');
    }
  } else {
    posts.unshift({ id: uid(), ...data });
    saveData(DB.POSTS, posts);
    showToast('Post added successfully!');
  }
  closeModal('post-modal');
  buildStatusChips();
  renderPostsTable();
}

function togglePost(id) {
  const posts = getData(DB.POSTS, []);
  const idx = posts.findIndex((p) => p.id === id);
  if (idx === -1) return;
  posts[idx].published = !posts[idx].published;
  saveData(DB.POSTS, posts);
  showToast(posts[idx].published ? 'Post published — now visible on the site.' : 'Post unpublished.', 'info');
  buildStatusChips();
  renderPostsTable();
}

async function deletePost(id) {
  const post = getData(DB.POSTS, []).find((p) => p.id === id);
  const ok = await confirmDialog({
    title: 'Delete post?',
    message: '"' + (post ? post.title : '') + '" will be permanently removed.',
    confirmText: 'Delete'
  });
  if (!ok) return;
  saveData(DB.POSTS, getData(DB.POSTS, []).filter((p) => p.id !== id));
  buildStatusChips();
  renderPostsTable();
  showToast('Post deleted successfully!');
}
