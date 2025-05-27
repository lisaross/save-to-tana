import type { TanaNode, TanaNodeChild, TanaNodeChildContent } from '../types/index';
import { Readability } from '@mozilla/readability';

/**
 * Extracts the main content from a DOM Document and structures it for the Tana input API.
 * Handles headers, links, lists, and inline formatting, and builds a hierarchy based on heading levels.
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

  // Helper to process a node and return a flat list of { node, level }
  function flattenNodes(element: Element): Array<{ node: Element, level: number }> {
    const result: Array<{ node: Element, level: number }> = [];
    for (const child of Array.from(element.children)) {
      const level = getHeadingLevel(child);
      if (level > 0) {
        result.push({ node: child, level });
      } else if (child.tagName === 'UL' || child.tagName === 'OL') {
        // Flatten list items
        for (const li of Array.from(child.children)) {
          result.push({ node: li, level: 0 });
        }
      } else {
        result.push({ node: child, level: 0 });
      }
      // Recursively flatten children of non-heading, non-list nodes
      if (level === 0 && child.tagName !== 'UL' && child.tagName !== 'OL') {
        result.push(...flattenNodes(child));
      }
    }
    return result;
  }

  // Build a hierarchy from the flat list
  function buildHierarchy(flat: Array<{ node: Element, level: number }>): TanaNodeChildContent[] {
    const stack: Array<{ level: number, node: TanaNodeChildContent }> = [];
    const root: TanaNodeChildContent = { name: 'Root', children: [] };
    stack.push({ level: 0, node: root });

    for (const { node, level } of flat) {
      if (level > 0) {
        // Heading: create a new node
        const headingNode: TanaNodeChildContent = { name: sanitizeNodeName(node.textContent || ''), children: [] };
        // Find the parent (nearest lower level)
        while (stack.length > 0 && stack[stack.length - 1].level >= level) {
          stack.pop();
        }
        stack[stack.length - 1].node.children!.push(headingNode);
        stack.push({ level, node: headingNode });
      } else {
        // Non-heading: add as child to the most recent heading
        const content = getFormattedText(node);
        if (content && content.trim()) {
          stack[stack.length - 1].node.children!.push({ name: sanitizeNodeName(content) });
        }
      }
    }
    return root.children || [];
  }

  // Flatten the main content and build the hierarchy
  const flat = flattenNodes(main);
  const hierarchy = buildHierarchy(flat);

  // Only include the hierarchical children as children of the main node
  const rootNode: TanaNode = {
    name: 'Extracted Content',
    supertags: [],
    children: hierarchy as (TanaNodeChild | TanaNodeChildContent)[],
  };

  // Debug: print the hierarchy structure
  console.dir(hierarchy, { depth: null });

  return [rootNode];
} 