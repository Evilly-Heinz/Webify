// Background service worker for Chrome extension

// Storage utility functions for background script
const storage = {
  async getProjects() {
    const result = await chrome.storage.local.get(['projects']);
    return result.projects || [];
  },

  async findProjectByHost(host) {
    const projects = await this.getProjects();
    // Extract store name from host (e.g., "mystore.myshopify.com" -> "mystore")
    const storeName = host.replace('.myshopify.com', '').toLowerCase();
    return projects.find(p => p.storeName.toLowerCase() === storeName);
  }
};

// Context menu IDs
const CONTEXT_MENU_IDS = {
  PARENT: 'webify-parent',
  ADMIN: 'webify-admin',
  THEME_EDITOR: 'webify-theme-editor',
  EDIT_RESOURCE: 'webify-edit-resource'
};

// Function to read window.ShopifyAnalytics.meta.page from page context
async function getShopifyPageData(tabId) {
  try {
    const results = await chrome.scripting.executeScript({
      target: { tabId: tabId },
      world: 'MAIN',
      func: () => {
        // Access window.ShopifyAnalytics.meta.page
        if (window.ShopifyAnalytics && 
            window.ShopifyAnalytics.meta && 
            window.ShopifyAnalytics.meta.page) {
          return window.ShopifyAnalytics.meta.page;
        }
        return null;
      }
    });
    return results[0].result;
  } catch (error) {
    console.error('Error reading ShopifyAnalytics.meta.page:', error);
    return null;
  }
}

// Function to read Shopify.theme.id from page context
async function getShopifyThemeId(tabId) {
  try {
    const results = await chrome.scripting.executeScript({
      target: { tabId: tabId },
      world: 'MAIN',
      func: () => {
        // Access Shopify.theme.id
        if (window.Shopify && window.Shopify.theme && window.Shopify.theme.id) {
          return window.Shopify.theme.id;
        }
        return null;
      }
    });
    return results[0].result;
  } catch (error) {
    console.error('Error reading Shopify.theme.id:', error);
    return null;
  }
}

// Create context menu on extension installation
chrome.runtime.onInstalled.addListener(() => {
  createContextMenu();
});

// Recreate context menu when storage changes (projects added/removed)
chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === 'local' && changes.projects) {
    createContextMenu();
  }
});

// Create or update context menu
async function createContextMenu() {
  // Remove existing menu items
  try {
    await chrome.contextMenus.removeAll();
  } catch (e) {
    // Menu might not exist yet, ignore
  }

  // Create parent menu
  chrome.contextMenus.create({
    id: CONTEXT_MENU_IDS.PARENT,
    title: 'Webify',
    contexts: ['page'],
    documentUrlPatterns: ['https://*.myshopify.com/*']
  });

  // Create submenu items
  chrome.contextMenus.create({
    id: CONTEXT_MENU_IDS.ADMIN,
    parentId: CONTEXT_MENU_IDS.PARENT,
    title: 'Go to admin',
    contexts: ['page'],
    documentUrlPatterns: ['https://*.myshopify.com/*']
  });

  chrome.contextMenus.create({
    id: CONTEXT_MENU_IDS.THEME_EDITOR,
    parentId: CONTEXT_MENU_IDS.PARENT,
    title: 'Edit theme',
    contexts: ['page'],
    documentUrlPatterns: ['https://*.myshopify.com/*']
  });
}

