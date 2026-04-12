export interface ScanHistoryEntry {
  id: string;
  document_label: string;
  barcode: string | null;
  product_name: string | null;
  scanned_at: string;
}
