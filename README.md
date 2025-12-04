# Shopify Project Manager Chrome Extension

A Chrome extension to manage and quickly navigate your Shopify projects.

## Features

- **Settings Page**: Add and manage Shopify projects with Name, Store Name, Dev Theme ID, and Live Theme ID
- **Project List**: View all your projects in the extension popup
- **Quick Actions**: 
  - Go to Admin: Opens the Shopify admin panel
  - Preview: Opens the store with Dev Theme ID preview
  - View: Opens the store with Live Theme ID preview (or regular view)
- **Smart Detection**: Automatically detects when you visit a Shopify store that's not in your project list and prompts you to add it

## Installation

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" (toggle in the top right)
3. Click "Load unpacked"
4. Select the folder containing this extension
5. The extension icon should appear in your Chrome toolbar

## Usage

### Adding a Project

1. Click the extension icon in your toolbar
2. Click "Add Project" or the settings icon (⚙️)
3. Fill in the project details:
   - **Project Name**: A friendly name for your project
   - **Store Name**: The store name without `.myshopify.com` (e.g., "mystore")
   - **Dev Theme ID**: Optional - Your development theme ID
   - **Live Theme ID**: Optional - Your live theme ID
4. Click "Add Project"

### Using Projects

- **From Popup**: Click the extension icon to see all projects and use the action buttons
- **From Settings**: View all projects with full details and actions in the settings page

### Auto-Detection

When you visit a Shopify store (`.shopify.com` domain) that's not in your project list, a prompt will appear asking if you want to add it. Click "Add to Projects" to open the settings page with the store name pre-filled.

## Project Structure

```
.
├── manifest.json          # Extension manifest
├── popup.html            # Extension popup UI
├── popup.css             # Popup styles
├── popup.js              # Popup functionality
├── settings.html         # Settings page UI
├── settings.css          # Settings page styles
├── settings.js           # Settings page functionality
├── content.js            # Content script for Shopify detection
├── background.js         # Background service worker
├── storage.js            # Storage utility functions
└── icons/                # Extension icons (add your icons here)
    ├── icon16.png
    ├── icon48.png
    └── icon128.png
```

## Icons

You need to add icon files to the `icons/` directory:
- `icon16.png` (16x16 pixels)
- `icon48.png` (48x48 pixels)
- `icon128.png` (128x128 pixels)

You can create these using any image editor or use online tools to generate them.

## Development

### Prerequisites

- Google Chrome browser (latest version recommended)
- A code editor (VS Code, Sublime Text, etc.)

### Running in Development Mode

1. **Clone or download this repository**
   ```bash
   git clone <repository-url>
   cd Webify
   ```

2. **Add Extension Icons**
   - Add the required icon files to the `icons/` directory:
     - `icon16.png` (16x16 pixels)
     - `icon48.png` (48x48 pixels)
     - `icon128.png` (128x128 pixels)
   - See `icons/README.txt` for more details

3. **Load the Extension in Chrome**
   - Open Chrome and navigate to `chrome://extensions/`
   - Enable "Developer mode" (toggle in the top right corner)
   - Click "Load unpacked"
   - Select the project directory (`C:\Projects\Tools\Webify` or your project path)
   - The extension should now appear in your extensions list

4. **Development Workflow**
   - Make changes to the extension files (HTML, CSS, JS)
   - After making changes, go to `chrome://extensions/`
   - Click the refresh icon (↻) on the extension card to reload it
   - Test your changes by clicking the extension icon or visiting a Shopify store

5. **Debugging**
   - **Popup**: Right-click the extension icon → "Inspect popup"
   - **Settings Page**: Right-click on the settings page → "Inspect"
   - **Content Script**: Open DevTools on any Shopify page (F12)
   - **Background Script**: Go to `chrome://extensions/` → Click "service worker" link under the extension

6. **Testing Checklist**
   - Test adding a new project
   - Test project actions (Admin, Preview, View)
   - Test content script detection on Shopify URLs
   - Test deleting projects
   - Verify storage persistence after browser restart

### Technology Stack

The extension uses:
- Chrome Extension Manifest V3
- Chrome Storage API for data persistence
- Content Scripts for Shopify site detection
- Background Service Worker for message handling
- Vanilla JavaScript (no frameworks required)

## Deployment

### Preparing for Deployment

1. **Add Icons**
   - Ensure all required icon files are in the `icons/` directory
   - Icons should be properly sized and optimized

2. **Update Version**
   - Update the `version` field in `manifest.json` before each release
   - Follow semantic versioning (e.g., "1.0.0", "1.0.1", "1.1.0")

3. **Test Thoroughly**
   - Test all features in development mode
   - Test on different Shopify stores
   - Verify all buttons and actions work correctly
   - Check for console errors

4. **Create Distribution Package**
   - Remove any development files (if any)
   - Ensure all required files are present:
     - `manifest.json`
     - All HTML, CSS, and JS files
     - Icon files in `icons/` directory

### Deploying to Chrome Web Store

1. **Create a ZIP File**
   - Create a ZIP archive of the extension files
   - Include only necessary files (exclude `.git`, `README.md`, `implementations/` folder if desired)
   - Required files:
     ```
     manifest.json
     popup.html, popup.css, popup.js
     settings.html, settings.css, settings.js
     content.js
     background.js
     storage.js
     icons/icon16.png
     icons/icon48.png
     icons/icon128.png
     ```

2. **Prepare Store Assets**
   - Create promotional images (1280x800 or 640x400)
   - Write a detailed description
   - Prepare screenshots of the extension in action
   - Create a small promotional tile (440x280)

3. **Submit to Chrome Web Store**
   - Go to [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole)
   - Sign in with your Google account
   - Click "New Item" and upload your ZIP file
   - Fill in the required information:
     - Name, description, category
     - Upload screenshots and promotional images
     - Set pricing (free or paid)
     - Privacy practices
   - Submit for review

4. **Post-Submission**
   - Wait for review (typically 1-3 business days)
   - Address any feedback from reviewers
   - Once approved, your extension will be live in the Chrome Web Store

### Alternative: Manual Distribution

If you don't want to publish to Chrome Web Store:

1. **Create ZIP Package**
   - Follow step 1 from "Deploying to Chrome Web Store"

2. **Distribute ZIP File**
   - Share the ZIP file with users
   - Users can load it using "Load unpacked" in developer mode
   - Or they can extract and load the folder

3. **Enterprise Deployment**
   - For enterprise users, you can deploy via Group Policy
   - Or use Chrome Enterprise policies for automatic installation

### Version Management

- Update version in `manifest.json` for each release
- Consider maintaining a `CHANGELOG.md` for version history
- Tag releases in Git for tracking

## Permissions

- `storage`: To save and retrieve project data
- `tabs`: To open new tabs for admin/preview/view actions
- `activeTab`: To interact with the current tab
- `https://*.shopify.com/*`: To detect and interact with Shopify stores

