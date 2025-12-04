// Popup script for displaying projects and handling actions

document.addEventListener('DOMContentLoaded', async () => {
  const projectsList = document.getElementById('projectsList');
  const addBtn = document.getElementById('addBtn');
  const addProjectBtn = document.getElementById('addProjectBtn');
  const settingsBtn = document.getElementById('settingsBtn');
  const liquidDocsBtn = document.getElementById('liquidDocsBtn');
  const storefrontApiBtn = document.getElementById('storefrontApiBtn');

  // Load and display projects
  await loadProjects();

  // Add project button handlers
  addBtn.addEventListener('click', () => {
    chrome.runtime.openOptionsPage();
  });

  addProjectBtn.addEventListener('click', () => {
    chrome.runtime.openOptionsPage();
  });

  // Settings button handler
  settingsBtn.addEventListener('click', () => {
    chrome.runtime.openOptionsPage();
  });

  // Liquid documentation button handler
  liquidDocsBtn.addEventListener('click', () => {
    chrome.tabs.create({ url: 'https://shopify.dev/docs/api/liquid' });
  });

  // Storefront API documentation button handler
  storefrontApiBtn.addEventListener('click', () => {
    chrome.tabs.create({ url: 'https://shopify.dev/docs/api/storefront/latest' });
  });
});

async function loadProjects() {
  const projects = await storage.getProjects();
  const sortedProjects = storage.getSortedProjects(projects);
  const limitedProjects = sortedProjects.slice(0, 10); // Show only first 10
  const projectsList = document.getElementById('projectsList');

  if (projects.length === 0) {
    projectsList.innerHTML = `
      <div class="empty-state">
        <p>No projects added yet.</p>
        <button id="addProjectBtn" class="add-btn">Add Project</button>
      </div>
    `;
    document.getElementById('addProjectBtn').addEventListener('click', () => {
      chrome.runtime.openOptionsPage();
    });
    return;
  }

  projectsList.innerHTML = limitedProjects.map((project, index) => `
    <div class="project-item ${project.pinned ? 'pinned' : ''}" data-index="${index}">
      <div class="project-header">
        <div>
          <div class="project-name">
            ${project.pinned ? '<span class="pin-icon">📌</span>' : ''}
            ${escapeHtml(project.name)}
          </div>
          <div class="project-store">${escapeHtml(project.storeName)}</div>
        </div>
        <div class="project-actions">
          <button class="btn-icon btn-admin" data-action="admin" data-index="${index}" title="Go to Admin">
            ⚙️
          </button>
          <button class="btn-icon btn-preview" data-action="preview" data-index="${index}" title="Preview">
            👁️
          </button>
          <button class="btn-icon btn-view" data-action="view" data-index="${index}" title="View">
            🌐
          </button>
        </div>
      </div>
    </div>
  `).join('');

  // Add event listeners to action buttons
  projectsList.querySelectorAll('[data-action]').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const action = e.target.dataset.action;
      const index = parseInt(e.target.dataset.index);
      const project = limitedProjects[index];
      
      await handleProjectAction(action, project);
    });
  });
}

async function handleProjectAction(action, project) {
  // Update last accessed time
  await storage.updateLastAccessed(project.id);
  
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

// Listen for storage changes to refresh the list
chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === 'local' && changes.projects) {
    loadProjects();
  }
});

