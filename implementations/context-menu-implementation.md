# Context Menu Feature Implementation

## Overview

This document describes the implementation of the context menu feature that allows users to quickly access Shopify admin and theme editor from any page on a Shopify store that has been added to the projects list.

## Implementation Steps

### 1. Manifest Updates

**File: `manifest.json`**

Added the `contextMenus` and `scripting` permissions to enable context menu functionality and script injection:

```json
"permissions": [
  "storage",
  "tabs",
  "activeTab",
  "contextMenus",
  "scripting"
]
```

- `contextMenus`: Required to create and manage context menu items in Chrome extensions
- `scripting`: Required to inject scripts into page context to read window variables

### 2. Background Script Updates

**File: `background.js`**

#### 2.1 Storage Utility Functions

Added storage utility functions to the background script to access project data:

```javascript
const storage = {
  async getProjects() {
    const result = await chrome.storage.local.get(['projects']);
    return result.projects || [];
  },

  async findProjectByHost(host) {
    const projects = await this.getProjects();
    const storeName = host.replace('.myshopify.com', '').toLowerCase();
    return projects.find(p => p.storeName.toLowerCase() === storeName);
  }
};
```

#### 2.2 Reading Shopify Page Data

Added functions to read Shopify data from the page context:

**Function to read `window.ShopifyAnalytics.meta.page`:**

```javascript
async function getShopifyPageData(tabId) {
  try {
    const results = await chrome.scripting.executeScript({
      target: { tabId: tabId },
      world: 'MAIN',
      func: () => {
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
```

This function:
- Uses `chrome.scripting.executeScript` with `world: 'MAIN'` to access page context
- Reads `window.ShopifyAnalytics.meta.page` which contains page metadata
- Returns page data object with `pageType`, `resourceType`, and `resourceId` properties
- Returns `null` if data is not available

**Function to read `Shopify.theme.id`:**

```javascript
async function getShopifyThemeId(tabId) {
  try {
    const results = await chrome.scripting.executeScript({
      target: { tabId: tabId },
      world: 'MAIN',
      func: () => {
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
```

This function:
- Uses `chrome.scripting.executeScript` with `world: 'MAIN'` to access page context
- Reads `Shopify.theme.id` which contains the current theme ID
- Returns the theme ID as a string or number
- Returns `null` if theme ID is not available

#### 2.3 Context Menu Creation

Implemented context menu creation on extension installation and when projects are added/removed:

- **Parent Menu**: "Webify" - Main context menu item
- **Submenu Items**:
  - "Go to admin" - Opens Shopify admin panel
  - "Go to theme editor" - Opens theme editor with current page path
  - "Edit [resource]" - Dynamically added when page data is available (product, collection, or page)

The context menu is created with:
- `contexts: ['page']` - Only shows on page context (right-click on page)
- `documentUrlPatterns: ['https://*.myshopify.com/*']` - Only shows on myshopify.com domains

#### 2.4 Dynamic Menu Visibility and Edit Resource Menu

Implemented dynamic menu visibility using `chrome.contextMenus.onShown` event (Chrome 99+):

- When context menu is about to be shown, checks if current page is a myshopify.com domain
- Verifies if the store exists in the projects list
- Hides the menu if store is not in projects list or if not on a myshopify.com domain
- **Edit Resource Menu**: Dynamically adds/removes "Edit product", "Edit collection", or "Edit page" menu item:
  - Reads `window.ShopifyAnalytics.meta.page` from page context
  - If page data exists with `resourceType` and `resourceId`, adds appropriate edit menu item
  - Menu title is based on resource type: "Edit product", "Edit collection", or "Edit page"
  - Removes edit menu item if page data is not available

#### 2.5 Context Menu Click Handler

Implemented click handler for context menu items:

**"Go to admin" action:**
- Extracts store name from current page URL
- Finds project in storage
- Opens admin URL: `https://admin.shopify.com/store/{storeName}`

**"Go to theme editor" action:**
- Extracts store name from current page URL
- Finds project in storage
- Reads `Shopify.theme.id` from page context using script injection
- Validates that theme ID is available (shows notification if not)
- Extracts path from current URL (route after host)
- Builds theme editor URL:
  - Base URL: `https://admin.shopify.com/store/{storeName}/themes/{themeId}/editor`
  - Theme ID is dynamically read from `Shopify.theme.id` on the current page
  - If path exists: Adds `?previewPath=%2F{path}` parameter
  - If path is empty (homepage): No `previewPath` parameter is added

**"Edit [resource]" action:**
- Reads `window.ShopifyAnalytics.meta.page` from page context
- Extracts `resourceType` and `resourceId` from page data
- Finds project in storage
- Builds admin edit URL based on resource type:
  - **Product**: `https://admin.shopify.com/store/{storeName}/products/{resourceId}`
  - **Collection**: `https://admin.shopify.com/store/{storeName}/collections/{resourceId}`
  - **Page**: `https://admin.shopify.com/store/{storeName}/pages/{resourceId}`
- Opens the appropriate admin edit page in a new tab