// Handle context menu onShown event (Chrome 99+)
// This allows us to dynamically show/hide menu items
if (chrome.contextMenus.onShown) {
  chrome.contextMenus.onShown.addListener(async (info, tab) => {
    if (!tab || !tab.url) {
      // Hide menu if no valid tab
      try {
        chrome.contextMenus.remove(CONTEXT_MENU_IDS.PARENT);
      } catch (e) {
        // Menu might not exist, ignore
      }
      return;
    }

    try {
      const url = new URL(tab.url);
      
      // Check if URL is a Shopify myshopify.com domain
      if (url.hostname.endsWith('.myshopify.com')) {
        // Check if store exists in projects
        const project = await storage.findProjectByHost(url.hostname);
        
        // Hide menu if project doesn't exist
        if (!project) {
          try {
            chrome.contextMenus.remove(CONTEXT_MENU_IDS.PARENT);
          } catch (e) {
            // Menu might not exist, ignore
          }
          return;
        }

        // Try to remove existing edit resource menu item if it exists
        try {
          chrome.contextMenus.remove(CONTEXT_MENU_IDS.EDIT_RESOURCE);
        } catch (e) {
          // Menu item might not exist, ignore
        }

        // Read Shopify page data to check if we can add edit menu
        const pageData = await getShopifyPageData(tab.id);
        
        if (pageData && pageData.resourceType && pageData.resourceId) {
          // Determine menu title based on resource type
          let menuTitle = 'Edit';
          if (pageData.resourceType === 'product') {
            menuTitle = 'Edit product';
          } else if (pageData.resourceType === 'collection') {
            menuTitle = 'Edit collection';
          } else if (pageData.resourceType === 'page') {
            menuTitle = 'Edit page';
          }

          // Add edit resource menu item
          try {
            chrome.contextMenus.create({
              id: CONTEXT_MENU_IDS.EDIT_RESOURCE,
              parentId: CONTEXT_MENU_IDS.PARENT,
              title: menuTitle,
              contexts: ['page'],
              documentUrlPatterns: ['https://*.myshopify.com/*']
            });
          } catch (e) {
            console.error('Error creating edit resource menu:', e);
          }
        }
      } else {
        // Hide menu if not a myshopify.com domain
        try {
          chrome.contextMenus.remove(CONTEXT_MENU_IDS.PARENT);
        } catch (e) {
          // Menu might not exist, ignore
        }
      }
    } catch (e) {
      // Invalid URL, hide menu
      try {
        chrome.contextMenus.remove(CONTEXT_MENU_IDS.PARENT);
      } catch (e) {
        // Menu might not exist, ignore
      }
    }
  });
}

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (!tab || !tab.url) return;

  try {
    const url = new URL(tab.url);
    
    // Only handle clicks on myshopify.com domains
    if (!url.hostname.endsWith('.myshopify.com')) {
      return;
    }

    // Extract store name from hostname
    const storeName = url.hostname.replace('.myshopify.com', '').toLowerCase();
    
    // Find project for this store
    const project = await storage.findProjectByHost(url.hostname);
    
    // Only proceed if project exists
    if (!project) {
      return;
    }

    if (info.menuItemId === CONTEXT_MENU_IDS.ADMIN) {
      // Go to admin
      const adminUrl = `https://admin.shopify.com/store/${project.storeName}`;
      chrome.tabs.create({ url: adminUrl });
    } else if (info.menuItemId === CONTEXT_MENU_IDS.THEME_EDITOR) {
      // Go to theme editor
      // Get theme ID from page context
      const themeId = await getShopifyThemeId(tab.id);
      
      if (!themeId) {
        // Show notification that theme ID is not available
        chrome.notifications?.create({
          type: 'basic',
          iconUrl: chrome.runtime.getURL('icons/icon48.png'),
          title: 'Webify',
          message: 'Theme ID not available on this page'
        });
        return;
      }

      // Extract path from URL (route after host)
      let path = url.pathname;
      // Remove leading slash if present
      if (path.startsWith('/')) {
        path = path.substring(1);
      }
      // Remove trailing slash if present
      if (path.endsWith('/')) {
        path = path.slice(0, -1);
      }

      // Build theme editor URL using theme ID from page
      let themeEditorUrl = `https://admin.shopify.com/store/${project.storeName}/themes/${themeId}/editor`;
      
      // Check if current URL has view query parameter
      const viewParam = url.searchParams.get('view');
      const hasViewParam = viewParam !== null;
      
      // Add previewPath only if path is not empty
      if (path) {
        // Build path with view parameter if it exists
        let pathWithQuery = `/${path}`;
        if (hasViewParam) {
          // Append view parameter to path (will be encoded: ? becomes %3F, = becomes %3D)
          pathWithQuery += `?view=${viewParam}`;
        }
        // Encode the entire path (including query if present)
        const encodedPath = encodeURIComponent(pathWithQuery);
        themeEditorUrl += `?previewPath=${encodedPath}`;
      } else if (hasViewParam) {
        // If no path but view param exists, add it as query parameter
        themeEditorUrl += `?view=${encodeURIComponent(viewParam)}`;
      }

      chrome.tabs.create({ url: themeEditorUrl });
    } else if (info.menuItemId === CONTEXT_MENU_IDS.EDIT_RESOURCE) {
      // Edit resource (product, collection, or page)
      // Read page data to get resource type and ID
      const pageData = await getShopifyPageData(tab.id);
      
      if (!pageData || !pageData.resourceType || !pageData.resourceId) {
        console.error('Page data not available for editing');
        return;
      }

      // Build admin URL based on resource type
      let editUrl = '';
      if (pageData.resourceType === 'product') {
        editUrl = `https://admin.shopify.com/store/${project.storeName}/products/${pageData.resourceId}`;
      } else if (pageData.resourceType === 'collection') {
        editUrl = `https://admin.shopify.com/store/${project.storeName}/collections/${pageData.resourceId}`;
      } else if (pageData.resourceType === 'page') {
        editUrl = `https://admin.shopify.com/store/${project.storeName}/pages/${pageData.resourceId}`;
      } else {
        console.error('Unknown resource type:', pageData.resourceType);
        return;
      }

      if (editUrl) {
        chrome.tabs.create({ url: editUrl });
      }
    }
  } catch (e) {
    console.error('Error handling context menu click:', e);
  }
});


// Handle messages from content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'openSettings') {
    // Open settings page with pre-filled store name
    const url = chrome.runtime.getURL('settings.html');
    if (message.storeName) {
      chrome.tabs.create({ url: `${url}?storeName=${encodeURIComponent(message.storeName)}` });
    } else {
      chrome.runtime.openOptionsPage();
    }
    sendResponse({ success: true });
  }
  return true;
});

