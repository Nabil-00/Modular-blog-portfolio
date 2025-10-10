// API base URL - uses relative path to work with any domain
const API_BASE = '/api';
let authToken = null;
let currentSection = 'blog';
let currentImageFile = null;

const el = {
  loginSection: document.getElementById('login-section'),
  loginForm: document.getElementById('login-form'),
  email: document.getElementById('login-email'),
  password: document.getElementById('login-password'),
  dashboard: document.getElementById('dashboard'),
  logout: document.getElementById('logout-btn'),
  themeToggle: document.getElementById('theme-toggle'),
  navItems: document.querySelectorAll('.nav-item'),
  sectionTitle: document.getElementById('section-title'),
  newItemBtn: document.getElementById('new-item-btn'),
  status: document.getElementById('status'),
  itemsList: document.getElementById('items-list'),
  dialog: document.getElementById('item-dialog'),
  dialogTitle: document.getElementById('dialog-title'),
  itemForm: document.getElementById('item-form'),
  itemId: document.getElementById('item-id'),
  itemType: document.getElementById('item-type'),
  titleLabel: document.getElementById('title-label'),
  titleLabelText: document.getElementById('title-label-text'),
  itemTitle: document.getElementById('item-title'),
  itemImageFile: document.getElementById('item-image-file'),
  imagePreview: document.getElementById('image-preview'),
  previewImg: document.getElementById('preview-img'),
  removeImageBtn: document.getElementById('remove-image'),
  categoryLabel: document.getElementById('category-label'),
  itemCategory: document.getElementById('item-category'),
  itemContent: document.getElementById('item-content'),
  contentLabel: document.getElementById('content-label'),
  contentLabelText: document.getElementById('content-label-text'),
  cancelBtn: document.getElementById('cancel-btn'),
  submitBtn: document.getElementById('submit-btn'),
  template: document.getElementById('item-template'),
  notifications: document.getElementById('notification-stack'),
  apiPlaceholder: document.getElementById('api-placeholder')
};

const sectionConfig = {
  blog: {
    title: 'Blog Posts',
    buttonText: 'New Post',
    endpoint: '/posts',
    titleLabel: 'Post Title',
    showContent: true,
    contentLabel: 'Content',
    requireContent: true,
    showCategory: false
  },
  products: {
    title: 'Products',
    buttonText: 'New Product',
    endpoint: '/products',
    titleLabel: 'Product Name',
    showContent: true,
    contentLabel: 'Description',
    requireContent: true,
    showCategory: true
  },
  portfolio: {
    title: 'Portfolio',
    buttonText: 'New',
    endpoint: '/portfolio',
    titleLabel: 'Caption',
    showContent: false,
    contentLabel: 'Caption',
    requireContent: false,
    showCategory: false
  },
  api: {
    title: 'API',
    buttonText: null,
    endpoint: null,
    titleLabel: 'Title',
    showContent: false,
    contentLabel: 'Content',
    requireContent: false,
    showCategory: false,
    isPlaceholder: true
  }
};

const notifications = [];
const TOAST_DURATION = 5000;

function createNotification(message, type = 'info') {
  if (!el.notifications) return;

  const toast = document.createElement('div');
  toast.className = 'notification';
  toast.dataset.type = type;
  toast.setAttribute('role', 'status');
  toast.setAttribute('aria-live', type === 'error' ? 'assertive' : 'polite');

  const text = document.createElement('span');
  text.textContent = message;

  const closeButton = document.createElement('button');
  closeButton.type = 'button';
  closeButton.setAttribute('aria-label', 'Dismiss notification');
  closeButton.innerHTML = '&times;';

  const removeToast = () => {
    toast.classList.add('fade-out');
    setTimeout(() => {
      toast.remove();
      const idx = notifications.indexOf(toast);
      if (idx >= 0) notifications.splice(idx, 1);
    }, 200);
  };

  closeButton.addEventListener('click', removeToast);

  toast.appendChild(text);
  toast.appendChild(closeButton);

  notifications.push(toast);
  el.notifications.appendChild(toast);

  setTimeout(() => {
    if (notifications.includes(toast)) removeToast();
  }, TOAST_DURATION);
}