**Path Extraction Logic:**
- Gets `pathname` from URL
- Removes leading slash if present
- Removes trailing slash if present
- Only adds `previewPath` parameter if path is not empty

### 3. URL Generation Examples

**Homepage (empty path):**
- Current URL: `https://mystore.myshopify.com/`
- Theme Editor URL: `https://admin.shopify.com/store/mystore/themes/123456789/editor`

**Product Page:**
- Current URL: `https://mystore.myshopify.com/products/example-product`
- Theme Editor URL: `https://admin.shopify.com/store/mystore/themes/123456789/editor?previewPath=%2Fproducts%2Fexample-product`

**Collection Page:**
- Current URL: `https://mystore.myshopify.com/collections/summer`
- Theme Editor URL: `https://admin.shopify.com/store/mystore/themes/123456789/editor?previewPath=%2Fcollections%2Fsummer`

**Custom Page:**
- Current URL: `https://mystore.myshopify.com/pages/about`
- Theme Editor URL: `https://admin.shopify.com/store/mystore/themes/123456789/editor?previewPath=%2Fpages%2Fabout`

## How to Test

### 1. Prerequisites

- Extension must be loaded in Chrome
- At least one project must be added to the projects list with:
  - Store name matching a myshopify.com domain
- Note: Theme editor functionality now uses `Shopify.theme.id` from the page context, so Dev Theme ID in project settings is no longer required

### 2. Test Context Menu Visibility

1. Navigate to a Shopify store that is **NOT** in your projects list (e.g., `https://example.myshopify.com`)
2. Right-click anywhere on the page
3. **Expected**: Context menu "Webify" should NOT appear

4. Navigate to a Shopify store that **IS** in your projects list (e.g., `https://mystore.myshopify.com`)
5. Right-click anywhere on the page
6. **Expected**: Context menu "Webify" should appear with at least two submenu items ("Go to admin" and "Go to theme editor")
7. **Note**: "Edit [resource]" menu item will only appear if `window.ShopifyAnalytics.meta.page` is available on the current page

### 3. Test "Go to admin" Action

1. Navigate to a Shopify store in your projects list
2. Right-click on the page
3. Click "Webify" > "Go to admin"
4. **Expected**: New tab opens with URL: `https://admin.shopify.com/store/{storeName}`

### 4. Test "Go to theme editor" Action - Homepage

1. Navigate to homepage of a Shopify store in your projects list (e.g., `https://mystore.myshopify.com/`)
2. Right-click on the page
3. Click "Webify" > "Go to theme editor"
4. **Expected**: 
   - New tab opens with URL: `https://admin.shopify.com/store/{storeName}/themes/{devThemeId}/editor`
   - URL should NOT contain `previewPath` parameter

### 5. Test "Go to theme editor" Action - Product Page

1. Navigate to a product page (e.g., `https://mystore.myshopify.com/products/example`)
2. Right-click on the page
3. Click "Webify" > "Go to theme editor"
4. **Expected**: 
   - New tab opens with URL: `https://admin.shopify.com/store/{storeName}/themes/{devThemeId}/editor?previewPath=%2Fproducts%2Fexample`
   - URL should contain `previewPath` parameter with encoded path

### 6. Test "Go to theme editor" Action - Collection Page

1. Navigate to a collection page (e.g., `https://mystore.myshopify.com/collections/summer`)
2. Right-click on the page
3. Click "Webify" > "Go to theme editor"
4. **Expected**: 
   - New tab opens with URL: `https://admin.shopify.com/store/{storeName}/themes/{devThemeId}/editor?previewPath=%2Fcollections%2Fsummer`
   - Path should be correctly encoded

### 7. Test "Go to theme editor" Action - Custom Page

1. Navigate to a custom page (e.g., `https://mystore.myshopify.com/pages/about`)
2. Right-click on the page
3. Click "Webify" > "Go to theme editor"
4. **Expected**: 
   - New tab opens with URL: `https://admin.shopify.com/store/{storeName}/themes/{devThemeId}/editor?previewPath=%2Fpages%2Fabout`
   - Path should be correctly encoded

### 8. Test "Go to theme editor" - Missing Theme ID

1. Navigate to a Shopify store in your projects list
2. If `Shopify.theme.id` is not available on the page (rare, but possible on some pages)
3. Right-click and click "Webify" > "Go to theme editor"
4. **Expected**: 
   - Notification appears: "Theme ID not available on this page"
   - No new tab opens
5. **Note**: Most Shopify storefront pages have `Shopify.theme.id` available, so this should rarely occur

### 9. Test Context Menu After Adding Project

1. Navigate to a Shopify store NOT in your projects list
2. Verify context menu does NOT appear
3. Add the store to your projects list
4. Refresh the page
5. Right-click on the page
6. **Expected**: Context menu "Webify" should now appear

### 10. Test Context Menu After Removing Project

1. Navigate to a Shopify store in your projects list
2. Verify context menu appears
3. Remove the store from your projects list
4. Refresh the page
5. Right-click on the page
6. **Expected**: Context menu "Webify" should NOT appear

