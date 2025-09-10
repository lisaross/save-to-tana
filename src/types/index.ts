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
  children: TanaNodeChild[];
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
}

// Message request structure - Base interface
export interface BaseRequest {
  action: string;
}

// Specific request types
export interface SaveToTanaRequest extends BaseRequest {
  action: 'saveToTana';
  data: SaveData;
}

export interface ExtractContentRequest extends BaseRequest {
  action: 'extractContent';
  options?: {
    includeContent?: boolean;
    includeTitle?: boolean;
  };
}

export interface ShowOverlayRequest extends BaseRequest {
  action: 'showOverlay';
  data: SaveData;
}

export interface InjectOverlayRequest extends BaseRequest {
  action: 'injectOverlay';
  tabId: number;
}

export interface QuickSaveRequest extends BaseRequest {
  action: 'quickSave';
  tabId: number;
}

export interface SaveWithNotesRequest extends BaseRequest {
  action: 'saveWithNotes';
  tabId: number;
}

// Union type for all possible requests
export type ExtensionRequest = 
  | SaveToTanaRequest 
  | ExtractContentRequest 
  | ShowOverlayRequest 
  | InjectOverlayRequest
  | QuickSaveRequest
  | SaveWithNotesRequest;
