# Save to Tana Chrome Extension

A Chrome extension that saves web page content directly to your Tana workspace with just one click. Extract structured information from articles, blog posts, and documentation automatically.

![Save to Tana Demo](images/save-to-tana-hero.png)
*Save any web page to your Tana workspace with structured fields*

## 📋 What You'll Need Before Starting

> **⚠️ Important:** You must create a specific supertag structure in Tana before installing the extension.

## 🏗️ Step 1: Create Your Tana Supertag (Required)

**Before installing the extension**, you need to set up a supertag in your Tana workspace:

### Create the Supertag
1. In your Tana workspace, create a new supertag called `#save-to-tana`
2. Add these **4 required fields** to your supertag (exact names required):

![Tana Supertag Setup](images/tana-supertag-fields.png)
*Required fields for the #save-to-tana supertag*

**Required Fields:**
- **URL** (field type: URL)
- **Author** (field type: Text)
- **Description** (field type: Text)  
- **Content** (field type: Text)

> **⚠️ Critical:** The field names must match exactly: `URL`, `Author`, `Description`, `Content`

### Get Your API Schema
1. Navigate to your `#save-to-tana` supertag in Tana
2. Press **Cmd+K** (or Ctrl+K on Windows/Linux)
3. Search for and select **"Show API Schema"**
4. Click the **"Copy payload"** button

![Tana API Schema](images/tana-api-schema.png)
*Tana's Show API Schema feature with Copy payload button*

Keep this copied - you'll need it in Step 3!

## 📥 Step 2: Download & Install Extension

### Download
1. Go to the [Releases page](https://github.com/lisaross/save-to-tana/releases)
2. Download the latest ZIP file (e.g., `save-to-tana-v1.1.0.zip`)
3. Unzip the file to a folder on your computer

### Install in Chrome
1. Open Chrome and go to `chrome://extensions/`

![Chrome Extensions Page](images/chrome-extensions-page.png)
*Chrome extensions page with Developer mode toggle*

2. Enable **"Developer mode"** using the toggle in the top right
3. Click **"Load unpacked"** and select the unzipped `dist` folder
4. The extension icon should appear in your Chrome toolbar

![Extension Installed](images/extension-toolbar.png)
*Save to Tana extension icon in Chrome toolbar*

> **✅ Success:** You should see the Save to Tana icon in your browser toolbar.

## ⚙️ Step 3: Configure the Extension

**Setup time: ~5 minutes**

### Get Your Tana API Token
1. In Tana, go to **Settings > API Tokens**
2. Create a new token for the extension
3. Copy the token (keep it safe!)

### Configure Extension Settings
1. **Right-click** the extension icon and select **"Options"**

![Extension Options](images/extension-options.png)
*Save to Tana extension options page*

2. **Paste** the JSON schema from Step 1 in the "Paste Schema & Extract" section
3. **Click** "Extract Schema" - this will automatically fill in the field IDs
4. **Enter** your Tana API Token from above
5. **Enter** your Target Node ID (where you want saved content to go):
   - Right-click any node in Tana
   - Select "Copy link"  
   - The ID is the part after `nodeid=` in the URL
6. **Click** "Save Options"

![Configuration Complete](images/configuration-complete.png)
*Successfully configured extension showing all required fields*

> **🎉 Setup Complete!** You're now ready to save web pages to Tana.

## 📱 How to Use

### 🖱️ Method 1: Extension Popup (Simple)

1. **Navigate** to any web page you want to save
2. **Click** the Save to Tana extension icon in your toolbar

![Extension Popup](images/extension-popup.png)
*Save to Tana popup with content options*

3. **Choose** what to include:
   - ✅ **Include page content** - Main article/page text
   - ✅ **Include page title** - Use page title (unchecked = uses URL as title)
4. **Click** "Save to Tana"

![Save Success](images/save-success.png)
*Success message after saving content*

### ⚡ Method 2: Keyboard Shortcuts (Fastest)
- **Quick Save**: `Alt+Shift+T` (Windows/Linux) or `Cmd+Shift+S` (Mac)
- **Save with Notes**: `Alt+Shift+N` (Windows/Linux) or `Cmd+Shift+N` (Mac)

### 🔍 Method 3: Address Bar (Omnibox)
1. Click in the browser address bar
2. Type `tana` followed by a space
3. Enter optional notes or custom title
4. Press Enter to save

### 📋 Method 4: Right-Click Menus
- **Right-click on any webpage**: Choose "Save page to Tana"
- **Right-click on selected text**: Choose "Save selection to Tana"
- **Add notes**: Choose "Save with notes" options for custom annotations

### 💬 Method 5: Quick Capture Overlay
When using "save with notes" options, an overlay appears where you can:
- Preview what's being saved (title and URL)
- Add personal notes before saving
- Use keyboard shortcuts (`Ctrl/Cmd+Enter` to save, `Escape` to cancel)

## 📄 What Gets Saved

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
- **Alternative:** Use "Save selection" to manually select content

#### Extension not responding
- **Solution:** Reload the extension in `chrome://extensions/`
- **Check:** Make sure the extension is enabled
- **Try:** Restarting Chrome if issues persist

### Getting Help

If you need assistance:
1. Verify your Tana supertag has all 4 required fields with exact names
2. Test with a simple website (like a news article)
3. Check the browser console for error messages
4. [Create an issue](https://github.com/lisaross/save-to-tana/issues) with:
   - Description of the problem
   - Steps you've tried
   - Example website where the issue occurs

## 🚧 Current Status

This extension works well with most websites! While we're continuously improving compatibility and adding features, here's what you can expect:

**What works great:**
- ✅ News sites, blogs, and documentation
- ✅ Standard article and content pages
- ✅ Metadata extraction from most sites
- ✅ Large content handling (auto-truncated at 100,000 characters)
- ✅ Multiple save methods and user-friendly interface

**Known limitations:**
- ⚠️ Some sites may block content extraction for security reasons
- ⚠️ Dynamic content loaded by JavaScript may not be captured
- ⚠️ Complex layouts may not extract content cleanly

Your feedback helps us improve! Please [share your experience](https://github.com/lisaross/save-to-tana/issues).

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
- **TypeScript 5.4+** for type safety and modern development
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

Author extraction attempts multiple meta tag formats and Schema.org structured data.

### Tana API Integration
The extension constructs payloads for the Tana Input API using target node IDs, supertag IDs, and field attribute IDs. Content is automatically sanitized and truncated at 100,000 characters to prevent API errors.

---

*Built by [Lisa Ross](https://github.com/lisaross) for the Tana community • Not an official Tana product*
