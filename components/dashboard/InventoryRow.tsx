"use client";

import { Badge } from "@/components/ui/badge";
import { StockBar } from "@/components/dashboard/StockBar";
import { useSettings } from "@/lib/use-settings";
import type { InventoryItem } from "@/types/inventory";

interface InventoryRowProps {
  item: InventoryItem;
}

export function InventoryRow({ item }: InventoryRowProps) {
  const { settings } = useSettings();
  const isLowStock = item.stock_count < settings.lowStockThreshold;

  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card px-4 py-3 transition-colors active:bg-accent">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate font-medium text-foreground">{item.name}</p>
          {isLowStock && (
            <Badge variant="destructive" className="shrink-0 text-[10px]">
              Low Stock
            </Badge>
          )}
        </div>
        <p className="mt-0.5 text-xs text-muted-foreground">
          SKU: {item.sku} &middot; ${item.price.toFixed(2)}
        </p>
      </div>
      <div className="shrink-0">
        <StockBar count={item.stock_count} threshold={settings.lowStockThreshold} />
      </div>
    </div>
  );
}
