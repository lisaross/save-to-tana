import { describe, it, expect } from 'vitest';
import { sanitizeText, splitIntoChunks } from '../../src/utils/textUtils';

describe('textUtils', () => {
  describe('sanitizeText', () => {
    it('should remove newlines and carriage returns', () => {
      const input = 'Line 1\nLine 2\r\nLine 3\rLine 4';
      const expected = 'Line 1 Line 2 Line 3 Line 4';
      expect(sanitizeText(input)).toBe(expected);
    });

    it('should trim whitespace', () => {
      const input = '  \n  Some text  \r\n  ';
      const expected = 'Some text';
      expect(sanitizeText(input)).toBe(expected);
    });

    it('should handle empty strings', () => {
      expect(sanitizeText('')).toBe('');
      expect(sanitizeText('   ')).toBe('');
    });

    it('should handle null and undefined inputs', () => {
      expect(sanitizeText(null as any)).toBe('');
      expect(sanitizeText(undefined as any)).toBe('');
    });

    it('should collapse multiple spaces into single spaces', () => {
      const input = 'Word1   Word2\n\nWord3';
      const expected = 'Word1 Word2 Word3';
      expect(sanitizeText(input)).toBe(expected);
    });
  });

  describe('splitIntoChunks', () => {
    it('should split content into chunks at paragraph boundaries', () => {
      const content = 'Paragraph 1.\n\nParagraph 2.\n\nParagraph 3.';
      const chunks = splitIntoChunks(content, 20);
      
      expect(chunks.length).toBeGreaterThan(1);
      expect(chunks.every(chunk => chunk.length <= 20)).toBe(true);
    });

    it('should keep short content in a single chunk', () => {
      const content = 'Short content';
      const chunks = splitIntoChunks(content, 100);
      
      expect(chunks).toHaveLength(1);
      expect(chunks[0]).toBe(content);
    });

    it('should handle content without paragraph breaks', () => {
      const content = 'This is a very long sentence that exceeds the maximum chunk size and should be split at sentence boundaries.';
      const chunks = splitIntoChunks(content, 50);
      
      expect(chunks.length).toBeGreaterThan(1);
      expect(chunks.every(chunk => chunk.length <= 50)).toBe(true);
    });

    it('should handle extremely long words by force-splitting', () => {
      const content = 'a'.repeat(100);
      const chunks = splitIntoChunks(content, 30);
      
      expect(chunks.length).toBeGreaterThan(1);
      expect(chunks.every(chunk => chunk.length <= 30)).toBe(true);
    });

    it('should preserve paragraph structure when possible', () => {
      const content = 'Short para 1.\n\nShort para 2.\n\nShort para 3.';
      const chunks = splitIntoChunks(content, 100);
      
      expect(chunks).toHaveLength(1);
      expect(chunks[0]).toBe(content);
    });

    it('should handle empty content', () => {
      const chunks = splitIntoChunks('', 100);
      expect(chunks).toEqual([]);
    });

    it('should handle single character max size', () => {
      const content = 'abc';
      const chunks = splitIntoChunks(content, 1);
      
      expect(chunks).toEqual(['a', 'b', 'c']);
    });
  });
}); 