/* ============================================================================
   messages.js — Admin: view, mark read/unread and delete contact messages
   ============================================================================ */

document.addEventListener('DOMContentLoaded', () => {
  initAdminShell('messages');
  initModalDismiss('message-modal');
  renderMessagesTable();
  bindMessageEvents();
});

let messageFilter = '';
let messageStatusFilter = ''; // '' | read | unread

function renderMessagesTable() {
  const tbody = document.getElementById('messages-table-body');
  if (!tbody) return;
  const messages = getData(DB.MESSAGES, []);
  const q = messageFilter.toLowerCase();
  let list = messages.filter((m) =>
    !q || (m.name + ' ' + (m.email || '') + ' ' + (m.subject || '') + ' ' + (m.message || '')).toLowerCase().includes(q)
  );
  if (messageStatusFilter === 'read') list = list.filter((m) => m.read);
  if (messageStatusFilter === 'unread') list = list.filter((m) => !m.read);

  const emptyWrap = document.getElementById('messages-empty');
  if (emptyWrap) {
    emptyWrap.classList.toggle('hidden', list.length > 0);
    emptyWrap.innerHTML = '<div class="admin-empty" style="margin-top:18px"><div class="ae-icon">' + icon('mail') + '</div><h3>No messages found.</h3><p>' +
      (q || messageStatusFilter ? 'Try different search or filters.' : 'Messages sent from the contact form will appear here.') + '</p></div>';
  }

  if (!list.length) { tbody.innerHTML = ''; return; }

  tbody.innerHTML = list.map((m) =>
    '<tr' + (m.read ? '' : ' style="background:var(--accent-soft)"') + '>' +
      '<td><strong>' + escapeHTML(m.name) + '</strong></td>' +
      '<td><a href="mailto:' + escapeHTML(m.email) + '">' + escapeHTML(m.email) + '</a></td>' +
      '<td>' + escapeHTML(m.subject || '—') + '</td>' +
      '<td>' + escapeHTML(timeAgo(m.date)) + '</td>' +
      '<td>' + (m.read
        ? '<span class="badge badge-neutral">Read</span>'
        : '<span class="badge badge-warning">Unread</span>') + '</td>' +
      '<td><div class="actions-cell">' +
        '<button class="icon-btn-sm" data-view="' + m.id + '" title="View">' + icon('eye') + '</button>' +
        '<button class="icon-btn-sm read" data-toggle="' + m.id + '" title="' + (m.read ? 'Mark as unread' : 'Mark as read') + '">' + icon(m.read ? 'mail' : 'check') + '</button>' +
        '<button class="icon-btn-sm danger" data-delete="' + m.id + '" title="Delete">' + icon('trash') + '</button>' +
      '</div></td>' +
    '</tr>'
  ).join('');
}

function bindMessageEvents() {
  document.getElementById('message-search').addEventListener('input', (e) => {
    messageFilter = e.target.value;
    renderMessagesTable();
  });

  document.querySelectorAll('#message-status-chips .chip').forEach((chip) => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('#message-status-chips .chip').forEach((c) => c.classList.remove('active'));
      chip.classList.add('active');
      messageStatusFilter = chip.dataset.status || '';
      renderMessagesTable();
    });
  });

  document.getElementById('messages-table-body').addEventListener('click', (e) => {
    const viewBtn = e.target.closest('[data-view]');
    const toggleBtn = e.target.closest('[data-toggle]');
    const delBtn = e.target.closest('[data-delete]');
    if (viewBtn) viewMessage(viewBtn.dataset.view);
    if (toggleBtn) toggleMessage(toggleBtn.dataset.toggle);
    if (delBtn) deleteMessage(delBtn.dataset.delete);
  });
}

function viewMessage(id) {
  const messages = getData(DB.MESSAGES, []);
  const idx = messages.findIndex((m) => m.id === id);
  if (idx === -1) return;
  const m = messages[idx];

  // Mark as read automatically
  if (!m.read) {
    messages[idx].read = true;
    saveData(DB.MESSAGES, messages);
    renderMessagesTable();
  }

  const body = document.getElementById('message-modal-body');
  body.innerHTML =
    '<div class="form-grid" style="margin-bottom:6px">' +
      '<div class="form-group"><label>From</label><input type="text" value="' + escapeHTML(m.name) + ' &lt;' + escapeHTML(m.email) + '&gt;" readonly></div>' +
      '<div class="form-group"><label>Received</label><input type="text" value="' + escapeHTML(formatDate(m.date) + ' · ' + new Date(m.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })) + '" readonly></div>' +
    '</div>' +
    '<div class="form-group"><label>Subject</label><input type="text" value="' + escapeHTML(m.subject || '—') + '" readonly></div>' +
    '<div class="form-group"><label>Message</label><div class="message-box">' + nl2br(m.message || '') + '</div></div>' +
    '<div class="panel-actions">' +
      '<a class="btn btn-ghost btn-sm" href="mailto:' + escapeHTML(m.email) + '?subject=Re: ' + encodeURIComponent(m.subject || '') + '">' + icon('mail') + ' Reply</a>' +
      '<button class="btn btn-ghost btn-sm" data-close="message-modal">Close</button>' +
    '</div>';

  openModal('message-modal');
}

function toggleMessage(id) {
  const messages = getData(DB.MESSAGES, []);
  const idx = messages.findIndex((m) => m.id === id);
  if (idx === -1) return;
  messages[idx].read = !messages[idx].read;
  saveData(DB.MESSAGES, messages);
  showToast(messages[idx].read ? 'Marked as read.' : 'Marked as unread.', 'info');
  renderMessagesTable();
}

async function deleteMessage(id) {
  const msg = getData(DB.MESSAGES, []).find((m) => m.id === id);
  const ok = await confirmDialog({
    title: 'Delete message?',
    message: 'The message from "' + (msg ? msg.name : '') + '" will be permanently removed.',
    confirmText: 'Delete'
  });
  if (!ok) return;
  saveData(DB.MESSAGES, getData(DB.MESSAGES, []).filter((m) => m.id !== id));
  renderMessagesTable();
  showToast('Message deleted successfully!');
}
