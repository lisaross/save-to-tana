# Save to Tana Chrome Extension

A Chrome extension that allows you to save web page content and URLs to your Tana workspace.

## Features

- Save the current web page's URL and content to Tana
- Configure which content to save (title, page content)
- Simple and intuitive user interface
- Respects Tana API limits (5000 character payload limit)
- Provides clear feedback on success or failure

## Installation Instructions

1. Download and unzip the `save-to-tana.zip` file
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" by toggling the switch in the top right corner
4. Click "Load unpacked" and select the unzipped `save-to-tana` folder
5. The extension should now appear in your Chrome toolbar

## Configuration

Before using the extension, you need to configure your Tana API Token and Target Node ID:

1. Click on the extension icon in your Chrome toolbar
2. Click "Configure API Key and Node ID" at the bottom of the popup
3. Enter your Tana API Token and Target Node ID
4. Click "Save Options"

### How to get your Tana API Token

1. In the lower left corner of Tana, go to **Settings** > **API Tokens**
2. Select which workspace you want to create a token for, and click **Create token**
3. Click **Copy** to copy the token you just created

### How to get your Target Node ID

1. In Tana, navigate to your Inbox or any node where you want to save content
2. Right-click on the node and select **Copy link**
3. The Node ID is the part after `nodeid=` in the URL
4. Example: From `https://app.tana.inc?nodeid=z-p8LdQk6I76`, the Node ID is `z-p8LdQk6I76`
5. Alternatively, you can use `INBOX` to save to your Inbox

## Usage

1. Navigate to any web page you want to save to Tana
2. Click the Save to Tana extension icon in your Chrome toolbar
3. Select which content you want to include (page title, content)
4. Click "Save to Tana"
5. The extension will save the content to your specified Tana node

## API Limitations

The Tana Input API has the following limitations:

- 5000 character payload limit per call
- Maximum of 100 nodes created per call
- One call per second per token
- Will not sync on workspaces with more than 750k nodes

The extension automatically truncates content to stay within these limits.

## Troubleshooting

If you encounter issues:

1. Ensure your API Token and Node ID are correctly configured
2. Check that your Tana workspace has fewer than 750k nodes
3. Verify your internet connection
4. Try refreshing the page before saving

## Privacy

This extension stores your Tana API Token and Node ID locally in your browser's storage. This information is only used to authenticate with Tana's API and is never sent to any other servers.
