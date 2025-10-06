const API_BASE = '/api';
let authToken = null;

const el = {
  loginSection: document.getElementById('login-section'),
  loginForm: document.getElementById('login-form'),
  email: document.getElementById('login-email'),
  password: document.getElementById('login-password'),
  dashboard: document.getElementById('dashboard'),
  logout: document.getElementById('logout-btn'),
  newPost: document.getElementById('new-post-btn'),
  status: document.getElementById('status'),
  postsList: document.getElementById('posts-list'),
  dialog: document.getElementById('post-dialog'),
  dialogTitle: document.getElementById('dialog-title'),
  postForm: document.getElementById('post-form'),
  postId: document.getElementById('post-id'),
  postTitle: document.getElementById('post-title'),
  postImage: document.getElementById('post-image'),
  postContent: document.getElementById('post-content'),
  cancelBtn: document.getElementById('cancel-btn'),
  template: document.getElementById('post-item-template')
};

function showStatus(msg, type = 'info') {
  el.status.textContent = msg;
  if (msg) el.status.dataset.type = type;
  else el.status.removeAttribute('data-type');
}

async function apiRequest(path, opts = {}) {
  const headers = new Headers(opts.headers || {});
  if (opts.body && !(opts.body instanceof FormData)) headers.set('Content-Type', 'application/json');
  if (authToken) headers.set('Authorization', `Bearer ${authToken}`);
  const res = await fetch(`${API_BASE}${path}`, { ...opts, headers });
  if (!res.ok) {
    let msg = 'Request failed';
    try { const data = await res.json(); if (data?.error) msg = data.error; } catch (e) {}
    const err = new Error(msg); err.status = res.status; throw err;
  }
  if (res.status === 204) return null;
  return res.json();
}

function populatePosts(posts) {
  el.postsList.innerHTML = '';
  if (!posts.length) {
    el.postsList.innerHTML = '<p class="placeholder">No posts yet. Create your first post!</p>';
    return;
  }
  posts.forEach(post => {
    const node = el.template.content.cloneNode(true);
    node.querySelector('.post-title').textContent = post.title;
    const date = new Date(post.updated_at || post.created_at || Date.now());
    node.querySelector('.post-date').textContent = date.toLocaleString();
    node.querySelector('.post-content').textContent = post.content?.slice(0, 160) || '';
    node.querySelector('.edit-btn').addEventListener('click', () => openEditor(post));
    node.querySelector('.delete-btn').addEventListener('click', () => deletePost(post.id));
    el.postsList.appendChild(node);
  });
}

async function loadPosts() {
  try {
    showStatus('Loading posts…');
    const posts = await apiRequest('/posts');
    populatePosts(posts);
    showStatus('');
  } catch (error) {
    showStatus(error.message, 'error');
  }
}

async function deletePost(id) {
  if (!confirm('Delete this post?')) return;
  try {
    showStatus('Deleting post…');
    await apiRequest(`/posts/${id}`, { method: 'DELETE' });
    await loadPosts();
    showStatus('Post deleted', 'success');
  } catch (error) {
    showStatus(error.message, 'error');
  }
}

function openEditor(post = null) {
  if (post) {
    el.dialogTitle.textContent = 'Edit Post';
    el.postId.value = post.id;
    el.postTitle.value = post.title || '';
    el.postImage.value = post.image_url || '';
    el.postContent.value = post.content || '';
  } else {
    el.dialogTitle.textContent = 'Create Post';
    el.postId.value = '';
    el.postForm.reset();
  }
  if (typeof el.dialog.showModal === 'function') el.dialog.showModal();
  else el.dialog.setAttribute('open', '');
}

function closeEditor() {
  el.postForm.reset();
  el.postId.value = '';
  if (typeof el.dialog.close === 'function') el.dialog.close();
  else el.dialog.removeAttribute('open');
}

async function submitPost(e) {
  e.preventDefault();
  const id = el.postId.value;
  const payload = {
    title: el.postTitle.value.trim(),
    image_url: el.postImage.value.trim() || null,
    content: el.postContent.value.trim()
  };
  if (!payload.title || !payload.content) {
    showStatus('Title and content required', 'error');
    return;
  }
  try {
    showStatus(id ? 'Updating…' : 'Creating…');
    const body = JSON.stringify(payload);
    if (id) await apiRequest(`/posts/${id}`, { method: 'PUT', body });
    else await apiRequest('/posts', { method: 'POST', body });
    closeEditor();
    await loadPosts();
    showStatus(id ? 'Post updated' : 'Post created', 'success');
  } catch (error) {
    showStatus(error.message, 'error');
  }
}

async function handleLogin(e) {
  e.preventDefault();
  const email = el.email.value.trim();
  const password = el.password.value;
  if (!email || !password) {
    showStatus('Email and password required', 'error');
    return;
  }
  try {
    showStatus('Signing in…');
    const data = await apiRequest('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
    authToken = data.access_token;
    sessionStorage.setItem('supabase_blog_token', authToken);
    el.loginSection.hidden = true;
    el.dashboard.hidden = false;
    el.logout.hidden = false;
    await loadPosts();
  } catch (error) {
    showStatus(error.message, 'error');
  }
}

function handleLogout() {
  authToken = null;
  sessionStorage.removeItem('supabase_blog_token');
  el.dashboard.hidden = true;
  el.logout.hidden = true;
  el.loginSection.hidden = false;
  el.postsList.innerHTML = '<p class="placeholder">Please log in.</p>';
  showStatus('');
}

function restoreSession() {
  const token = sessionStorage.getItem('supabase_blog_token');
  if (!token) return;
  authToken = token;
  el.loginSection.hidden = true;
  el.dashboard.hidden = false;
  el.logout.hidden = false;
  loadPosts();
}

function init() {
  el.loginForm.addEventListener('submit', handleLogin);
  el.logout.addEventListener('click', handleLogout);
  el.newPost.addEventListener('click', () => openEditor());
  el.postForm.addEventListener('submit', submitPost);
  el.cancelBtn.addEventListener('click', () => { closeEditor(); el.postForm.reset(); });
  restoreSession();
}

document.addEventListener('DOMContentLoaded', init);
