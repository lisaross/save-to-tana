# Extract and Structure Web Content Using Content Script DOM Traversal for Tana API

## Overview
This document outlines the plan for implementing advanced markup parsing using content script DOM traversal to extract and structure web content for the Tana input API.

---

## 1. Setup & Dependencies
- Use the browser's native DOM API in content scripts for extraction.
- No need for Cheerio or server-side HTML parsing libraries.

## 2. Core Extraction Logic
- **Access Live DOM:** Use a content script to traverse the current page's DOM.

## 3. Content Extraction
- **Identify Main Content:**
  - Use heuristics (e.g., look for <main>, <article>, or largest <div> with text).
  - Exclude sidebars, headers, footers, ads, and navs.
- **Structure Extraction:**
  - Traverse main content, building a tree structure:
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
  - Main content extraction
  - Structure mapping
  - Formatting preservation
  - Chunking logic
- Test with a variety of real-world web pages.

## 6. Documentation
- Document extraction logic, structure, and configuration options.
- Reference the Tana input API and any limitations.

---

## References
- [Tana Input API](https://tana.inc/docs/input-api) 