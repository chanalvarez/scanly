"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Minus, Plus, X, Loader2, Package, WifiOff } from "lucide-react";
import { toast } from "sonner";
import { useDemoBlockAction } from "@/components/DemoGuard";
import { supabase } from "@/lib/supabase";
import { addToQueue } from "@/lib/offline-queue";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useSettings } from "@/lib/use-settings";
import type { InventoryItem } from "@/types/inventory";

interface ProductCardOverlayProps {
  item: InventoryItem | null;
  onClose: () => void;
  onStockChange: (newCount: number) => void;
}

export function ProductCardOverlay({
  item,
  onClose,
  onStockChange,
}: ProductCardOverlayProps) {
  const [updating, setUpdating] = useState(false);
  const { settings } = useSettings();
  const threshold = settings.lowStockThreshold;
  const blockIfDemo = useDemoBlockAction();

  const updateStock = async (delta: number) => {
    if (!item) return;
    if (blockIfDemo()) return;
    const newCount = Math.max(0, item.stock_count + delta);
    if (newCount === item.stock_count) return;

    // Optimistically update local state immediately
    onStockChange(newCount);
    setUpdating(true);

    // If offline mode is on or no internet, queue the change
    if (settings.offlineMode || !navigator.onLine) {
      addToQueue({
        itemId: item.id,
        itemName: item.name,
        payload: { stock_count: newCount },
        timestamp: new Date().toISOString(),
      });
      setUpdating(false);
      toast.info("Saved offline", {
        description: "Will sync automatically when back online",
        icon: <WifiOff className="h-4 w-4" />,
      });
      return;
    }

    const { error } = await supabase
      .from("inventory")
      .update({ stock_count: newCount, updated_at: new Date().toISOString() })
      .eq("id", item.id);

    setUpdating(false);

    if (error) {
      // Network failed — save to queue anyway
      addToQueue({
        itemId: item.id,
        itemName: item.name,
        payload: { stock_count: newCount },
        timestamp: new Date().toISOString(),
      });
      toast.info("Saved offline", {
        description: "Will sync automatically when back online",
        icon: <WifiOff className="h-4 w-4" />,
      });
      return;
    }

    toast.success(
      delta > 0 ? `Stock increased to ${newCount}` : `Stock decreased to ${newCount}`
    );
  };

  return (
    <AnimatePresence>
      {item && (
        <>
          <motion.div
            className="absolute inset-0 z-20 bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          <motion.div
            className="absolute bottom-0 left-0 right-0 z-30 px-4 pb-6"
            initial={{ y: "100%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100%", opacity: 0 }}
            transition={{ type: "spring", stiffness: 350, damping: 30 }}
          >
            <Card className="overflow-hidden border-border">
              <CardContent className="p-5">
                <div className="mb-4 flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <Package className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h2 className="font-semibold leading-tight">{item.name}</h2>
                      <p className="text-xs text-muted-foreground">SKU: {item.sku}</p>
                    </div>
                  </div>
                  <button
                    onClick={onClose}
                    className="rounded-full p-1 text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="mb-5 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">Unit Price</p>
                    <p className="text-xl font-bold">₱{item.price.toFixed(2)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {item.stock_count < threshold && (
                      <Badge variant="destructive">Low Stock</Badge>
                    )}
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">In Stock</p>
                      <p
                        className={`text-xl font-bold tabular-nums ${
                          item.stock_count < threshold
                            ? "text-red-400"
                            : item.stock_count < threshold * 2
                            ? "text-amber-400"
                            : "text-emerald-400"
                        }`}
                      >
                        {item.stock_count}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    size="xl"
                    className="flex-1 text-lg"
                    onClick={() => updateStock(-1)}
                    disabled={updating || item.stock_count === 0}
                  >
                    {updating ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <Minus className="h-5 w-5" />
                    )}
                  </Button>

                  <div className="flex h-14 w-20 items-center justify-center rounded-xl border border-border bg-secondary">
                    <span className="text-2xl font-bold tabular-nums">
                      {item.stock_count}
                    </span>
                  </div>

                  <Button
                    size="xl"
                    className="flex-1 text-lg"
                    onClick={() => updateStock(1)}
                    disabled={updating}
                  >
                    {updating ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <Plus className="h-5 w-5" />
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
