// Content script to detect Shopify URLs and prompt to add projects

(async () => {
  // Wait a bit for the page to load
  await new Promise(resolve => setTimeout(resolve, 1000));

  const host = window.location.hostname;
  const pathname = window.location.pathname;
  
  let storeName = null;
  
  if (host === 'admin.shopify.com') {
    // Extract store name from URL path: /store/{{storename}}
    const storeMatch = pathname.match(/^\/store\/([^\/]+)/);
    if (storeMatch) {
      storeName = storeMatch[1].toLowerCase();
    }
  }
  // Check for Shopify storefront URL pattern: {{storename}}.myshopify.com
  else if (host.endsWith('.myshopify.com')) {
    // Extract store name from hostname
    storeName = host.replace('.myshopify.com', '').toLowerCase();
  }
  
  // If no store name found, exit
  if (!storeName) {
    return;
  }
  
  // Get current URL
  const currentUrl = window.location.href;
  
  // Check if this store matches any existing project
  const projects = await chrome.storage.local.get(['projects']);
  const projectList = projects.projects || [];
  
  const existingProject = projectList.find(p => p.storeName.toLowerCase() === storeName);

  // If no project found, show prompt
  if (!existingProject) {
    showAddProjectPrompt(host, storeName, currentUrl);
  }
})();

function showAddProjectPrompt(host, storeName, currentUrl) {
  // Check if prompt already shown (avoid duplicates)
  if (document.getElementById('shopify-project-prompt')) {
    return;
  }

  const prompt = document.createElement('div');
  prompt.id = 'shopify-project-prompt';
  prompt.innerHTML = `
    <div class="shopify-prompt-content">
      <div class="shopify-prompt-header">
        <h3>Add Shopify Project?</h3>
        <button class="shopify-prompt-close" id="promptClose">×</button>
      </div>
      <div class="shopify-prompt-body">
        <p>This Shopify store (<strong>${escapeHtml(storeName)}.myshopify.com</strong>) is not in your project list.</p>
        <p>Would you like to add it?</p>
      </div>
      <div class="shopify-prompt-actions">
        <button class="shopify-prompt-btn shopify-prompt-btn-primary" id="promptAdd">Add to Projects</button>
        <button class="shopify-prompt-btn shopify-prompt-btn-secondary" id="promptDismiss">Dismiss</button>
      </div>
    </div>
  `;

  // Add styles
  const style = document.createElement('style');
  style.textContent = `
    #shopify-project-prompt {
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 10000;
      background: white;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      min-width: 320px;
      max-width: 400px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      animation: slideIn 0.3s ease-out;
    }

    @keyframes slideIn {
      from {
        transform: translateX(100%);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }

    .shopify-prompt-content {
      padding: 16px;
    }

    .shopify-prompt-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
    }

    .shopify-prompt-header h3 {
      margin: 0;
      font-size: 18px;
      font-weight: 600;
      color: #333;
    }

    .shopify-prompt-close {
      background: none;
      border: none;
      font-size: 24px;
      cursor: pointer;
      color: #666;
      padding: 0;
      width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 4px;
      transition: background 0.2s;
    }

    .shopify-prompt-close:hover {
      background: #f0f0f0;
    }

    .shopify-prompt-body {
      margin-bottom: 16px;
      color: #666;
      font-size: 14px;
      line-height: 1.5;
    }

    .shopify-prompt-body p {
      margin: 8px 0;
    }

    .shopify-prompt-body strong {
      color: #333;
    }

    .shopify-prompt-actions {
      display: flex;
      gap: 8px;
    }

    .shopify-prompt-btn {
      flex: 1;
      padding: 8px 16px;
      border: none;
      border-radius: 4px;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
    }

    .shopify-prompt-btn-primary {
      background: #5e6ad2;
      color: white;
    }

    .shopify-prompt-btn-primary:hover {
      background: #4d58b8;
    }

    .shopify-prompt-btn-secondary {
      background: #e0e0e0;
      color: #333;
    }

    .shopify-prompt-btn-secondary:hover {
      background: #d0d0d0;
    }
  `;

  document.head.appendChild(style);
  document.body.appendChild(prompt);

  // Event handlers
  document.getElementById('promptClose').addEventListener('click', () => {
    prompt.remove();
  });

  document.getElementById('promptDismiss').addEventListener('click', () => {
    prompt.remove();
  });

  document.getElementById('promptAdd').addEventListener('click', () => {
    // Open settings page with pre-filled store name
    chrome.runtime.sendMessage({
      action: 'openSettings',
      storeName: storeName,
      host: host
    });
    prompt.remove();
  });

  // Auto-dismiss after 10 seconds
  setTimeout(() => {
    if (document.getElementById('shopify-project-prompt')) {
      prompt.remove();
    }
  }, 10000);
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

