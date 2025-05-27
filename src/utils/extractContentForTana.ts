import type { TanaNode, TanaNodeChild, TanaNodeChildContent } from '../types/index';
import { Readability } from '@mozilla/readability';

/**
 * Extracts the main content from a DOM Document and structures it for the Tana input API.
 * Handles headers, links, lists, and inline formatting.
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

  // Use Readability to get the main article content
  let main: HTMLElement | null = null;
  try {
    const article = new Readability(doc).parse();
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

  // Helper to recursively process nodes
  function processNode(node: Element): TanaNodeChildContent[] {
    const children: TanaNodeChildContent[] = [];
    // Example: Handle headings
    if (/^H[1-6]$/.test(node.tagName)) {
      children.push({
        name: node.textContent || ''
      });
    } else if (node.tagName === 'UL' || node.tagName === 'OL') {
      // Handle lists
      const listItems = Array.from(node.children).filter(
        (el) => el.tagName === 'LI'
      );
      listItems.forEach((li) => {
        children.push(...processNode(li));
      });
    } else if (node.tagName === 'LI') {
      // List item
      children.push({
        name: getFormattedText(node)
      });
    } else if (node.tagName === 'A') {
      // Handle links as plain text with markdown
      children.push({
        name: getFormattedText(node)
      });
    } else if (node.tagName === 'P') {
      // Paragraphs
      children.push({
        name: getFormattedText(node)
      });
    } else {
      // Recursively process children
      Array.from(node.children).forEach((child) => {
        children.push(...processNode(child));
      });
    }
    return children;
  }

  // Example: create a single root node for the main content
  const rootNode: TanaNode = {
    name: 'Extracted Content',
    supertags: [],
    children: processNode(main) as (TanaNodeChild | TanaNodeChildContent)[],
  };

  return [rootNode];
} 