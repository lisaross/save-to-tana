import type { TanaNode, TanaNodeChild, TanaNodeChildContent } from '../types/index';
import { Readability } from '@mozilla/readability';
import { sanitizeText } from './textUtils';

/**
 * Extracts content from a DOM Document using structural sections as natural separators.
 * Does NOT use headings for organization - organizes by larger structural elements instead.
 * Creates single nodes for each major section, respecting Tana API constraints.
 * @param doc - The DOM Document to extract content from
 * @returns Array of TanaNode objects ready for the Tana input API
 */
export function extractContentForTana(doc: Document): TanaNode[] {
  // Tana API constraints
  const MAX_NODE_NAME_LENGTH = 800; // Increased for content with links
  const MAX_NODE_CONTENT_LENGTH = 2000; // Increased for better content preservation
  const MAX_SECTIONS = 50; // Limit sections to stay under 100 node limit (with children)
  
  // Use the correct Node/Element constructors for the environment
  const NodeCtor = doc.defaultView?.Node;
  const ElementCtor = doc.defaultView?.Element;

  // Helper to get formatted text with inline formatting
  function getFormattedText(node: any): string {
    if (NodeCtor && node instanceof NodeCtor && node.nodeType === NodeCtor.TEXT_NODE) {
      return node.textContent || '';
    }
    if (!(ElementCtor && node instanceof ElementCtor)) {
      return '';
    }
    switch (node.tagName) {
      case 'A': {
        const href = (node as HTMLAnchorElement).href;
        const text = Array.from(node.childNodes).map(getFormattedText).join('');
        return `[${text}](${href})`;
      }
      case 'STRONG':
      case 'B': {
        const text = Array.from(node.childNodes).map(getFormattedText).join('');
        return `**${text}**`;
      }
      case 'EM':
      case 'I': {
        const text = Array.from(node.childNodes).map(getFormattedText).join('');
        return `*${text}*`;
      }
      default: {
        return Array.from(node.childNodes).map(getFormattedText).join('');
      }
    }
  }

  // Helper to sanitize node names for Tana API (remove newlines, collapse whitespace, limit length)
  function sanitizeNodeName(name: string, maxLength: number = MAX_NODE_NAME_LENGTH): string {
    const sanitized = sanitizeText(name);
    if (sanitized.length <= maxLength) {
      return sanitized;
    }
    
    // Check if the content contains URLs or markdown links - be more generous with length
    const hasLinks = sanitized.includes('](') || sanitized.includes('http');
    if (hasLinks) {
      // For content with links, try to preserve the full link if possible
      const linkMatch = sanitized.match(/\[([^\]]+)\]\(([^)]+)\)/);
      if (linkMatch && linkMatch[0].length < maxLength) {
        // Try to include the full link and some surrounding context
        const linkStart = sanitized.indexOf(linkMatch[0]);
        const beforeLink = sanitized.substring(0, linkStart);
        const afterLink = sanitized.substring(linkStart + linkMatch[0].length);
        
        const availableSpace = maxLength - linkMatch[0].length;
        const beforeTruncated = beforeLink.length > availableSpace / 2 
          ? beforeLink.substring(0, Math.floor(availableSpace / 2)) + '...'
          : beforeLink;
        const afterTruncated = afterLink.length > availableSpace / 2
          ? '...' + afterLink.substring(afterLink.length - Math.floor(availableSpace / 2))
          : afterLink;
        
        return (beforeTruncated + linkMatch[0] + afterTruncated).trim();
      }
    }
    
    // Try to truncate at sentence boundary first
    const sentences = sanitized.match(/[^.!?]+[.!?]+/g);
    if (sentences && sentences.length > 1) {
      let truncated = '';
      for (const sentence of sentences) {
        if ((truncated + sentence).length <= maxLength) {
          truncated += sentence;
        } else {
          break;
        }
      }
      if (truncated.length > maxLength * 0.5) {
        return truncated.trim();
      }
    }
    
    // Truncate at word boundary if possible
    const truncated = sanitized.substring(0, maxLength);
    const lastSpace = truncated.lastIndexOf(' ');
    if (lastSpace > maxLength * 0.7) { // Only use word boundary if it's not too short
      return truncated.substring(0, lastSpace) + '...';
    }
    
    return truncated + '...';
  }

  // Helper to split long content into manageable chunks
  function splitContentIntoChunks(content: string, maxLength: number = MAX_NODE_CONTENT_LENGTH): string[] {
    if (content.length <= maxLength) {
      return [content];
    }
    
    const chunks: string[] = [];
    const sentences = content.match(/[^.!?]+[.!?]+/g) || [content];
    let currentChunk = '';
    
    for (const sentence of sentences) {
      const trimmedSentence = sentence.trim();
      if (!trimmedSentence) continue;
      
      if ((currentChunk + ' ' + trimmedSentence).length > maxLength) {
        if (currentChunk) {
          chunks.push(currentChunk.trim());
          currentChunk = '';
        }
        
        // If single sentence is too long, split it carefully to preserve links
        if (trimmedSentence.length > maxLength) {
          const linkMatches = Array.from(trimmedSentence.matchAll(/\[([^\]]+)\]\(([^)]+)\)/g));
          if (linkMatches.length > 0) {
            // Try to keep links intact when splitting
            let remaining = trimmedSentence;
            while (remaining.length > maxLength) {
              let splitPoint = maxLength;
              // Look for a safe split point that doesn't break links
              for (const match of linkMatches) {
                const linkStart = remaining.indexOf(match[0]);
                const linkEnd = linkStart + match[0].length;
                if (linkStart < maxLength && linkEnd > maxLength) {
                  // Link would be split, move split point before the link
                  splitPoint = Math.max(linkStart - 1, maxLength / 2);
                  break;
                }
              }
              const chunk = remaining.substring(0, splitPoint);
              chunks.push(chunk + (splitPoint < remaining.length ? '...' : ''));
              remaining = remaining.substring(splitPoint);
            }
            if (remaining.trim()) {
              chunks.push(remaining.trim());
            }
          } else {
            // No links, split normally
            for (let i = 0; i < trimmedSentence.length; i += maxLength) {
              const chunk = trimmedSentence.slice(i, i + maxLength);
              chunks.push(chunk + (i + maxLength < trimmedSentence.length ? '...' : ''));
            }
          }
        } else {
          currentChunk = trimmedSentence;
        }
      } else {
        currentChunk += (currentChunk ? ' ' : '') + trimmedSentence;
      }
    }
    
    if (currentChunk.trim()) {
      chunks.push(currentChunk.trim());
    }
    
    return chunks.length > 0 ? chunks : [content.substring(0, maxLength) + '...'];
  }

  // Helper to check if element should be excluded (navigation, sidebars, footers, etc.)
  function shouldExcludeElement(element: Element): boolean {
    const tagName = element.tagName.toLowerCase();
    const className = element.className || '';
    const id = element.id || '';
    const role = element.getAttribute('role') || '';
    
    // Skip non-content elements
    if (['script', 'style', 'noscript', 'head', 'meta', 'link'].includes(tagName)) {
      return true;
    }
    
    // Skip navigation elements
    if (tagName === 'nav' || role === 'navigation') {
      return true;
    }
    
    // Skip elements with navigation-related classes/IDs
    const navPatterns = [
      'nav', 'navigation', 'menu', 'header', 'footer', 'sidebar', 'aside',
      'breadcrumb', 'toolbar', 'topbar', 'bottombar', 'social', 'share',
      'cookie', 'banner', 'popup', 'modal', 'overlay', 'fixed', 'sticky',
      'advertisement', 'ads', 'promo'
    ];
    
    const elementText = (className + ' ' + id).toLowerCase();
    if (navPatterns.some(pattern => elementText.includes(pattern))) {
      return true;
    }
    
    // Skip elements that are positioned outside the main flow
    const style = element.getAttribute('style') || '';
    if (style.includes('position: fixed') || style.includes('position: absolute')) {
      return true;
    }
    
    // Skip hidden elements
    if (style.includes('display: none') || style.includes('visibility: hidden')) {
      return true;
    }
    
    return false;
  }

  // Helper to check if element is a main structural section (NO HEADING LOGIC)
  function isContentSection(element: Element): boolean {
    const tagName = element.tagName.toLowerCase();
    const className = element.className || '';
    const id = element.id || '';
    
    // Primary structural elements that typically contain content
    if (['section', 'article', 'main', 'div', 'p', 'ul', 'ol', 'blockquote', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(tagName)) {
      // For paragraphs, lists, blockquotes, and headings, they're always content sections
      if (['p', 'ul', 'ol', 'blockquote', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(tagName)) {
        return true;
      }
      
      // For structural elements, check if they have meaningful content indicators
      const contentIndicators = [
        'content', 'text', 'body', 'article', 'section', 'block', 'panel', 
        'card', 'item', 'feature', 'intro', 'description', 'summary'
      ];
      
      const elementText = (className + ' ' + id).toLowerCase();
      const hasContentClass = contentIndicators.some(indicator => 
        elementText.includes(indicator)
      );
      
      // Also consider divs that are direct children of body or main containers
      const isTopLevelDiv = tagName === 'div' && (
        element.parentElement?.tagName.toLowerCase() === 'body' ||
        element.parentElement?.tagName.toLowerCase() === 'main' ||
        element.parentElement?.className.includes('container') ||
        element.parentElement?.className.includes('wrapper') ||
        element.parentElement?.className.includes('content')
      );
      
      return hasContentClass || isTopLevelDiv || ['section', 'article', 'main'].includes(tagName);
    }
    
    return false;
  }

  // Helper to extract clean content from a section (NO HEADING EXTRACTION)
  function extractSectionContent(section: Element): string {
    // Clone the section to avoid modifying the original
    const sectionClone = section.cloneNode(true) as Element;
    
    // Remove navigation and excluded elements
    const excludedElements = sectionClone.querySelectorAll('nav, .nav, .navigation, .menu, .breadcrumb, .social, .share, script, style');
    for (const el of Array.from(excludedElements)) {
      el.remove();
    }
    
    // Get text content and clean it up
    let text = '';
    for (const child of Array.from(sectionClone.childNodes)) {
      if (child.nodeType === (NodeCtor?.TEXT_NODE || 3)) {
        text += child.textContent || '';
      } else if (child.nodeType === (NodeCtor?.ELEMENT_NODE || 1)) {
        const childEl = child as Element;
        text += getFormattedText(childEl);
      }
    }
    
    return sanitizeText(text);
  }

  // Try to get main content area first
  let main: HTMLElement | null = null;
  
  try {
    // Look for main content area
    main = doc.querySelector('main') || 
           doc.querySelector('[role="main"]') || 
           doc.querySelector('.main-content') ||
           doc.querySelector('#main-content') ||
           doc.querySelector('.content') ||
           doc.body;
  } catch (e) {
    main = doc.body;
  }
  
  if (!main) return [];

  // Find all content sections within the main area (NO HEADING-BASED ORGANIZATION)
  const contentSections: Array<{ element: Element; content: string }> = [];
  const processedElements = new Set<Element>();

  function findContentSections(container: Element) {
    for (const child of Array.from(container.children)) {
      if (processedElements.has(child) || shouldExcludeElement(child)) {
        continue;
      }

      if (isContentSection(child)) {
        const content = extractSectionContent(child);
        
        // Only include sections with meaningful content
        if (content.length > 10 && content.length < 8000) {
          contentSections.push({
            element: child,
            content
          });
          processedElements.add(child);
          
          // Stop if we have enough sections
          if (contentSections.length >= MAX_SECTIONS) {
            return;
          }
          continue;
        }
      }
      
      // Recursively check children if this wasn't processed as a section
      if (!processedElements.has(child) && contentSections.length < MAX_SECTIONS) {
        findContentSections(child);
      }
    }
  }

  findContentSections(main);

  // If we didn't find enough sections, be more liberal in what we consider content
  if (contentSections.length < 3) {
    // Look for any elements with substantial text content
    const allElements = main.querySelectorAll('div, section, article, p, ul, ol, blockquote');
    for (const element of Array.from(allElements)) {
      if (processedElements.has(element) || shouldExcludeElement(element)) {
        continue;
      }
      
      const content = extractSectionContent(element);
      if (content.length > 15 && content.length < 5000) {
        contentSections.push({
          element,
          content
        });
        processedElements.add(element);
        
        if (contentSections.length >= MAX_SECTIONS) break;
      }
    }
  }

  // Create nodes from content sections (NO HEADING-BASED NAMES)
  const children: TanaNodeChildContent[] = [];
  
  for (const section of contentSections.slice(0, MAX_SECTIONS)) {
    // Use the first part of content as the node name (no heading extraction)
    const firstSentence = section.content.split(/[.!?]/)[0];
    const nodeName = sanitizeNodeName(firstSentence, 200); // Reasonable length for auto-generated names
    
    // Split content into chunks if it's too long
    const contentChunks = splitContentIntoChunks(section.content);
    
    if (contentChunks.length === 1) {
      // Single chunk - use the content directly as the node name
      children.push({
        name: sanitizeNodeName(contentChunks[0])
      });
    } else {
      // Multiple content chunks - create child nodes for each
      const contentChildren = contentChunks.map((chunk) => ({
        name: sanitizeText(chunk)
      }));
      
      children.push({
        name: nodeName,
        children: contentChildren
      });
    }
  }

  // If no sections found, create a single node with page content
  if (children.length === 0) {
    const pageContent = extractSectionContent(main);
    if (pageContent.length > 15) {
      const contentChunks = splitContentIntoChunks(pageContent);
      
      if (contentChunks.length === 1) {
        children.push({
          name: sanitizeNodeName(contentChunks[0])
        });
      } else {
        const pageName = sanitizeNodeName(doc.title || 'Page Content');
        children.push({
          name: pageName,
          children: contentChunks.map(chunk => ({ name: sanitizeText(chunk) }))
        });
      }
    }
  }

  const rootNode: TanaNode = {
    name: sanitizeNodeName(doc.title || 'Page Content'),
    supertags: [],
    children: children as (TanaNodeChild | TanaNodeChildContent)[],
  };

  return [rootNode];
} 