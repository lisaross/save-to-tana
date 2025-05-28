import { describe, it, expect } from 'vitest';
import { buildTanaPayload } from '../../src/tanaPayloadBuilder';
import type { SaveData, TanaFieldIds } from '../../src/types/index';

describe('buildTanaPayload', () => {
  const mockSaveData: SaveData = {
    url: 'https://example.com/test',
    title: 'Test Article',
    author: 'Test Author',
    description: 'Test description'
  };

  const mockTargetNodeId = 'test-node-id';
  const mockSupertagId = 'test-supertag-id';
  const mockFieldIds: TanaFieldIds = {
    URL: 'url-field-id',
    Author: 'author-field-id',
    Description: 'description-field-id'
  };

  it('should build a valid Tana payload with all fields', () => {
    const payload = buildTanaPayload(
      mockSaveData,
      mockTargetNodeId,
      mockSupertagId,
      mockFieldIds
    );

    expect(payload.targetNodeId).toBe(mockTargetNodeId);
    expect(payload.nodes).toHaveLength(1);

    const mainNode = payload.nodes[0];
    expect(mainNode.name).toBe(mockSaveData.title);
    expect(mainNode.supertags).toEqual([{ id: mockSupertagId }]);
    expect(Array.isArray(mainNode.children)).toBe(true);

    // Check for URL field
    const urlField = mainNode.children.find(child => 
      'type' in child && child.type === 'field' && child.attributeId === mockFieldIds.URL
    );
    expect(urlField).toBeDefined();
    expect(urlField?.children?.[0]).toEqual({ dataType: 'url', name: mockSaveData.url });

    // Check for Author field
    const authorField = mainNode.children.find(child =>
      'type' in child && child.type === 'field' && child.attributeId === mockFieldIds.Author
    );
    expect(authorField).toBeDefined();
    expect(authorField?.children?.[0]).toEqual({ name: mockSaveData.author });

    // Check for Description field
    const descriptionField = mainNode.children.find(child =>
      'type' in child && child.type === 'field' && child.attributeId === mockFieldIds.Description
    );
    expect(descriptionField).toBeDefined();
    expect(descriptionField?.children?.[0]).toEqual({ name: mockSaveData.description });
  });

  it('should handle missing optional fields gracefully', () => {
    const minimalSaveData: SaveData = {
      url: 'https://example.com/test',
      title: 'Test Article',
      author: '',
      description: ''
    };

    const payload = buildTanaPayload(
      minimalSaveData,
      mockTargetNodeId,
      mockSupertagId,
      mockFieldIds
    );

    expect(payload.nodes).toHaveLength(1);
    const mainNode = payload.nodes[0];

    // Should have URL field
    const urlField = mainNode.children.find(child =>
      'type' in child && child.type === 'field' && child.attributeId === mockFieldIds.URL
    );
    expect(urlField).toBeDefined();

    // Should not have empty Author or Description fields
    const authorField = mainNode.children.find(child =>
      'type' in child && child.type === 'field' && child.attributeId === mockFieldIds.Author
    );
    expect(authorField).toBeUndefined();

    const descriptionField = mainNode.children.find(child =>
      'type' in child && child.type === 'field' && child.attributeId === mockFieldIds.Description
    );
    expect(descriptionField).toBeUndefined();
  });

  it('should throw errors for invalid parameters', () => {
    expect(() => buildTanaPayload(
      null as any,
      mockTargetNodeId,
      mockSupertagId,
      mockFieldIds
    )).toThrow('SaveData is required');

    expect(() => buildTanaPayload(
      mockSaveData,
      '',
      mockSupertagId,
      mockFieldIds
    )).toThrow('Valid targetNodeId is required');

    expect(() => buildTanaPayload(
      mockSaveData,
      mockTargetNodeId,
      '',
      mockFieldIds
    )).toThrow('Valid supertagId is required');

    expect(() => buildTanaPayload(
      mockSaveData,
      mockTargetNodeId,
      mockSupertagId,
      null as any
    )).toThrow('TanaFieldIds is required');
  });

  it('should sanitize text inputs', () => {
    const saveDataWithNewlines: SaveData = {
      url: 'https://example.com/test',
      title: 'Test Article\nWith Newlines\r\nAnd Returns',
      author: 'Test\nAuthor',
      description: 'Test\r\ndescription'
    };

    const payload = buildTanaPayload(
      saveDataWithNewlines,
      mockTargetNodeId,
      mockSupertagId,
      mockFieldIds
    );

    const mainNode = payload.nodes[0];
    expect(mainNode.name).toBe('Test Article With Newlines And Returns');

    const authorField = mainNode.children.find(child =>
      'type' in child && child.type === 'field' && child.attributeId === mockFieldIds.Author
    );
    expect(authorField?.children?.[0]?.name).toBe('Test Author');

    const descriptionField = mainNode.children.find(child =>
      'type' in child && child.type === 'field' && child.attributeId === mockFieldIds.Description
    );
    expect(descriptionField?.children?.[0]?.name).toBe('Test description');
  });

  it('should use URL as title fallback when title is missing', () => {
    const saveDataNoTitle: SaveData = {
      url: 'https://example.com/fallback',
      title: '',
      author: 'Test Author',
      description: 'Test description'
    };

    const payload = buildTanaPayload(
      saveDataNoTitle,
      mockTargetNodeId,
      mockSupertagId,
      mockFieldIds
    );

    const mainNode = payload.nodes[0];
    expect(mainNode.name).toBe('https://example.com/fallback');
  });
}); 