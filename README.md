# Save to Tana Chrome Extension

A Chrome extension that saves web page content to Tana with structured fields and tags using the Tana Input API.

![Save to Tana Demo](images/save-to-tana-hero.png)
*Save any web page to your Tana workspace with just one click*

## 📋 Table of Contents
- [🌟 Key Features](#-key-features)
- [🚧 Current Status](#-current-status)
- [🚀 Quick Start](#-quick-start)
- [⚙️ Installation Guide](#%EF%B8%8F-installation-guide)
- [🔧 Setup Instructions](#-setup-instructions)
- [📱 How to Use](#-how-to-use)
- [🛠️ Troubleshooting](#%EF%B8%8F-troubleshooting)
- [🔒 Privacy & Security](#-privacy--security)
- [👩‍💻 Developer Notes](#-developer-notes)

## 🌟 Key Features

- **One-click saving** - Save web page content to Tana with proper structure
- **Smart extraction** - Automatically extract metadata (title, URL, author, description)
- **Structured content** - Apply Tana tags and structured fields to saved content
- **Easy configuration** - Extract settings directly from your Tana workspace
- **Right-click access** - Quick configuration via context menu

## 🚧 Current Status

This extension is actively being improved! While it works well with many sites, we're continuously adding support for more websites and enhancing stability.

**Recent improvements:**
- ✅ Migrated to TypeScript for better reliability
- ✅ Added Cheerio for improved HTML parsing
- ✅ Enhanced page formatting and content extraction

Your feedback helps us prioritize improvements! Please [create an issue](https://github.com/lisaross/save-to-tana/issues) with your ideas or problems you encounter.

> **📥 Download:** Get the latest version from the [Releases page](https://github.com/lisaross/save-to-tana/releases)

## 🚀 Quick Start

**Setup time: ~5 minutes**

1. **Download** the extension from [Releases](https://github.com/lisaross/save-to-tana/releases)
2. **Install** in Chrome (see detailed steps below)
3. **Configure** with your Tana workspace
4. **Start saving** web pages to Tana!

> **💡 Before you start:** Make sure you have a Tana workspace and API access

## ⚙️ Installation Guide

### Step 1 of 3: Download and Prepare ⬜⬜⬜

1. **Download** the latest release ZIP from the [Releases page](https://github.com/lisaross/save-to-tana/releases)
2. **Unzip** the downloaded file to a folder on your computer
3. **Locate** the `dist` folder inside the unzipped directory

### Step 2 of 3: Install in Chrome ✅⬜⬜

1. **Open Chrome** and navigate to `chrome://extensions/`

![Chrome Extensions Page](images/chrome-extensions-page.png)
*Chrome extensions page showing Developer mode toggle and Load unpacked button*

2. **Enable "Developer mode"** by toggling the switch in the top right corner
3. **Click "Load unpacked"** and select the unzipped `dist` folder
4. **Verify installation** - the extension should now appear in your Chrome toolbar

![Extension Installed](images/extension-toolbar.png)
*Save to Tana extension icon appearing in Chrome toolbar*

### Step 3 of 3: Ready to Configure ✅✅⬜

> **✅ Success:** If you can see the Save to Tana icon in your toolbar, installation is complete!

Next, you'll need to configure the extension with your Tana workspace (see Setup Instructions below).

## 🔧 Setup Instructions

**Setup time: ~3 minutes**

> **💡 Tip:** Have your Tana workspace open in another tab during setup for easier switching between steps.

### Before You Begin

Ensure you have:
- [ ] A Tana workspace with API access
- [ ] The `#save-to-tana` supertag created in your workspace
- [ ] Your Tana API token ready

### Setup Progress: Step 1 of 3 ⬜⬜⬜

#### Extract Configuration from Tana

1. **Navigate** to your Tana workspace
2. **Find or create** a node with the `#save-to-tana` supertag

![Tana Node Setup](images/tana-node-setup.png)
*Tana workspace showing a node with #save-to-tana supertag and required fields*

3. **Extract configuration** using either method:
   - **Option A:** Click the info icon (ⓘ) next to the node
   - **Option B:** Right-click on the page and select "Extract Save to Tana Configuration"

![Extract Configuration](images/extract-config-button.png)
*Info icon button next to Tana node for extracting configuration*

4. **Verify** that the configuration is copied to your clipboard

> **✅ Success:** You should see a confirmation message that configuration was copied.

### Setup Progress: Step 2 of 3 ✅⬜⬜

#### Configure the Extension

1. **Open extension options** by right-clicking the extension icon and selecting "Options"

![Extension Options](images/extension-options.png)
*Extension options page showing configuration paste area and API token field*

2. **Navigate** to the "Paste Configuration" tab
3. **Paste** the copied configuration (Ctrl+V or Cmd+V)
4. **Click "Parse Configuration"** to extract the nodeIDs
5. **Enter your Tana API Token** in the provided field
6. **Click "Save Settings"** to store your configuration

> **✅ Success:** You should see "Configuration loaded successfully" message.

### Setup Progress: Step 3 of 3 ✅✅✅

#### Optional: Set Custom Target

1. **Set a custom target node ID** if you want to save content to a specific location in Tana
2. **Test the configuration** by trying to save a simple web page

> **🎉 Setup Complete!** You're now ready to start saving web pages to Tana.

## 📱 How to Use

### Basic Usage

1. **Navigate** to any web page you want to save to Tana
2. **Click** the Save to Tana extension icon in your Chrome toolbar

![Extension Popup](images/extension-popup.png)
*Save to Tana extension popup showing content selection options*

3. **Select** which content you want to include:
   - ✅ Page title
   - ✅ Page content
   - ✅ URL and metadata
4. **Click "Save to Tana"**

![Save Process](images/save-to-tana-demo.gif)
*Animated demonstration of saving web page content to Tana*

5. **Check your Tana workspace** - the content will be saved with proper structure, fields, and tags

![Tana Result](images/saved-content-tana.png)
*Saved web page content in Tana showing structured fields and supertag*

### What Gets Saved

When you save a page, the extension creates:
- **Main node** with the page title and `#save-to-tana` tag
- **URL field** with the web page address
- **Author field** (when available)
- **Description field** with page meta description
- **Content field** with the extracted page content

> **💡 Tip:** All nodeIDs are automatically extracted from your Tana workspace, so the structure matches your existing setup.

## 🛠️ Troubleshooting

### Common Issues

#### "Configuration not found" error
- **Check:** Have you completed the setup steps above?
- **Solution:** Re-extract configuration from your Tana node and paste it again
- **Verify:** Your API token is entered correctly

#### "Failed to save to Tana" error
- **Check:** Is your API token valid and not expired?
- **Solution:** Generate a new API token in Tana settings
- **Verify:** You have the `#save-to-tana` supertag in your workspace

#### Extension not appearing in toolbar
- **Check:** Is Developer mode enabled in Chrome extensions?
- **Solution:** Refresh the extensions page and reload the extension
- **Verify:** The `dist` folder was selected during installation

#### Content not extracting properly
- **Try:** Refreshing the page before saving content
- **Check:** Some sites may block content extraction for security reasons
- **Solution:** Try copying and pasting the content manually if automatic extraction fails

### Getting Help

If you continue to experience issues:

1. **Check** that all setup steps were completed in order
2. **Verify** your configuration in the extension options
3. **Try** saving content from a different website to test basic functionality
4. **Create an issue** on [GitHub](https://github.com/lisaross/save-to-tana/issues) with:
   - Description of the problem
   - Steps you've already tried
   - Example website where the issue occurs

## 🔒 Privacy & Security

Your data security is important to us:

- **Local processing** - All content is processed locally in your browser
- **Direct communication** - Data is sent directly to your Tana workspace only
- **No third parties** - No data is sent to any servers other than Tana
- **API token security** - Your API token is stored locally in your browser
- **Minimal permissions** - Extension only accesses the current page you're viewing

> **🔐 Security note:** Only use your API token with trusted extensions. Store it securely and regenerate it if you suspect it may be compromised.

## 👩‍💻 Developer Notes

### TypeScript Conversion & Build System

- The extension uses TypeScript 5.4+ with strict type checking
- Modular code organization and improved error handling
- Built with Vite for fast, modern bundling
- See below for project structure and build commands

### Project Structure

```
save-to-tana-ts/
├── dist/               # Compiled extension files (generated)
├── src/                # TypeScript source files
│   ├── background.ts   # Background script
│   ├── content.ts      # Content script
│   ├── options.ts      # Options page script
│   ├── popup.ts        # Popup script
│   ├── tanaPayloadBuilder.ts  # Tana payload builder
│   ├── types/          # TypeScript interfaces
│   │   └── index.ts    # Shared type definitions
│   └── utils/          # Utility functions
│       └── textUtils.ts # Text processing utilities
└── static/             # Static assets
    ├── images/         # Extension icons
    ├── manifest.json   # Extension manifest
    ├── options.html    # Options page HTML
    ├── popup.html      # Popup HTML
    └── style.css       # Shared styles
```

### Build Commands

- `npm run build` - Build the extension for production
- `npm run dev` - Build with watch mode for development
- `npm run package` - Build and copy static assets to dist/

### About the Tana Input API Integration

This extension uses the Tana Input API to create structured content in Tana:

- The page title becomes a node with the `#save-to-tana` supertag
- URL, Author, Description, and Content are added as proper fields
- All nodeIDs are automatically extracted from your Tana workspace

---

*Made with ❤️ for the Tana community*