### 11. Test "Edit resource" Action - Product Page

1. Navigate to a product page on a Shopify store in your projects list (e.g., `https://mystore.myshopify.com/products/example`)
2. Right-click on the page
3. **Expected**: Context menu should show "Edit product" submenu item (if `window.ShopifyAnalytics.meta.page` is available)
4. Click "Webify" > "Edit product"
5. **Expected**: New tab opens with URL: `https://admin.shopify.com/store/{storeName}/products/{resourceId}`

### 12. Test "Edit resource" Action - Collection Page

1. Navigate to a collection page (e.g., `https://mystore.myshopify.com/collections/summer`)
2. Right-click on the page
3. **Expected**: Context menu should show "Edit collection" submenu item
4. Click "Webify" > "Edit collection"
5. **Expected**: New tab opens with URL: `https://admin.shopify.com/store/{storeName}/collections/{resourceId}`

### 13. Test "Edit resource" Action - Custom Page

1. Navigate to a custom page (e.g., `https://mystore.myshopify.com/pages/about`)
2. Right-click on the page
3. **Expected**: Context menu should show "Edit page" submenu item
4. Click "Webify" > "Edit page"
5. **Expected**: New tab opens with URL: `https://admin.shopify.com/store/{storeName}/pages/{resourceId}`

### 14. Test "Edit resource" - Not Available

1. Navigate to a page where `window.ShopifyAnalytics.meta.page` is not available (e.g., homepage or certain pages)
2. Right-click on the page
3. **Expected**: "Edit [resource]" menu item should NOT appear
4. **Expected**: Only "Go to admin" and "Go to theme editor" should be visible

### 15. Test Path Edge Cases

**Test with trailing slash:**
- URL: `https://mystore.myshopify.com/products/example/`
- **Expected**: Path should be `products/example` (trailing slash removed)

**Test with query parameters:**
- URL: `https://mystore.myshopify.com/products/example?variant=123`
- **Expected**: Path should be `products/example` (query parameters ignored)

**Test with hash:**
- URL: `https://mystore.myshopify.com/products/example#section`
- **Expected**: Path should be `products/example` (hash ignored)

## Technical Details

### Context Menu API Compatibility

- Uses `chrome.contextMenus` API (Manifest V3)
- Uses `chrome.contextMenus.onShown` event for dynamic visibility (Chrome 99+)
- Falls back gracefully if `onShown` is not available (older Chrome versions)

### Script Injection

- Uses `chrome.scripting.executeScript` API to read window variables
- Executes in `world: 'MAIN'` to access page context (not isolated world)
- Reads `window.ShopifyAnalytics.meta.page` which contains:
  - `pageType`: Type of page (product, collection, page)
  - `resourceType`: Type of resource (product, collection, page)
  - `resourceId`: ID of the resource for admin URL construction
- Reads `Shopify.theme.id` which contains the current theme ID for theme editor functionality

### Path Encoding

- Path is extracted from `URL.pathname`
- Leading and trailing slashes are removed
- Path is URL-encoded using `encodeURIComponent`
- Leading slash is added before encoding: `/${path}`

### Error Handling

- All async operations are wrapped in try-catch blocks
- Invalid URLs are handled gracefully
- Missing projects are handled without errors
- Missing theme ID shows user-friendly notification
- Missing page data is handled gracefully (edit menu item not shown)
- Script injection errors are caught and logged

## Known Limitations

1. **Chrome Version Requirement**: Dynamic menu visibility using `onShown` requires Chrome 99+. In older versions, the menu will always appear on myshopify.com domains but will do nothing if the store is not in the projects list.

2. **Icon Support**: Context menu items don't support custom icons in the standard Chrome API. The extension icon may appear automatically in some contexts.

3. **Query Parameters and Hash**: The current implementation only uses the pathname for the previewPath. Query parameters and hash fragments are not included in the theme editor URL.

4. **ShopifyAnalytics Dependency**: The "Edit [resource]" menu item depends on `window.ShopifyAnalytics.meta.page` being available. This may not be present on all Shopify pages (e.g., some custom pages or pages that haven't fully loaded).

5. **Script Injection Timing**: The script injection happens when the context menu is shown or clicked. If the page hasn't fully loaded or `ShopifyAnalytics`/`Shopify.theme` hasn't been initialized, the data may not be available.

6. **Theme ID Availability**: The theme editor functionality now uses `Shopify.theme.id` from the page context. While this is available on most Shopify storefront pages, it may not be available on some custom pages or pages that haven't fully loaded.

## Future Enhancements

- Support for query parameters in previewPath
- Support for hash fragments in previewPath
- Keyboard shortcuts for context menu actions
- Custom icon support (if Chrome API adds support)
- Context menu for other Shopify domains (admin.shopify.com)
- Retry mechanism for reading ShopifyAnalytics if not immediately available
- Support for additional resource types (blogs, articles, etc.)
- Fallback method to extract resource ID from URL if ShopifyAnalytics is unavailable

