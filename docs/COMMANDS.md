# Extension Commands

The Save to Tana extension now supports keyboard shortcuts for common actions.

## Available Commands

### Reload Extension
- **Shortcut**: `Ctrl+Shift+E` (Windows/Linux) or `Cmd+Shift+E` (Mac)
- **Description**: Quickly reload the extension during development
- **Action**: Closes all extension pages and reloads the extension

### Open Popup
- **Shortcut**: `Ctrl+Shift+S` (Windows/Linux) or `Cmd+Shift+S` (Mac)  
- **Description**: Open the Save to Tana popup from any page
- **Action**: Opens the extension popup, or falls back to opening popup.html in a new tab

## Node ID URL Support

The extension now supports **both** node IDs and full Tana URLs in the Target Node ID field:

### Supported Formats
- **Direct Node ID**: `d1RDBb0x1IdR_CAPTURE_INBOX`
- **Full Tana URL**: `https://app.tana.inc?nodeid=d1RDBb0x1IdR_CAPTURE_INBOX`
- **URL with @ prefix**: `@https://app.tana.inc?nodeid=d1RDBb0x1IdR_CAPTURE_INBOX`

### How It Works
- The extension automatically extracts the node ID from URLs
- Both formats work seamlessly in the configuration
- Validation ensures only valid Tana node IDs are accepted
- Helpful error messages guide you to the correct format

## How to Use

1. **Install/Load the extension** in Chrome
2. **Set up shortcuts** (optional):
   - Go to `chrome://extensions/shortcuts`
   - Find "Save to Tana" extension
   - Customize the keyboard shortcuts if desired
3. **Use the shortcuts**:
   - Press `Ctrl+Shift+E` (or `Cmd+Shift+E` on Mac) to reload during development
   - Press `Ctrl+Shift+S` (or `Cmd+Shift+S` on Mac) to open the popup from any page

## Development Notes

- Commands are handled by the service worker (`background.ts`)
- The reload command safely closes extension pages before reloading
- Useful for rapid development iteration without manual extension management

## Troubleshooting

- If shortcuts don't work, check `chrome://extensions/shortcuts` to ensure they're enabled
- If the popup shortcut fails, it will fallback to opening the popup in a new tab
- Check the console for any error messages if commands aren't working as expected 