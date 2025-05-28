# Payload Chunking Solution for Tana API Limits

## Problem

The Tana Input API has strict limits:
- **5000 characters** maximum payload size
- **100 nodes** maximum per API call  
- **1 call per second** rate limit

When extracting content from large web pages, the hierarchical content structure created payloads that exceeded these limits, causing API calls to fail.

## Solution Overview

We implemented an intelligent payload chunking system that:

1. **Measures payload size** in real-time during chunking
2. **Splits large content** while preserving hierarchical structure
3. **Sends multiple API calls** sequentially with rate limiting
4. **Provides user feedback** about chunking progress

## Implementation Details

### Core Components

1. **`src/utils/payloadChunker.ts`** - Main chunking logic
2. **`src/background.ts`** - Updated to handle multiple API calls
3. **`src/popup.ts`** - Updated to show chunking feedback

### Key Features

- **Size-aware chunking**: Tests payload size before adding content
- **Hierarchical preservation**: Maintains content structure within chunks
- **Automatic naming**: Adds "(Part X/Y)" suffixes to chunked content
- **Rate limiting**: 1-second delays between API calls
- **Progress feedback**: Shows users when content is split into parts

### Configuration

```typescript
const DEFAULT_CHUNK_CONFIG = {
  maxPayloadSize: 4500,      // Buffer under 5000 char limit
  maxNodesPerChunk: 90,      // Buffer under 100 node limit  
  maxChildrenPerNode: 50     // Prevents overly deep structures
};
```

## How It Works

1. **Initial check**: If payload is under limits, send as-is
2. **Content separation**: Separate field nodes from content nodes
3. **Hierarchical chunking**: Split content while preserving structure
4. **Size validation**: Test each chunk against limits
5. **Sequential sending**: Send chunks with 1-second delays
6. **Response aggregation**: Combine all responses

## Example Results

For a test article with 90,213 characters:
- **Original**: 1 payload (exceeds limits)
- **After chunking**: 40 payloads (all within limits)
- **Average chunk size**: 2,427 characters
- **User feedback**: "Saved to Tana successfully! (Split into 40 parts due to size)"

## Benefits

- ✅ **Respects API limits**: All chunks stay within Tana's constraints
- ✅ **Preserves structure**: Hierarchical content organization maintained
- ✅ **User transparency**: Clear feedback about chunking process
- ✅ **Graceful degradation**: Handles any content size
- ✅ **Rate limit compliance**: Automatic 1-second delays

## Usage

The chunking happens automatically when saving large content. Users will see feedback like:

- Small content: "Saved to Tana successfully!"  
- Large content: "Saved to Tana successfully! (Split into 5 parts due to size)"

No additional user configuration required - the system handles everything automatically.

## Technical Notes

- The chunking algorithm prioritizes keeping content together when possible
- Field metadata (URL, Author, Description) is only included in the first chunk
- Content parts are clearly labeled with part numbers for easy organization
- All chunks are sent sequentially to respect Tana's rate limiting 