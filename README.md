> **⚠️ This extension is a proof of concept and not fully ready for general use.**
> 
> Some sites work, some sites don't. I'm actively working to make it more stable and useful:
> - Refactoring to TypeScript
> - Adding Cheerio for better HTML parsing
> - Improving page formatting and extraction
> 
> Please [create an issue](https://github.com/lisaross/save-to-tana/issues) with your ideas or problems you encounter!
>
> **Download:**
> Get the latest version of the extension from the [Releases page](https://github.com/lisaross/save-to-tana/releases). Download the ZIP file and load it in Chrome as described below.

# Save to Tana Chrome Extension

A Chrome extension that saves web page content to Tana with structured fields and supertags using the Tana Input API.

## Features

- Save web page content to Tana with proper structure
- Automatically extract metadata (title, URL, author, description)
- Apply supertags and structured fields to saved content
- Extract configuration directly from your Tana nodes
- Right-click context menu for easy configuration

## Installation Instructions

1. Download and unzip the latest release ZIP from the [Releases page](https://github.com/lisaross/save-to-tana/releases)
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" by toggling the switch in the top right corner
4. Click "Load unpacked" and select the unzipped `dist` folder
5. The extension should now appear in your Chrome toolbar

## Setup Instructions

1. **Extract Configuration from Tana**:
   - Navigate to your Tana node with the #save-to-tana supertag
   - Either:
     - Click the extraction button that appears next to the node (info icon), or
     - Right-click on the page and select "Extract Save to Tana Configuration"
   - The configuration will be copied to your clipboard

2. **Configure the Extension**:
   - Open the extension options by right-clicking the extension icon and selecting "Options"
   - In the "Paste Configuration" tab, paste the copied configuration
   - Click "Parse Configuration" to extract the nodeIDs
   - Enter your Tana API Token
   - Click "Save Settings" to store your configuration

3. **Optional**: Set a custom target node ID if you want to save content to a specific location in Tana

## How to Use

1. Navigate to any web page you want to save to Tana
2. Click the Save to Tana extension icon in your Chrome toolbar
3. Select which content you want to include (page title, content)
4. Click "Save to Tana"
5. The content will be saved to Tana with the proper structure, fields, and supertag

## About the Tana Input API Integration

This extension uses the Tana Input API to create structured content in Tana:

- The page title becomes a node with the #save-to-tana supertag
- URL, Author, Description, and Content are added as proper fields
- All nodeIDs are automatically extracted from your Tana workspace

## Troubleshooting

If you encounter issues:

1. Make sure you've extracted and pasted the configuration from your Tana node
2. Check that your API token is correct
3. Ensure you have the #save-to-tana supertag and fields in your Tana workspace
4. Try refreshing the page before saving content
5. Check the extension options to ensure all nodeIDs were properly extracted

## Privacy

This extension only accesses the current page you're viewing and communicates with Tana using your API token. All data is processed locally in your browser and sent directly to your Tana workspace. No data is sent to any third-party servers.

---

## Developer Notes

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
