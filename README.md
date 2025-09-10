# Save to Tana Chrome Extension

A Chrome extension that saves web page content to your Tana workspace using structured fields and the Tana Input API.

![Save to Tana Demo](images/save-to-tana-hero.png)
*Save any web page to your Tana workspace with just one click*

## 📋 Table of Contents
- [🌟 What it Does](#-what-it-does)
- [🚧 Current Status](#-current-status)
- [📥 Download & Install](#-download--install)
- [⚙️ Setup Guide](#%EF%B8%8F-setup-guide)
- [📱 How to Use](#-how-to-use)
- [🛠️ Troubleshooting](#%EF%B8%8F-troubleshooting)
- [🔒 Privacy & Security](#-privacy--security)
- [👩‍💻 Developer Notes](#-developer-notes)

## 🌟 What it Does

- **Extracts web page content** automatically (title, URL, author, description, main content)
- **Saves to Tana** using your custom supertag and field structure
- **Simple interface** with checkboxes to include/exclude content and title
- **Works with most websites** that have standard HTML structure

## 🚧 Current Status

This extension is actively being improved! While it works well with many sites, we're continuously adding support for more websites and enhancing stability.

**What works well:**
- ✅ Saves content from most news sites, blogs, and documentation
- ✅ Extracts metadata from standard meta tags
- ✅ Handles large content (automatically truncates at 100,000 characters)
- ✅ TypeScript codebase for reliability

**Known limitations:**
- ⚠️ Some sites may block content extraction for security reasons
- ⚠️ Dynamic content loaded by JavaScript may not be captured
- ⚠️ Complex layouts may not extract content cleanly

Your feedback helps us prioritize improvements! Please [create an issue](https://github.com/lisaross/save-to-tana/issues) with your ideas or problems you encounter.

> **📥 Download:** Get the latest version from the [Releases page](https://github.com/lisaross/save-to-tana/releases)

## 📥 Download & Install

### Step 1: Download
1. Go to the [Releases page](https://github.com/lisaross/save-to-tana/releases)
2. Download the latest ZIP file (e.g., `save-to-tana-v1.1.0.zip`)
3. Unzip the file to a folder on your computer

### Step 2: Install in Chrome
1. Open Chrome and go to `chrome://extensions/`

![Chrome Extensions Page](images/chrome-extensions-page.png)
*Chrome extensions page with Developer mode toggle*

2. Enable **"Developer mode"** using the toggle in the top right
3. Click **"Load unpacked"** and select the unzipped folder
4. The extension icon should appear in your Chrome toolbar

![Extension Installed](images/extension-toolbar.png)
*Save to Tana extension icon in Chrome toolbar*

> **✅ Success:** You should see the Save to Tana icon in your browser toolbar.

## ⚙️ Setup Guide

**Setup time: ~10 minutes**

> **💡 Important:** You need to create a specific supertag structure in Tana before configuring the extension.

### Step 1: Create Your Tana Supertag

1. **In your Tana workspace**, create a new supertag called `#save-to-tana`
2. **Add these 4 fields** to your supertag (exact names required):

![Tana Supertag Setup](images/tana-supertag-fields.png)
*Required fields for the #save-to-tana supertag*

**Required Fields:**
- **URL** (field type: URL)
- **Author** (field type: Text)
- **Description** (field type: Text)  
- **Content** (field type: Text)

> **⚠️ Important:** The field names must match exactly: `URL`, `Author`, `Description`, `Content`

### Step 2: Extract Schema Information

1. **Navigate** to your `#save-to-tana` supertag in Tana
2. **Press Cmd+K** (or Ctrl+K on Windows/Linux)
3. **Search for** and select **"Show API Schema"**
4. **Click** the **"Copy payload"** button

![Tana API Schema](images/tana-api-schema.png)
*Tana's Show API Schema feature with Copy payload button*

> **✅ Success:** The JSON schema should now be copied to your clipboard.

### Step 3: Configure the Extension

1. **Right-click** the extension icon and select **"Options"**

![Extension Options](images/extension-options.png)
*Save to Tana extension options page*

2. **Paste** the JSON schema in the "Paste Schema & Extract" section
3. **Click** "Extract Schema" - this will automatically fill in the field IDs
4. **Enter** your Tana API Token (get this from Tana Settings > API Tokens)
5. **Enter** your Target Node ID (where you want saved content to go):
   - Right-click any node in Tana
   - Select "Copy link"
   - The ID is the part after `nodeid=` in the URL
6. **Click** "Save Options"

![Configuration Complete](images/configuration-complete.png)
*Successfully configured extension showing all required fields*

> **🎉 Setup Complete!** You're now ready to save web pages to Tana.

## 📱 How to Use

### Saving a Web Page

1. **Navigate** to any web page you want to save
2. **Click** the Save to Tana extension icon

![Extension Popup](images/extension-popup.png)
*Save to Tana popup with content options*

3. **Choose** what to include:
   - ✅ **Include page content** - Main article/page text
   - ✅ **Include page title** - Use page title (unchecked = uses URL as title)
4. **Click** "Save to Tana"

![Save Success](images/save-success.png)
*Success message after saving content*

### What Gets Saved

The extension creates a new node in your target location with:

![Saved Content Result](images/saved-content-tana.png)
*Example of saved content in Tana with all fields populated*

- **Node title** - Page title (or URL if title unchecked)
- **#save-to-tana** supertag applied
- **URL field** - Link to the original page
- **Author field** - Extracted from meta tags (when available)
- **Description field** - Page meta description (when available)
- **Content field** - Main page content (when "Include page content" is checked)

## 🛠️ Troubleshooting

### Common Issues

#### "Extension not fully configured" message
- **Check:** Have you completed all setup steps?
- **Solution:** Go to Options and verify all fields are filled in
- **Verify:** API token is valid and not expired

#### "Failed to save to Tana" error
- **Check:** Is your Target Node ID correct?
- **Solution:** Copy a fresh node link from Tana and extract the ID
- **Verify:** Your API token has the necessary permissions

#### No content extracted from page
- **Try:** Refreshing the page before clicking the extension
- **Check:** Some sites block content extraction for security
- **Alternative:** Manually copy-paste important content

#### Extension not responding
- **Solution:** Reload the extension in `chrome://extensions/`
- **Check:** Make sure the extension is enabled
- **Try:** Restarting Chrome if issues persist

### Getting Help

If you need assistance:
1. Check that your Tana supertag has all 4 required fields
2. Verify your configuration in the extension options  
3. Test with a simple website (like a news article)
4. [Create an issue](https://github.com/lisaross/save-to-tana/issues) with:
   - Description of the problem
   - Steps you've tried
   - Example website where the issue occurs

## 🔒 Privacy & Security

Your data security is important:

- **Local processing** - All content extraction happens in your browser
- **Direct to Tana** - Data goes directly to your Tana workspace only
- **No third parties** - No data is sent to any other servers
- **API token storage** - Stored securely in Chrome's local storage
- **Minimal permissions** - Extension only accesses the current tab

> **🔐 Security tip:** Only install extensions from trusted sources. Your API token is sensitive - regenerate it if you suspect it may be compromised.

---

## 👩‍💻 Developer Notes

### Technical Stack
- **TypeScript 5.4+** for type safety and better development experience
- **Vite** for fast, modern bundling and development
- **Chrome Extension Manifest V3** for security and performance
- **No external dependencies** - uses only browser and Chrome APIs

### Project Structure
```
save-to-tana/
├── dist/                 # Built extension files
├── src/                  # TypeScript source
│   ├── background.ts     # Service worker for API calls
│   ├── content.ts        # Content extraction script
│   ├── options.ts        # Options page functionality  
│   ├── popup.ts          # Popup interface
│   ├── tanaPayloadBuilder.ts # Tana API payload construction
│   ├── types/index.ts    # TypeScript type definitions
│   └── utils/textUtils.ts # Text processing utilities
└── static/               # Static assets
    ├── images/           # Extension icons
    ├── manifest.json     # Extension manifest
    ├── options.html      # Options page
    ├── popup.html        # Popup interface
    └── style.css         # Shared styles
```

### Development Commands
- `npm run build` - Build for production
- `npm run dev` - Build with watch mode
- `npm run package` - Build and copy static assets

### Content Extraction Logic
The extension uses a priority-based approach to extract main content:
1. `<article>` elements (highest priority)
2. `<main>` elements  
3. `.main-content` class elements
4. `<body>` element (fallback)

Author extraction attempts multiple meta tag formats:
- `meta[name="author"]`
- `meta[property="article:author"]` 
- `meta[name="twitter:creator"]`
- Schema.org structured data
- Common byline CSS classes

### Tana API Integration
The extension constructs payloads for the Tana Input API using:
- **Target Node ID** - Where content is saved
- **Supertag ID** - Applied to created nodes
- **Field Attribute IDs** - For structured field data

Content is automatically sanitized and truncated at 100,000 characters to prevent API errors.

---

*Built by [Lisa Ross](https://github.com/lisaross) for the Tana community • Not an official Tana product*