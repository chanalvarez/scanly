"use client";

import { useState, useEffect, useCallback } from "react";
import { Package, AlertCircle, WifiOff, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { SearchBar } from "@/components/dashboard/SearchBar";
import { InventoryRow } from "@/components/dashboard/InventoryRow";
import { AddItemModal } from "@/components/dashboard/AddItemModal";
import { EditItemModal } from "@/components/dashboard/EditItemModal";
import { useSettings } from "@/lib/use-settings";
import { getQueue, flushQueue } from "@/lib/offline-queue";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import type { InventoryItem } from "@/types/inventory";

interface InventoryListProps {
  initialItems: InventoryItem[];
}

function StatCard({ label, value, danger }: { label: string; value: string; danger?: boolean }) {
  return (
    <div className="flex flex-col gap-0.5 rounded-lg border border-border bg-card p-3">
      <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</p>
      <p className={`text-lg font-bold tabular-nums ${danger ? "text-red-400" : "text-foreground"}`}>
        {value}
      </p>
    </div>
  );
}

export function InventoryList({ initialItems }: InventoryListProps) {
  const [items, setItems] = useState<InventoryItem[]>(initialItems);
  const [search, setSearch] = useState("");
  const [editItem, setEditItem] = useState<InventoryItem | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const { settings } = useSettings();

  // Fetch fresh data from Supabase every time the dashboard mounts.
  // This ensures stock changes made in the scanner (on another page) are
  // always reflected when the user navigates back — regardless of router cache.
  useEffect(() => {
    if (!isSupabaseConfigured) return;

    supabase
      .from("inventory")
      .select("*")
      .order("name")
      .then(({ data }) => {
        if (!data) return;
        // Overlay any pending offline changes on top of the fresh server data
        const queue = getQueue();
        setPendingCount(queue.length);
        const merged = (data as InventoryItem[]).map((item) => {
          const queued = queue.find((c) => c.itemId === item.id);
          return queued ? { ...item, ...queued.payload } : item;
        });
        setItems(merged);
      });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Keep pending count badge in sync whenever the queue changes
  useEffect(() => {
    const update = () => setPendingCount(getQueue().length);
    window.addEventListener("scanly-queue-change", update);
    return () => window.removeEventListener("scanly-queue-change", update);
  }, []);

  // Also refresh the list data whenever a queued change is flushed successfully
  useEffect(() => {
    const handleSync = async () => {
      if (!isSupabaseConfigured) return;
      const { data } = await supabase.from("inventory").select("*").order("name");
      if (data) setItems(data as InventoryItem[]);
    };
    window.addEventListener("scanly-sync-complete", handleSync);
    return () => window.removeEventListener("scanly-sync-complete", handleSync);
  }, []);

  // Supabase real-time subscription — reflects changes from scanner or other staff
  useEffect(() => {
    if (!isSupabaseConfigured || settings.offlineMode) return;

    const channel = supabase
      .channel("inventory-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "inventory" },
        (payload) => {
          if (payload.eventType === "UPDATE") {
            setItems((prev) =>
              prev.map((item) =>
                item.id === (payload.new as InventoryItem).id
                  ? (payload.new as InventoryItem)
                  : item
              )
            );
          } else if (payload.eventType === "INSERT") {
            setItems((prev) =>
              [...prev, payload.new as InventoryItem].sort((a, b) =>
                a.name.localeCompare(b.name)
              )
            );
          } else if (payload.eventType === "DELETE") {
            setItems((prev) =>
              prev.filter((item) => item.id !== (payload.old as InventoryItem).id)
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [settings.offlineMode]);

  // Auto-sync queue when internet comes back online
  useEffect(() => {
    const handleOnline = async () => {
      const queue = getQueue();
      if (queue.length === 0) return;
      toast.info(`Back online — syncing ${queue.length} pending change${queue.length > 1 ? "s" : ""}…`);
      const { synced, failed } = await flushQueue();
      if (synced > 0) {
        toast.success(`${synced} change${synced > 1 ? "s" : ""} synced successfully`);
        // Refresh from server after sync
        const { data } = await supabase
          .from("inventory")
          .select("*")
          .order("name");
        if (data) setItems(data as InventoryItem[]);
      }
      if (failed > 0) {
        toast.error(`${failed} change${failed > 1 ? "s" : ""} failed to sync`);
      }
    };

    window.addEventListener("online", handleOnline);
    return () => window.removeEventListener("online", handleOnline);
  }, []);

  const handleManualSync = useCallback(async () => {
    if (isSyncing) return;
    setIsSyncing(true);
    const { synced, failed } = await flushQueue();
    if (synced > 0) {
      toast.success(`${synced} change${synced > 1 ? "s" : ""} synced`);
      const { data } = await supabase.from("inventory").select("*").order("name");
      if (data) setItems(data as InventoryItem[]);
    }
    if (failed > 0) toast.error(`${failed} changes failed to sync`);
    if (synced === 0 && failed === 0) toast.info("Nothing to sync");
    setIsSyncing(false);
  }, [isSyncing]);

  const handleItemAdded = (newItem: InventoryItem) => {
    setItems((prev) =>
      [...prev, newItem].sort((a, b) => a.name.localeCompare(b.name))
    );
  };

  const handleItemUpdated = (updated: InventoryItem) => {
    setItems((prev) =>
      prev
        .map((item) => (item.id === updated.id ? updated : item))
        .sort((a, b) => a.name.localeCompare(b.name))
    );
  };

  const handleRowClick = (item: InventoryItem) => {
    setEditItem(item);
    setEditOpen(true);
  };

  const lowStockCount = items.filter((i) => i.stock_count < settings.lowStockThreshold).length;
  const totalValue = items.reduce((sum, i) => sum + i.price * i.stock_count, 0);

  const filtered = items.filter(
    (item) =>
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.sku.toLowerCase().includes(search.toLowerCase())
  );

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

      {/* Pending offline changes banner */}
      {pendingCount > 0 && (
        <button
          onClick={handleManualSync}
          disabled={isSyncing}
          className="flex items-center justify-between rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-left transition-colors hover:bg-amber-500/20"
        >
          <div className="flex items-center gap-2">
            <WifiOff className="h-4 w-4 text-amber-400" />
            <p className="text-sm text-amber-400">
              <span className="font-semibold">{pendingCount} offline change{pendingCount > 1 ? "s" : ""}</span> pending sync
            </p>
          </div>
          <div className="flex items-center gap-1 text-xs text-amber-400">
            <RefreshCw className={`h-3.5 w-3.5 ${isSyncing ? "animate-spin" : ""}`} />
            {isSyncing ? "Syncing…" : "Tap to sync"}
          </div>
        </button>
      )}

      {/* Stats row */}
      {items.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          <StatCard label="Total Items" value={items.length.toString()} />
          <StatCard label="Total Value" value={`₱${totalValue.toFixed(0)}`} />
          <StatCard label="Low Stock" value={lowStockCount.toString()} danger={lowStockCount > 0} />
        </div>
      )}

      {/* Search + Add */}
      <div className="flex items-center gap-2">
        <SearchBar value={search} onChange={setSearch} className="flex-1" />
        <AddItemModal onItemAdded={handleItemAdded} />
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
          <Package className="h-12 w-12 text-muted-foreground/40" />
          <div>
            <p className="font-medium text-muted-foreground">
              {search ? "No results found" : "No inventory yet"}
            </p>
            <p className="text-sm text-muted-foreground/60">
              {search ? `No items match "${search}"` : "Add your first product to get started"}
            </p>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {filtered.map((item) => (
            <InventoryRow key={item.id} item={item} onClick={handleRowClick} />
          ))}
        </div>
      )}

      <EditItemModal
        item={editItem}
        open={editOpen}
        onOpenChange={setEditOpen}
        onItemUpdated={handleItemUpdated}
      />
    </div>
  );
}
