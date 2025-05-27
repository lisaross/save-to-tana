/**
 * Type definitions for the Save to Tana extension
 */

// Configuration stored in Chrome storage
export interface TanaConfig {
  apiKey: string;
  targetNodeId: string;
  supertagId: string;
  tanaFieldIds: TanaFieldIds;
}

// Field IDs for Tana schema
export interface TanaFieldIds {
  URL: string;
  Author: string;
  Description: string;
  Content: string;
}

// Data to be saved to Tana
export interface SaveData {
  url: string;
  title: string;
  author?: string;
  description?: string;
  content: string;
}

// Response from saveToTana function
export interface SaveResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

// Tana API payload
export interface TanaPayload {
  targetNodeId: string;
  nodes: TanaNode[];
}

// Tana node structure
export interface TanaNode {
  name: string;
  supertags: TanaSupertag[];
  children: (TanaNodeChild | TanaNodeChildContent)[];
}

// Tana supertag
export interface TanaSupertag {
  id: string;
}

// Tana node child (field)
export interface TanaNodeChild {
  type: string;
  attributeId: string;
  children: TanaNodeChildContent[];
}

// Tana node child content
export interface TanaNodeChildContent {
  name?: string;
  dataType?: string;
  children?: TanaNodeChildContent[];
}

// Message request structure
export interface SaveToTanaRequest {
  action: 'saveToTana';
  data: SaveData;
}
