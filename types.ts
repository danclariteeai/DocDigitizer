export type DocumentType = 'BOM' | 'INVOICE' | 'PO' | 'OTHER';

// Generic item that can have any keys (dynamic columns)
export interface ExtractedItem extends Record<string, any> {
  id: string;
}

export interface ProcessingState {
  status: 'idle' | 'uploading' | 'processing' | 'complete' | 'error';
  message?: string;
}

export interface HistoryItem {
  id: string;
  timestamp: number;
  fileName: string;
  docType: DocumentType;
  items: ExtractedItem[];
}

export interface ColumnDefinition {
  key: string;
  label: string;
  minWidth: number;
}

export interface DocConfig {
  type: DocumentType;
  label: string;
  prompt: string;
  columns: ColumnDefinition[];
}
