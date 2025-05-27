# Extract and Structure Web Content Using Content Script DOM Traversal for Tana API

## Overview
This document outlines the plan for implementing advanced markup parsing using content script DOM traversal to extract and structure web content for the Tana input API.

---

## 1. Setup & Dependencies
- Use the browser's native DOM API in content scripts for extraction and restructuring.
- **Use [Mozilla Readability](https://github.com/mozilla/readability) to extract the main content** from web pages.
- No need for Cheerio or server-side HTML parsing libraries.

## 2. Core Extraction Logic
- **Extract Main Content:** Use Readability in the content script to identify and extract the main article/content from the page.
- **Access Live DOM:** After extraction, use the DOM API to traverse and restructure the content as needed.

## 3. Content Extraction
- **Identify Main Content:**
  - Use Readability to extract the main content (removes sidebars, headers, footers, ads, and navs).
- **Structure Extraction:**
  - Traverse the extracted content, building a tree structure:
    - Headings (h1–h6) become parent nodes (not included in Tana output, just for structure).
    - Paragraphs, lists, and list items become children.
    - Lists are parent nodes with list items as children.
- **Inline Formatting:**
  - Preserve bold, italics, and links (convert to Tana-compatible formatting).
  - Ensure links are clickable (preserve hrefs).
- **Exclude Unwanted Elements:**
  - Remove all CSS, style tags, and scripts.

## 4. Tana API Formatting
- Map extracted structure to Tana's input API format.
- Implement chunking logic for large pages to respect Tana's API limits.

## 5. Testing & Validation
- Write unit tests for:
  - Main content extraction (using Readability)
  - Structure mapping
  - Formatting preservation
  - Chunking logic
- Test with a variety of real-world web pages.

## 6. Documentation
- Document extraction logic, structure, and configuration options.
- Reference the Tana input API and any limitations.

---

## References
- [Mozilla Readability](https://github.com/mozilla/readability)
- [Tana Input API](https://tana.inc/docs/input-api) 