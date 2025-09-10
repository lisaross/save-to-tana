# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

This is a **Chrome extension** that saves web page content to Tana using the Tana Input API. The extension:
- Extracts content from web pages (title, URL, author, description, main content)
- Structures data with Tana supertags and fields
- Sends content to Tana via their Input API for structured knowledge management

## Essential Development Commands

### Build and Development
```bash
# Development build with watch mode
npm run dev

# Production build
npm run build

# Complete package (build + copy static assets)
npm run package

# Clean build directory
npm run clean

# Copy static assets to dist/
npm run copy-assets
```

### Testing the Extension
1. Run `npm run package` to build the extension
2. Load the `dist/` folder as an unpacked extension in Chrome at `chrome://extensions/`
3. Enable "Developer mode" toggle first

## Architecture Overview

### Core Extension Components

- **Background Script** (`src/background.ts`) - Main API coordinator
  - Handles messages from popup/content scripts
  - Manages Tana API authentication and requests
  - Validates configuration and builds payloads

- **Content Script** (`src/content.ts`) - Page data extractor
  - Extracts metadata (title, author, description) from web pages
  - Captures main content using smart selectors (article > main > .main-content > body)
  - Implements content length limiting and text sanitization

- **Popup** (`src/popup.ts`) - User interface controller
  - Provides save interface with content inclusion options
  - Orchestrates content extraction and background communication
  - Handles error states and user feedback

- **Options** (`src/options.ts`) - Configuration management
  - Manages Tana API key, node IDs, and schema configuration
  - Parses Tana schema JSON to extract supertag and field IDs
  - Validates and saves extension settings

### Data Flow Architecture

1. **Configuration Setup**: User extracts schema from Tana node → Options page parses JSON → Stores API key, supertag ID, field IDs
2. **Content Capture**: Popup → Content script extracts page data → Returns structured data
3. **Tana Integration**: Background script builds Tana payload → Validates against schema → Sends to Tana Input API

### Key TypeScript Interfaces

Located in `src/types/index.ts`:
- `TanaConfig` - Extension configuration (API key, node IDs, field mappings)
- `SaveData` - Extracted web page content
- `TanaPayload` - Structured data for Tana API
- `TanaFieldIds` - Mapping of field names to Tana attribute IDs

### Utility Systems

- **Text Processing** (`src/utils/textUtils.ts`)
  - Content sanitization for API compatibility
  - Smart content chunking for large pages (4000 char limit per chunk)
- **Payload Builder** (`src/tanaPayloadBuilder.ts`)
  - Transforms extracted content into Tana API format
  - Handles field mapping and supertag application

## Code Quality Standards

### TypeScript Configuration
- Strict type checking enabled (`strict: true`)
- ES2022 target with ESNext modules
- Source maps enabled for debugging

### Linting and Formatting
- **Biome** for linting and formatting (configured in `biome.json`)
  - Single quotes preference
  - 2-space indentation, 100 character line width
  - Console logging allowed (extension debugging)
  - Explicit `any` types prohibited
  - **Never log API keys or secrets** - When logging configs, redact sensitive fields (e.g., `apiKey: '***'`)

### Build System
- **Vite** for modern bundling with TypeScript support
- Multi-entry build (background, content, popup, options)
- Chrome extension specific target (`chrome135`)
- Source maps and asset handling configured

## Extension-Specific Development Notes

### Chrome Extension Architecture
- Manifest V3 with service worker background script
- Content script injected into all URLs for content extraction
- Popup interface for user interaction
- Options page for configuration management

### Tana API Integration
- Uses Tana Input API endpoint: `https://europe-west1-tagr-prod.cloudfunctions.net/addToNodeV2`
- Requires Bearer token authentication
- Payload structure includes target node ID, supertags, and structured fields
- Content chunking handles large pages (100,000 char extraction limit, 4,000 char API chunks)

### Configuration Management
- Schema extraction from Tana workspace JSON payloads
- Field ID mapping for URL, Author, Description, Content attributes
- Chrome storage sync API for cross-device settings

### Content Extraction Strategy
- Prioritized selectors: `article` → `main` → `.main-content` → `body`
- Metadata extraction from various meta tags and schema.org markup
- Author detection from multiple sources (meta tags, bylines, schema markup)
- Description from OpenGraph, Twitter Cards, and standard meta tags

## Development Status Notes

This extension is currently **proof of concept** status with ongoing TypeScript refactoring. When working on improvements:

- Focus on site compatibility issues (content extraction varies by site)
- Consider adding Cheerio for more robust HTML parsing
- Test across various content types and website structures
- Validate Tana API payload structure against their latest schema requirements
