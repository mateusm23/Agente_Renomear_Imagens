export interface PhotoItem {
  id: string;
  file: File;
  previewUrl: string;
  caption: string;
  number: string; // The "01", "02" string
  status: 'pending' | 'processing' | 'done' | 'error';
  errorMsg?: string;
}

export interface ProcessingStats {
  total: number;
  processed: number;
  pending: number;
}
