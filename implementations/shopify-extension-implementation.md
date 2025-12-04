# Shopify Project Manager Chrome Extension - Implementation

## Overview

This document describes the implementation of the Shopify Project Manager Chrome Extension, which allows users to manage multiple Shopify projects and quickly navigate between them.

## Implementation Steps

### 1. Project Structure Setup

Created the following files and directories:

- `manifest.json` - Chrome extension manifest (Manifest V3)
- `popup.html/css/js` - Extension popup interface
- `settings.html/css/js` - Settings page for managing projects
- `content.js` - Content script for detecting Shopify URLs
- `background.js` - Background service worker
- `storage.js` - Storage utility functions
- `icons/` - Directory for extension icons

### 2. Manifest Configuration

The `manifest.json` file includes:
- Manifest V3 configuration
- Required permissions: `storage`, `tabs`, `activeTab`
- Host permissions for `https://*.shopify.com/*`
- Content script injection for Shopify domains
- Options page (settings.html)
- Popup action configuration

### 3. Storage System

Implemented `storage.js` with the following functions:
- `getProjects()` - Retrieve all saved projects
- `saveProjects(projects)` - Save projects array
- `addProject(project)` - Add a new project
- `deleteProject(id)` - Delete a project by ID
- `updateProject(id, updatedProject)` - Update an existing project
- `findProjectByHost(host)` - Find project by store hostname

Projects are stored in Chrome's local storage with the following structure:
```javascript
{
  id: string,
  name: string,
  storeName: string,
  devThemeId: string (optional),
  liveThemeId: string (optional)
}
```

### 4. Settings Page

The settings page (`settings.html`) provides:
- Form to add new projects with fields:
  - Project Name (required)
  - Store Name (required)
  - Dev Theme ID (optional)
  - Live Theme ID (optional)
- List of all saved projects
- Action buttons for each project:
  - Go to Admin
  - Preview (with Dev Theme ID)
  - View (with Live Theme ID)
- Delete functionality for each project

The settings page:
- Loads existing projects on page load
- Validates form input before submission
- Pre-fills store name when opened from content script prompt
- Shows success/error messages
- Updates the project list in real-time

### 5. Popup Interface

The popup (`popup.html`) displays:
- Header with title and settings button
- List of all projects (or empty state)
- Action buttons for each project:
  - Go to Admin
  - Preview
  - View
- Add Project button in footer

The popup:
- Loads projects on open
- Listens for storage changes to auto-refresh
- Opens new tabs for project actions
- Handles empty state gracefully

### 6. Content Script

The content script (`content.js`) implements:
- Detection of Shopify domains (`*.shopify.com`)
- Check if current host matches any saved project
- Display prompt if store is not in project list
- Prompt includes:
  - Store hostname display
  - "Add to Projects" button
  - "Dismiss" button
  - Auto-dismiss after 10 seconds

The prompt:
- Only shows once per page load
- Styled with modern UI
- Sends message to background script to open settings with pre-filled data

### 7. Background Service Worker

The background script (`background.js`) handles:
- Message listening from content script
- Opening settings page with URL parameters
- Tab update monitoring (for future enhancements)

### 8. URL Generation

The extension generates URLs based on action type:

- **Admin**: `https://{storeName}.myshopify.com/admin`
- **Preview**: `https://{storeName}.myshopify.com?preview_theme_id={devThemeId}`
- **View**: 
  - If liveThemeId exists: `https://{storeName}.myshopify.com?preview_theme_id={liveThemeId}`
  - Otherwise: `https://{storeName}.myshopify.com`

## How to Test

### 1. Load the Extension

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top right)
3. Click "Load unpacked"
4. Select the extension directory
5. Verify the extension appears in the list

### 2. Add Icon Files

Before testing, add icon files to `icons/` directory:
- `icon16.png` (16x16)
- `icon48.png` (48x48)
- `icon128.png` (128x128)

You can use placeholder images or create custom icons.

### 3. Test Settings Page

1. Click the extension icon
2. Click the settings icon (⚙️) or "Add Project"
3. Fill in the form:
   - Project Name: "Test Store"
   - Store Name: "teststore" (or any valid Shopify store name)
   - Dev Theme ID: "123456789" (optional)
   - Live Theme ID: "987654321" (optional)
4. Click "Add Project"
5. Verify the project appears in the list
6. Test the action buttons:
   - Go to Admin should open admin panel
   - Preview should open with dev theme
   - View should open with live theme or regular view

### 4. Test Popup

1. Click the extension icon
2. Verify the project list appears
3. Click action buttons to verify they open correct URLs
4. Test with multiple projects

### 5. Test Content Script Detection

1. Navigate to a Shopify store URL (e.g., `https://example.myshopify.com`)
2. Verify the prompt appears if the store is not in your project list
3. Click "Add to Projects"
4. Verify settings page opens with store name pre-filled
5. Add the project
6. Refresh the Shopify page
7. Verify the prompt does NOT appear (since it's now in the list)

### 6. Test Edge Cases

- Add project with only required fields (no theme IDs)
- Try Preview button on project without Dev Theme ID (should show alert)
- Delete a project and verify it's removed
- Test with empty project list
- Test with multiple projects

### 7. Test Storage Persistence

1. Add a project
2. Close and reopen Chrome
3. Verify the project is still saved
4. Verify it appears in both popup and settings

## Known Limitations

1. **Icons Required**: You need to manually add icon files to the `icons/` directory
2. **Store Name Validation**: The extension doesn't validate if the store name is a real Shopify store
3. **Theme ID Validation**: Theme IDs are not validated for correctness
4. **No Edit Functionality**: Projects can only be deleted and re-added (not edited in-place)

## Future Enhancements

- Edit project functionality
- Import/Export projects
- Theme ID validation
- Store name validation
- Keyboard shortcuts
- Recent projects list
- Project grouping/categories

