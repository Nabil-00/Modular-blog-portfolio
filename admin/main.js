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
  itemTitle: document.getElementById('item-title'),
  itemImageFile: document.getElementById('item-image-file'),
  imagePreview: document.getElementById('image-preview'),
  previewImg: document.getElementById('preview-img'),
  removeImageBtn: document.getElementById('remove-image'),
  itemPrice: document.getElementById('item-price'),
  itemCategory: document.getElementById('item-category'),
  itemProjectUrl: document.getElementById('item-project-url'),
  itemTechnologies: document.getElementById('item-technologies'),
  itemContent: document.getElementById('item-content'),
  priceLabel: document.getElementById('price-label'),
  categoryLabel: document.getElementById('category-label'),
  projectUrlLabel: document.getElementById('project-url-label'),
  technologiesLabel: document.getElementById('technologies-label'),
  contentLabel: document.getElementById('content-label'),
  contentLabelText: document.getElementById('content-label-text'),
  cancelBtn: document.getElementById('cancel-btn'),
  submitBtn: document.getElementById('submit-btn'),
  template: document.getElementById('item-template')
};

const sectionConfig = {
  blog: {
    title: 'Blog Posts',
    buttonText: 'New Post',
    endpoint: '/posts',
    fields: ['title', 'image', 'content']
  },
  products: {
    title: 'Products',
    buttonText: 'New Product',
    endpoint: '/products',
    fields: ['title', 'image', 'price', 'category', 'content']
  },
  portfolio: {
    title: 'Portfolio',
    buttonText: 'New Project',
    endpoint: '/portfolio',
    fields: ['title', 'image', 'projectUrl', 'technologies', 'content']
  }
};

function showStatus(msg, type = 'info') {
  el.status.textContent = msg;
  if (msg) el.status.dataset.type = type;
  else el.status.removeAttribute('data-type');
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
  
  // Update UI
  el.sectionTitle.textContent = config.title;
  el.newItemBtn.querySelector('span').textContent = config.buttonText;
  
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

function configureFormFields(section) {
  const config = sectionConfig[section];
  
  // Hide all optional fields first
  el.priceLabel.hidden = true;
  el.categoryLabel.hidden = true;
  el.projectUrlLabel.hidden = true;
  el.technologiesLabel.hidden = true;
  
  // Show fields based on section
  if (section === 'products') {
    el.priceLabel.hidden = false;
    el.categoryLabel.hidden = false;
    el.contentLabelText.textContent = 'Description';
  } else if (section === 'portfolio') {
    el.projectUrlLabel.hidden = false;
    el.technologiesLabel.hidden = false;
    el.contentLabelText.textContent = 'Description';
  } else {
    el.contentLabelText.textContent = 'Content';
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
    const article = node.querySelector('.item-card');
    
    // Set image if exists
    const imageContainer = node.querySelector('.item-image');
    if (item.image_url) {
      imageContainer.hidden = false;
      imageContainer.querySelector('img').src = item.image_url;
      imageContainer.querySelector('img').alt = item.title;
    }
    
    // Set basic info
    node.querySelector('.item-title').textContent = item.title;
    const date = new Date(item.updated_at || item.created_at || Date.now());
    node.querySelector('.item-date').textContent = date.toLocaleString();
    node.querySelector('.item-content').textContent = item.content?.slice(0, 120) || item.description?.slice(0, 120) || '';
    
    // Set extra info based on type
    const extraContainer = node.querySelector('.item-extra');
    if (currentSection === 'products' && item.price) {
      extraContainer.hidden = false;
      extraContainer.innerHTML = `<strong>Price:</strong> $${parseFloat(item.price).toFixed(2)}${item.category ? ` | <strong>Category:</strong> ${item.category}` : ''}`;
    } else if (currentSection === 'portfolio') {
      const parts = [];
      if (item.project_url) parts.push(`<a href="${item.project_url}" target="_blank">View Project</a>`);
      if (item.technologies) parts.push(`<strong>Tech:</strong> ${item.technologies}`);
      if (parts.length) {
        extraContainer.hidden = false;
        extraContainer.innerHTML = parts.join(' | ');
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
    showStatus(`Loading ${config.title.toLowerCase()}…`);
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
  configureFormFields(currentSection);
  
  if (item) {
    el.dialogTitle.textContent = `Edit ${currentSection === 'blog' ? 'Post' : currentSection === 'products' ? 'Product' : 'Project'}`;
    el.itemId.value = item.id;
    el.itemType.value = currentSection;
    el.itemTitle.value = item.title || '';
    el.itemContent.value = item.content || item.description || '';
    
    // Show existing image if available
    if (item.image_url) {
      el.previewImg.src = item.image_url;
      el.imagePreview.hidden = false;
    }
    
    // Set section-specific fields
    if (currentSection === 'products') {
      el.itemPrice.value = item.price || '';
      el.itemCategory.value = item.category || '';
    } else if (currentSection === 'portfolio') {
      el.itemProjectUrl.value = item.project_url || '';
      el.itemTechnologies.value = item.technologies || '';
    }
  } else {
    el.dialogTitle.textContent = `Create ${currentSection === 'blog' ? 'Post' : currentSection === 'products' ? 'Product' : 'Project'}`;
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
  
  const payload = {
    title: el.itemTitle.value.trim(),
    content: el.itemContent.value.trim()
  };
  
  if (!payload.title || !payload.content) {
    showStatus('Title and content/description required', 'error');
    return;
  }
  
  try {
    showStatus(id ? 'Updating…' : 'Creating…');
    
    // Handle image upload if new file selected
    if (currentImageFile) {
      showStatus('Uploading image…');
      payload.image_url = await uploadImage(currentImageFile);
    } else if (el.previewImg.src && el.previewImg.src.startsWith('http')) {
      // Keep existing image URL
      payload.image_url = el.previewImg.src;
    }
    
    // Add section-specific fields
    if (currentSection === 'products') {
      const price = el.itemPrice.value.trim();
      if (price) payload.price = parseFloat(price);
      const category = el.itemCategory.value.trim();
      if (category) payload.category = category;
    } else if (currentSection === 'portfolio') {
      const projectUrl = el.itemProjectUrl.value.trim();
      if (projectUrl) payload.project_url = projectUrl;
      const technologies = el.itemTechnologies.value.trim();
      if (technologies) payload.technologies = technologies;
    }
    
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
  loadItems();
}

function init() {
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