function showStatus(message, type = 'info') {
  if (!message) return;
  const intent = type === 'error' ? 'error' : type === 'success' ? 'success' : 'info';
  createNotification(message, intent);
}

async function apiRequest(path, opts = {}) {
  const headers = new Headers(opts.headers || {});
  if (opts.body && !(opts.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }
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

function switchSection(section) {
  currentSection = section;
  const config = sectionConfig[section];

  // Update UI for button and placeholder visibility
  el.sectionTitle.textContent = config.title;
  updateSectionControls(config);

  // Update nav active state
  el.navItems.forEach(item => {
    if (item.dataset.section === section) {
      item.classList.add('active');
    } else {
      item.classList.remove('active');
    }
  });

  // Load items for this section
  loadItems();
}

function updateSectionControls(config) {
  if (!config) return;
  const isPlaceholder = !!config.isPlaceholder;

  if (el.newItemBtn) {
    if (config.buttonText) {
      el.newItemBtn.hidden = false;
      el.newItemBtn.disabled = false;
      el.newItemBtn.querySelector('span').textContent = config.buttonText;
    } else {
      el.newItemBtn.hidden = true;
      el.newItemBtn.disabled = true;
    }
  }

  // Show/hide items list and API placeholder based on section
  if (el.itemsList) {
    if (isPlaceholder) {
      el.itemsList.hidden = true;
      el.itemsList.style.display = 'none';
    } else {
      el.itemsList.hidden = false;
      el.itemsList.style.display = '';
    }
  }

  if (el.apiPlaceholder) {
    if (isPlaceholder) {
      el.apiPlaceholder.hidden = false;
      el.apiPlaceholder.style.display = 'flex';
    } else {
      el.apiPlaceholder.hidden = true;
      el.apiPlaceholder.style.display = 'none';
    }
  }
}

function configureFormFields(section) {
  const config = sectionConfig[section];
  el.titleLabelText.textContent = config.titleLabel;

  if (config.showCategory) {
    el.categoryLabel.hidden = false;
  } else {
    el.categoryLabel.hidden = true;
    el.itemCategory.value = '';
  }

  if (config.showContent) {
    el.contentLabel.hidden = false;
    el.contentLabelText.textContent = config.contentLabel;
    el.itemContent.required = !!config.requireContent;
  } else {
    el.contentLabel.hidden = true;
    el.itemContent.required = false;
    el.itemContent.value = '';
  }
}

function populateItems(items) {
  el.itemsList.innerHTML = '';
  if (!items.length) {
    el.itemsList.innerHTML = '<p class="placeholder">No items yet. Create your first item!</p>';
    return;
  }
  
  items.forEach(item => {
    const node = el.template.content.cloneNode(true);
    const imageContainer = node.querySelector('.item-image');
    const imageEl = imageContainer.querySelector('img');
    const titleEl = node.querySelector('.item-title');
    const dateEl = node.querySelector('.item-date');
    const contentEl = node.querySelector('.item-content');
    const extraContainer = node.querySelector('.item-extra');

    if (item.image_url) {
      imageContainer.hidden = false;
      imageEl.src = item.image_url;
      imageEl.alt = item.title || 'Image';
    } else {
      imageContainer.hidden = true;
      imageEl.src = '';
      imageEl.alt = '';
    }

    titleEl.textContent = item.title || 'Untitled';

    const date = new Date(item.updated_at || item.created_at || Date.now());

    if (currentSection === 'portfolio') {
      dateEl.hidden = true;
      dateEl.textContent = '';

      if (item.content) {
        contentEl.hidden = false;
        contentEl.textContent = item.content;
      } else {
        contentEl.hidden = true;
        contentEl.textContent = '';
      }

      extraContainer.hidden = true;
      extraContainer.innerHTML = '';
    } else {
      dateEl.hidden = false;
      dateEl.textContent = date.toLocaleString();

      const summary = item.content || '';
      contentEl.hidden = !summary;
      contentEl.textContent = summary ? summary.slice(0, 160) : '';

      if (currentSection === 'products' && item.category) {
        extraContainer.hidden = false;
        extraContainer.innerHTML = `<strong>Category:</strong> ${item.category}`;
      } else {
        extraContainer.hidden = true;
        extraContainer.innerHTML = '';
      }
    }

    // Set event listeners
    node.querySelector('.edit-btn').addEventListener('click', () => openEditor(item));
    node.querySelector('.delete-btn').addEventListener('click', () => deleteItem(item.id));
    el.itemsList.appendChild(node);
  });
}

async function loadItems() {
  try {
    const config = sectionConfig[currentSection];
    if (config?.isPlaceholder) {
      // No data to load for placeholder sections
      return;
    }
    showStatus(`Loading ${config.title.toLowerCase()}…`, 'info');
    const items = await apiRequest(config.endpoint);
    populateItems(items);
    showStatus('');
  } catch (error) {
    showStatus(error.message, 'error');
  }
}

async function deleteItem(id) {
  if (!confirm('Delete this item?')) return;
  try {
    const config = sectionConfig[currentSection];
    showStatus('Deleting…');
    await apiRequest(`${config.endpoint}/${id}`, { method: 'DELETE' });
    await loadItems();
    showStatus('Item deleted', 'success');
  } catch (error) {
    showStatus(error.message, 'error');
  }
}

function handleImageSelect(e) {
  const file = e.target.files?.[0];
  if (!file) return;
  
  currentImageFile = file;
  const reader = new FileReader();
  reader.onload = (e) => {
    el.previewImg.src = e.target.result;
    el.imagePreview.hidden = false;
  };
  reader.readAsDataURL(file);
}

function removeImage() {
  currentImageFile = null;
  el.itemImageFile.value = '';
  el.imagePreview.hidden = true;
  el.previewImg.src = '';
}

function openEditor(item = null) {
  const config = sectionConfig[currentSection];
  if (config?.isPlaceholder) {
    showStatus('API tools are coming soon.', 'info');
    return;
  }
  configureFormFields(currentSection);
  currentImageFile = null;
  
  if (item) {
    const itemType = currentSection === 'blog' ? 'Post' : currentSection === 'products' ? 'Product' : 'Image';
    el.dialogTitle.textContent = `Edit ${itemType}`;
    el.itemId.value = item.id;
    el.itemType.value = currentSection;
    el.itemTitle.value = item.title || '';

    if (config.showContent) {
      el.itemContent.value = item.content || '';
    } else {
      el.itemContent.value = '';
    }

    if (config.showCategory) {
      el.itemCategory.value = item.category || '';
    } else {
      el.itemCategory.value = '';
    }
    
    // Show existing image if available
    if (item.image_url) {
      el.previewImg.src = item.image_url;
      el.imagePreview.hidden = false;
    }
  } else {
    const itemType = currentSection === 'blog' ? 'Post' : currentSection === 'products' ? 'Product' : 'Image';
    el.dialogTitle.textContent = `Create ${itemType}`;
    el.itemId.value = '';
    el.itemType.value = currentSection;
    el.itemForm.reset();
    removeImage();
  }
  
  if (typeof el.dialog.showModal === 'function') el.dialog.showModal();
  else el.dialog.setAttribute('open', '');
}

function closeEditor() {
  el.itemForm.reset();
  el.itemId.value = '';
  removeImage();
  if (typeof el.dialog.close === 'function') el.dialog.close();
  else el.dialog.removeAttribute('open');
}

async function uploadImage(file) {
  const formData = new FormData();
  formData.append('image', file);
  
  try {
    const result = await apiRequest('/upload', { method: 'POST', body: formData });
    return result.url;
  } catch (error) {
    throw new Error(`Image upload failed: ${error.message}`);
  }
}

async function submitItem(e) {
  e.preventDefault();
  const id = el.itemId.value;
  const config = sectionConfig[currentSection];
  
  const title = el.itemTitle.value.trim();
  const content = el.itemContent.value.trim();
  const category = el.itemCategory.value.trim();

  if (!title) {
    showStatus('Title is required', 'error');
    return;
  }
  
  if (config.requireContent && !content) {
    showStatus(`${config.contentLabel} is required`, 'error');
    return;
  }

  if (currentSection === 'portfolio') {
    const hasExistingImage = !!(el.previewImg.src && el.previewImg.src.startsWith('http'));
    if (!currentImageFile && !hasExistingImage) {
      showStatus('Image is required for portfolio items', 'error');
      return;
    }
  }

  const payload = { title };
  if (config.showContent && content) payload.content = content;
  if (config.showCategory) payload.category = category || null;

  try {
    showStatus(id ? 'Updating…' : 'Creating…', 'info');
    
    // Handle image upload if new file selected
    if (currentImageFile) {
      showStatus('Uploading image…', 'info');
      payload.image_url = await uploadImage(currentImageFile);
    } else if (el.previewImg.src && el.previewImg.src.startsWith('http')) {
      // Keep existing image URL
      payload.image_url = el.previewImg.src;
    }
    
    // Add section-specific fields
    
    const body = JSON.stringify(payload);
    if (id) {
      await apiRequest(`${config.endpoint}/${id}`, { method: 'PUT', body });
    } else {
      await apiRequest(config.endpoint, { method: 'POST', body });
    }
    
    closeEditor();
    await loadItems();
    showStatus(id ? 'Item updated' : 'Item created', 'success');
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
    await loadItems();
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
  el.itemsList.innerHTML = '<p class="placeholder">Please log in.</p>';
  showStatus('');
}

function restoreSession() {
  const token = sessionStorage.getItem('supabase_blog_token');
  if (!token) return;
  authToken = token;
  el.loginSection.hidden = true;
  el.dashboard.hidden = false;
  el.logout.hidden = false;
  const initialConfig = sectionConfig[currentSection];
  updateSectionControls(initialConfig);
  loadItems();
}

// Theme Toggle Functions
function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute('data-theme');
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  
  document.documentElement.setAttribute('data-theme', newTheme);
  localStorage.setItem('admin-theme', newTheme);
  
  // Update icon
  const icon = el.themeToggle.querySelector('.theme-icon');
  icon.textContent = newTheme === 'dark' ? '☀️' : '🌙';
  
  // Update aria-label
  el.themeToggle.setAttribute('aria-label', `Switch to ${newTheme === 'dark' ? 'light' : 'dark'} mode`);
  el.themeToggle.setAttribute('title', `Switch to ${newTheme === 'dark' ? 'light' : 'dark'} mode`);
}

function initTheme() {
  const savedTheme = localStorage.getItem('admin-theme') || 'light';
  document.documentElement.setAttribute('data-theme', savedTheme);
  
  const icon = el.themeToggle.querySelector('.theme-icon');
  icon.textContent = savedTheme === 'dark' ? '☀️' : '🌙';
  
  el.themeToggle.setAttribute('aria-label', `Switch to ${savedTheme === 'dark' ? 'light' : 'dark'} mode`);
  el.themeToggle.setAttribute('title', `Switch to ${savedTheme === 'dark' ? 'light' : 'dark'} mode`);
}

function init() {
  // Initialize theme first
  initTheme();
  
  // Theme toggle
  el.themeToggle.addEventListener('click', toggleTheme);
  
  // Login/logout
  el.loginForm.addEventListener('submit', handleLogin);
  el.logout.addEventListener('click', handleLogout);
  
  // Navigation
  el.navItems.forEach(item => {
    item.addEventListener('click', () => {
      const section = item.dataset.section;
      switchSection(section);
    });
  });
  
  // Item management
  el.newItemBtn.addEventListener('click', () => openEditor());
  el.itemForm.addEventListener('submit', submitItem);
  el.cancelBtn.addEventListener('click', () => { closeEditor(); });
  
  // Image handling
  el.itemImageFile.addEventListener('change', handleImageSelect);
  el.removeImageBtn.addEventListener('click', removeImage);
  
  restoreSession();
}

document.addEventListener('DOMContentLoaded', init);
