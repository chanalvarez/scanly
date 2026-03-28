"use client";

import { useState } from "react";
import { Package } from "lucide-react";
import { SearchBar } from "@/components/dashboard/SearchBar";
import { InventoryRow } from "@/components/dashboard/InventoryRow";
import { AddItemModal } from "@/components/dashboard/AddItemModal";
import type { InventoryItem } from "@/types/inventory";

interface InventoryListProps {
  initialItems: InventoryItem[];
}

export function InventoryList({ initialItems }: InventoryListProps) {
  const [items, setItems] = useState<InventoryItem[]>(initialItems);
  const [search, setSearch] = useState("");

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
      <div className="flex items-center gap-2">
        <SearchBar
          value={search}
          onChange={setSearch}
          className="flex-1"
        />
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
