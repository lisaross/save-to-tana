import type { TanaNode, TanaNodeChild, TanaNodeChildContent } from '../types/index';
import { Readability } from '@mozilla/readability';

/**
 * Extracts the main content from a DOM Document and structures it for the Tana input API.
 * Handles headers, links, lists, and inline formatting, and builds a hierarchy based on heading levels.
 * Enhanced to handle pages with poor semantic structure.
 * @param doc - The DOM Document to extract content from
 * @returns Array of TanaNode objects ready for the Tana input API
 */

export function extractContentForTana(doc: Document): TanaNode[] {
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

  // Helper to sanitize node names (remove newlines, collapse whitespace)
  function sanitizeNodeName(name: string): string {
    return name.replace(/[\r\n]+/g, ' ').replace(/\s+/g, ' ').trim();
  }

  // Helper to check if text looks like a person's name (simple heuristic)
  function looksLikePersonName(text: string): boolean {
    // Remove line breaks and trim
    const cleanText = sanitizeNodeName(text);
    
    // Be much more conservative - only flag things that are clearly person names
    // Avoid false positives on titles, headers, etc.
    if (cleanText.length > 25) return false; // Too long to be a typical name
    if (cleanText.length < 6) return false; // Too short to be a full name
    
    // Must have at least 2 words (first and last name)
    const words = cleanText.split(/\s+/);
    if (words.length < 2 || words.length > 4) return false;
    
    // Common non-name patterns to exclude
    if (cleanText.includes('Test') || 
        cleanText.includes('Header') ||
        cleanText.includes('Section') ||
        cleanText.includes('Article') ||
        cleanText.includes('Title') ||
        cleanText.includes('platform') || 
        cleanText.includes('community') ||
        cleanText.includes('business') ||
        cleanText.includes('tool') ||
        cleanText.includes('content')) {
      return false;
    }
    
    // Check if it matches a person name pattern (all words capitalized, only letters)
    return /^[A-Z][a-z]+(?:\s+[A-Z][a-z]*)*(?:\s+[A-Z]\.)?(?:\s+[A-Z][a-z]+)*$/.test(cleanText);
  }

  // Helper to check if element is likely part of a carousel/testimonial section
  function isCarouselElement(element: Element): boolean {
    const classList = element.className || '';
    const parentClass = element.parentElement?.className || '';
    
    return classList.includes('swiper') || 
           classList.includes('carousel') || 
           classList.includes('slide') ||
           parentClass.includes('swiper') ||
           parentClass.includes('carousel') ||
           // Check for flex containers with images (common carousel pattern)
           (classList.includes('flex') && !!element.querySelector('img')) ||
           // Check for builder pattern with profile images
           (classList.includes('builder') && !!element.querySelector('h3') && !!element.querySelector('img'));
  }

  // Use Readability to get the main article content
  let main: HTMLElement | null = null;
  try {
    // IMPORTANT: Clone the document to prevent Readability from modifying the original page
    const docClone = doc.cloneNode(true) as Document;
    const article = new Readability(docClone).parse();
    if (article && article.content) {
      // Create a temporary DOM to parse the Readability HTML
      const tempDiv = doc.createElement('div');
      tempDiv.innerHTML = article.content;
      main = tempDiv;
    }
  } catch (e) {
    // Fallback to doc.body if Readability fails
    main = doc.body;
  }
  if (!main) main = doc.body;
  if (!main) return [];

  // Helper to determine heading level (returns 1-6 for h1-h6, or 0 for non-heading)
  function getHeadingLevel(node: Element): number {
    const match = node.tagName.match(/^H([1-6])$/);
    return match ? parseInt(match[1], 10) : 0;
  }

  // Helper to check if we should treat content as meaningful sections
  function shouldCreateSection(element: Element, level: number): boolean {
    if (level === 0) return false; // Not a heading
    
    const text = sanitizeNodeName(element.textContent || '');
    
    // Skip if it looks like a person's name
    if (looksLikePersonName(text)) return false;
    
    // Skip if it's in a carousel
    if (isCarouselElement(element)) return false;
    
    // For test content and normal articles, be more lenient with heading length
    // Skip very short headings that are likely not content sections, but allow reasonable headings
    if (text.length < 5) return false;
    
    return true;
  }

  // Enhanced function to process content with better semantic understanding
  function extractContentSections(element: Element): Array<{ content: string, isSection: boolean, level: number }> {
    const sections: Array<{ content: string, isSection: boolean, level: number }> = [];
    const processedElements = new Set<Element>();
    
    // Helper to extract clean text from an element, avoiding nested duplicates
    function getElementText(el: Element): string {
      let text = '';
      for (const child of Array.from(el.childNodes)) {
        if (child.nodeType === (NodeCtor?.TEXT_NODE || 3)) {
          text += child.textContent || '';
        } else if (child.nodeType === (NodeCtor?.ELEMENT_NODE || 1)) {
          const childEl = child as Element;
          // Only include child text if the child isn't a significant container
          if (['SPAN', 'STRONG', 'EM', 'B', 'I', 'A'].includes(childEl.tagName)) {
            text += getFormattedText(childEl);
          }
        }
      }
      return sanitizeNodeName(text);
    }
    
    // Process all elements in document order
    function walkElements(parent: Element) {
      for (const child of Array.from(parent.children)) {
        if (processedElements.has(child)) continue;
        
        // Skip non-content elements
        if (['SCRIPT', 'STYLE', 'NOSCRIPT', 'HEAD'].includes(child.tagName)) {
          continue;
        }
        
        const headingLevel = getHeadingLevel(child);
        
        if (headingLevel > 0) {
          // This is a heading
          const text = getElementText(child);
          
          if (shouldCreateSection(child, headingLevel)) {
            sections.push({ content: text, isSection: true, level: headingLevel });
            processedElements.add(child);
            continue; // Don't process children of headings
          }
        }
        
        // Check for meaningful content elements
        if (['P', 'DIV', 'SPAN', 'SECTION', 'ARTICLE', 'UL', 'OL', 'LI'].includes(child.tagName)) {
          const text = getElementText(child);
          
          // Handle lists specially
          if (['UL', 'OL'].includes(child.tagName)) {
            // Process list items individually
            const listItems = Array.from(child.querySelectorAll('li'))
              .map(li => getElementText(li))
              .filter(text => text.length > 0);
            
            for (const item of listItems) {
              if (item.length > 2 && !sections.some(s => s.content === item)) {
                sections.push({ content: item, isSection: false, level: 0 });
              }
            }
            processedElements.add(child);
            continue;
          }
          
          // Only include substantial, non-duplicate content
          if (text.length > 5 && 
              text.length < 500 && // Increased from 200 to allow longer paragraphs
              !looksLikePersonName(text) && 
              !isCarouselElement(child) &&
              !sections.some(s => s.content === text) &&
              !text.match(/^(Get started|Email address|Enter your|Click here|Read more)$/i)) {
            
            sections.push({ content: text, isSection: false, level: 0 });
            processedElements.add(child);
            continue; // Don't process children of content elements
          }
        }
        
        // If this element wasn't processed, check its children
        if (!processedElements.has(child)) {
          walkElements(child);
        }
      }
    }
    
    walkElements(element);
    return sections;
  }

  // Extract content sections
  const contentSections = extractContentSections(main);
  
  // Check if we have a good hierarchical structure
  const hasGoodHierarchy = contentSections.some(s => s.isSection && s.level > 0);
  
  if (!hasGoodHierarchy) {
    // No main headings found - create a simple list of key content
    const meaningfulContent = contentSections
      .filter(s => s.content.length > 20 && !looksLikePersonName(s.content))
      .slice(0, 10) // Limit to top 10 pieces of content
      .map(s => ({ name: s.content }));
    
    if (meaningfulContent.length > 0) {
      const rootNode: TanaNode = {
        name: 'Extracted Content',
        supertags: [],
        children: meaningfulContent as (TanaNodeChild | TanaNodeChildContent)[],
      };
      
      return [rootNode];
    }
  }

  // Build hierarchy from sections (existing logic)
  function buildHierarchy(sections: Array<{ content: string, isSection: boolean, level: number }>): TanaNodeChildContent[] {
    const stack: Array<{ level: number, node: TanaNodeChildContent }> = [];
    const root: TanaNodeChildContent = { name: 'Root', children: [] };
    stack.push({ level: 0, node: root });

    for (const section of sections) {
      if (section.isSection && section.level > 0) {
        // Heading: create a new node
        const headingNode: TanaNodeChildContent = { name: section.content, children: [] };
        // Find the parent (nearest lower level)
        while (stack.length > 0 && stack[stack.length - 1].level >= section.level) {
          stack.pop();
        }
        stack[stack.length - 1].node.children!.push(headingNode);
        stack.push({ level: section.level, node: headingNode });
      } else if (!section.isSection) {
        // Non-heading: add as child to the most recent heading
        if (section.content && section.content.trim()) {
          stack[stack.length - 1].node.children!.push({ name: section.content });
        }
      }
    }
    return root.children || [];
  }

  // Build the hierarchy
  const hierarchy = buildHierarchy(contentSections);

  // Only include the hierarchical children as children of the main node
  const rootNode: TanaNode = {
    name: 'Extracted Content',
    supertags: [],
    children: hierarchy as (TanaNodeChild | TanaNodeChildContent)[],
  };

  return [rootNode];
} 