export interface InventoryItem {
  id: string;
  name: string;
  sku: string;
  qr_code: string;
  stock_count: number;
  price: number;
  created_at: string;
  updated_at: string;
}

export type NewInventoryItem = Pick<
  InventoryItem,
  "name" | "sku" | "qr_code" | "stock_count" | "price"
>;
