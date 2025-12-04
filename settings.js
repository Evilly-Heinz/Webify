// Settings page script for managing projects

let editingProjectId = null;

document.addEventListener('DOMContentLoaded', async () => {
  const form = document.getElementById('projectForm');
  const projectsList = document.getElementById('projectsList');

  // Check for URL parameters to pre-fill form
  const urlParams = new URLSearchParams(window.location.search);
  const storeName = urlParams.get('storeName');
  if (storeName) {
    document.getElementById('storeName').value = storeName;
    // Auto-generate project name from store name
    const projectName = storeName.charAt(0).toUpperCase() + storeName.slice(1) + ' Store';
    document.getElementById('projectName').value = projectName;
  }

  // Load existing projects
  await loadProjects();

  // Handle form submission
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = new FormData(form);
    const project = {
      name: formData.get('name').trim(),
      storeName: formData.get('storeName').trim().toLowerCase(),
      devThemeId: formData.get('devThemeId').trim(),
      liveThemeId: formData.get('liveThemeId').trim()
    };

    // Validate required fields
    if (!project.name || !project.storeName) {
      alert('Please fill in all required fields');
      return;
    }

    if (editingProjectId) {
      // Update existing project
      await storage.updateProject(editingProjectId, project);
      showMessage('Project updated successfully!', 'success');
      editingProjectId = null;
      document.querySelector('.form-actions button[type="submit"]').textContent = 'Add Project';
    } else {
      // Add new project
      await storage.addProject(project);
      showMessage('Project added successfully!', 'success');
    }
    
    // Reset form
    form.reset();
    
    // Reload projects list
    await loadProjects();
  });
});

async function loadProjects() {
  const projects = await storage.getProjects();
  const sortedProjects = storage.getSortedProjects(projects);
  const projectsList = document.getElementById('projectsList');

  if (sortedProjects.length === 0) {
    projectsList.innerHTML = '<div class="empty-state">No projects added yet.</div>';
    return;
  }

  projectsList.innerHTML = sortedProjects.map(project => `
    <div class="project-item ${project.pinned ? 'pinned' : ''}" data-id="${project.id}">
      <div class="project-item-header">
        <div class="project-item-info">
          <div style="display: flex; align-items: center; gap: 8px;">
            ${project.pinned ? '<span class="pin-icon" title="Pinned">📌</span>' : ''}
            <h3>${escapeHtml(project.name)}</h3>
          </div>
          <p><strong>Store:</strong> ${escapeHtml(project.storeName)}.myshopify.com</p>
          ${project.devThemeId ? `<p><strong>Dev Theme ID:</strong> ${escapeHtml(project.devThemeId)}</p>` : ''}
          ${project.liveThemeId ? `<p><strong>Live Theme ID:</strong> ${escapeHtml(project.liveThemeId)}</p>` : ''}
        </div>
        <div style="display: flex; gap: 8px; align-items: center;">
          <div class="project-item-actions">
            <button class="btn-icon btn-admin" data-action="open" data-id="${project.id}" data-open-action="admin" title="Go to Admin">⚙️</button>
            <button class="btn-icon btn-preview" data-action="open" data-id="${project.id}" data-open-action="preview" title="Preview">👁️</button>
            <button class="btn-icon btn-view" data-action="open" data-id="${project.id}" data-open-action="view" title="View">🌐</button>
          </div>
          <div style="display: flex; gap: 8px;">
            <button class="btn btn-pin btn-small" data-action="pin" data-id="${project.id}" title="${project.pinned ? 'Unpin' : 'Pin'}">
              ${project.pinned ? '📌' : '📍'}
            </button>
            <button class="btn btn-edit btn-small" data-action="edit" data-id="${project.id}">Edit</button>
            <button class="btn btn-danger btn-small" data-action="delete" data-id="${project.id}">Delete</button>
          </div>
        </div>
      </div>
    </div>
  `).join('');

  // Add event delegation for all buttons
  projectsList.addEventListener('click', async (e) => {
    const button = e.target.closest('button[data-action]');
    if (!button) return;

    const action = button.dataset.action;
    const id = button.dataset.id;

    if (action === 'pin') {
      await togglePin(id);
    } else if (action === 'edit') {
      await editProject(id);
    } else if (action === 'delete') {
      await deleteProject(id);
    } else if (action === 'open') {
      const openAction = button.dataset.openAction;
      await openProject(id, openAction);
    }
  });
}

async function deleteProject(id) {
  if (!confirm('Are you sure you want to delete this project?')) {
    return;
  }

  await storage.deleteProject(id);
  await loadProjects();
  showMessage('Project deleted successfully!', 'success');
}

async function editProject(id) {
  const projects = await storage.getProjects();
  const project = projects.find(p => p.id === id);
  
  if (!project) {
    alert('Project not found');
    return;
  }

  editingProjectId = id;
  document.getElementById('projectName').value = project.name;
  document.getElementById('storeName').value = project.storeName;
  document.getElementById('devThemeId').value = project.devThemeId || '';
  document.getElementById('liveThemeId').value = project.liveThemeId || '';
  
  document.querySelector('.form-actions button[type="submit"]').textContent = 'Update Project';
  
  // Scroll to form
  document.getElementById('projectForm').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

async function togglePin(id) {
  await storage.togglePin(id);
  await loadProjects();
}

async function openProject(id, action) {
  const projects = await storage.getProjects();
  const project = projects.find(p => p.id === id);
  
  if (!project) {
    alert('Project not found');
    return;
  }

  // Update last accessed time
  await storage.updateLastAccessed(id);
  await loadProjects();

  let url = '';

  switch (action) {
    case 'admin':
      url = `https://admin.shopify.com/store/${project.storeName}`;
      break;
    case 'preview':
      if (project.devThemeId) {
        url = `https://${project.storeName}.myshopify.com?preview_theme_id=${project.devThemeId}`;
      } else {
        alert('Dev Theme ID not set for this project');
        return;
      }
      break;
    case 'view':
      if (project.liveThemeId) {
        url = `https://${project.storeName}.myshopify.com?preview_theme_id=${project.liveThemeId}`;
      } else {
        url = `https://${project.storeName}.myshopify.com`;
      }
      break;
  }

  if (url) {
    chrome.tabs.create({ url });
  }
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function showMessage(message, type) {
  // Simple message display (can be enhanced with a toast notification)
  const messageDiv = document.createElement('div');
  messageDiv.className = `message message-${type}`;
  messageDiv.textContent = message;
  messageDiv.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 12px 20px;
    background: ${type === 'success' ? '#4caf50' : '#f44336'};
    color: white;
    border-radius: 4px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.2);
    z-index: 1000;
  `;
  
  document.body.appendChild(messageDiv);
  
  setTimeout(() => {
    messageDiv.remove();
  }, 3000);
}

// Functions are now called via event delegation, no need for global window assignments

