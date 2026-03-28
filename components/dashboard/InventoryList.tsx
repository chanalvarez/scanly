"use client";

import { useState } from "react";
import { Package, AlertCircle } from "lucide-react";
import { SearchBar } from "@/components/dashboard/SearchBar";
import { InventoryRow } from "@/components/dashboard/InventoryRow";
import { AddItemModal } from "@/components/dashboard/AddItemModal";
import { useSettings } from "@/lib/use-settings";
import type { InventoryItem } from "@/types/inventory";

interface InventoryListProps {
  initialItems: InventoryItem[];
}

function StatCard({
  label,
  value,
  danger,
}: {
  label: string;
  value: string;
  danger?: boolean;
}) {
  return (
    <div className="flex flex-col gap-0.5 rounded-lg border border-border bg-card p-3">
      <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
        {label}
      </p>
      <p
        className={`text-lg font-bold tabular-nums ${
          danger ? "text-red-400" : "text-foreground"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

export function InventoryList({ initialItems }: InventoryListProps) {
  const [items, setItems] = useState<InventoryItem[]>(initialItems);
  const [search, setSearch] = useState("");
  const { settings } = useSettings();

  const lowStockCount = items.filter(
    (i) => i.stock_count < settings.lowStockThreshold
  ).length;

  const totalValue = items.reduce(
    (sum, i) => sum + i.price * i.stock_count,
    0
  );

  const filtered = items.filter(
    (item) =>
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.sku.toLowerCase().includes(search.toLowerCase())
  );

  const handleItemAdded = (newItem: InventoryItem) => {
    setItems((prev) =>
      [...prev, newItem].sort((a, b) => a.name.localeCompare(b.name))
    );
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Inventory</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {items.length} {items.length === 1 ? "product" : "products"} total
          </p>
        </div>
        {lowStockCount > 0 && (
          <div className="flex items-center gap-1.5 rounded-full bg-red-500/10 px-3 py-1.5 text-xs font-medium text-red-400">
            <AlertCircle className="h-3.5 w-3.5" />
            {lowStockCount} low stock
          </div>
        )}
      </div>

      {/* Stats row */}
      {items.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          <StatCard label="Total Items" value={items.length.toString()} />
          <StatCard
            label="Total Value"
            value={`$${totalValue.toFixed(0)}`}
          />
          <StatCard
            label="Low Stock"
            value={lowStockCount.toString()}
            danger={lowStockCount > 0}
          />
        </div>
      )}

      {/* Search + Add */}
      <div className="flex items-center gap-2">
        <SearchBar value={search} onChange={setSearch} className="flex-1" />
        <AddItemModal onItemAdded={handleItemAdded} />
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
          <Package className="h-12 w-12 text-muted-foreground/40" />
          <div>
            <p className="font-medium text-muted-foreground">
              {search ? "No results found" : "No inventory yet"}
            </p>
            <p className="text-sm text-muted-foreground/60">
              {search
                ? `No items match "${search}"`
                : "Add your first product to get started"}
            </p>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {filtered.map((item) => (
            <InventoryRow key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}
