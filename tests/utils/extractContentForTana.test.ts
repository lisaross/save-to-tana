import 'dotenv/config';
import { describe, it, expect } from 'vitest';
import { JSDOM } from 'jsdom';
import { extractContentForTana } from '../../src/utils/extractContentForTana';
import { tanaConfig } from '../../src/utils/tanaConfig';
import type { TanaNode } from '../../src/types/index';
import type { TanaNodeChild, TanaNodeChildContent } from '../../src/types/index';
import { readFileSync } from 'fs';
import { join } from 'path';

describe('tanaConfig', () => {
  it('should load Tana API config from environment variables', () => {
    expect(tanaConfig.apiKey).toBeDefined();
    expect(tanaConfig.targetNodeId).toBeDefined();
    expect(tanaConfig.supertagId).toBeDefined();
    expect(tanaConfig.fieldIdUrl).toBeDefined();
    expect(tanaConfig.fieldIdAuthor).toBeDefined();
    expect(tanaConfig.fieldIdDescription).toBeDefined();
    expect(tanaConfig.fieldIdContent).toBeDefined();
  });
});

describe('extractContentForTana', () => {
  it('extracts headers, paragraphs, links, and lists', () => {
    const html = `
      <body>
        <h1>Test Header</h1>
        <p>This is a <a href='https://example.com'>link</a> in a paragraph.</p>
        <ul>
          <li>First item</li>
          <li>Second item</li>
        </ul>
      </body>
    `;
    const dom = new JSDOM(html);
    const doc = dom.window.document;
    const result = extractContentForTana(doc);

    // Root node
    expect(result).toHaveLength(1);
    const root = result[0];
    expect(root.name).toBe('Extracted Content');
    expect(Array.isArray(root.children)).toBe(true);

    // Should have hierarchical structure with headings as parent nodes
    const hierarchicalNodes = root.children.filter(node => 
      node.children && Array.isArray(node.children) && node.children.length > 0
    );
    expect(hierarchicalNodes.length).toBeGreaterThan(0);

    // Check heading content - should have "Test Header" as a parent node
    const headingNode = root.children.find(child => 
      'name' in child && child.name === 'Test Header'
    );
    expect(headingNode).toBeDefined();
    expect(headingNode?.children).toBeDefined();

    // Should include paragraph content with link formatting
    const allText = JSON.stringify(result);
    expect(allText).toMatch(/This is a/);
    expect(allText).toMatch(/\[link\]\(https:\/\/example\.com\/?\)/);

    // Should include list items
    expect(allText).toMatch(/First item/);
    expect(allText).toMatch(/Second item/);
  });
});

describe('extractContentForTana - sample article', () => {
  it('correctly extracts and structures a realistic article with headings, lists, and formatting', () => {
    const html = readFileSync(join(__dirname, 'sample-article.html'), 'utf8');
    const dom = new JSDOM(html);
    const doc = dom.window.document;
    const result = extractContentForTana(doc);

    // There should be a single root node (from Readability)
    expect(result).toHaveLength(1);
    const root = result[0];
    expect(root.name).toMatch(/Article Title|Extracted Content/);
    expect(Array.isArray(root.children)).toBe(true);

    // Should not include navbar, sidebar, or footer
    const allText = JSON.stringify(result);
    expect(allText).not.toMatch(/Navigation Bar/);
    expect(allText).not.toMatch(/Sidebar/);
    expect(allText).not.toMatch(/Footer/);

    // Should include main headings as parent nodes
    // (Depending on implementation, may be nested or flat; check for at least one h1 and h2)
    const hasH1 = root.children.some(child => child.children?.[0]?.name?.includes('Article Title'));
    const hasH2 = root.children.some(child => child.children?.[0]?.name?.includes('Section One'));
    expect(hasH1 || hasH2).toBe(true);

    // Should preserve bold, italics, and links in content
    expect(allText).toMatch(/Bold text/);
    expect(allText).toMatch(/italic text/);
    expect(allText).toMatch(/\[link\]\(https:\/\/example.com\/?\)/);

    // Should include list items
    expect(allText).toMatch(/First bullet point/);
    expect(allText).toMatch(/Second bullet point/);
    expect(allText).toMatch(/First ordered item/);
    expect(allText).toMatch(/Second ordered item/);

    // Should include section and subsection hierarchy
    // (This is a basic check; more advanced checks can be added as the logic matures)
    expect(allText).toMatch(/Section One/);
    expect(allText).toMatch(/Subsection/);
    expect(allText).toMatch(/Section Two/);
  });
});

// Add type guard for TanaNodeChild
function isTanaNodeChild(node: TanaNodeChild | TanaNodeChildContent): node is TanaNodeChild {
  return (
    typeof node === 'object' &&
    node !== null &&
    'type' in node &&
    typeof (node as any).type === 'string' &&
    'attributeId' in node &&
    typeof (node as any).attributeId === 'string' &&
    'children' in node &&
    Array.isArray((node as any).children)
  );
} 