"use client";

import { useState, useEffect } from "react";
import { Loader2, Pencil, WifiOff } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { addToQueue } from "@/lib/offline-queue";
import { useSettings } from "@/lib/use-settings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import type { InventoryItem } from "@/types/inventory";

interface EditItemModalProps {
  item: InventoryItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onItemUpdated: (item: InventoryItem) => void;
}

export function EditItemModal({
  item,
  open,
  onOpenChange,
  onItemUpdated,
}: EditItemModalProps) {
  const { settings } = useSettings();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    sku: "",
    qr_code: "",
    stock_count: "",
    price: "",
  });

  useEffect(() => {
    if (item) {
      setForm({
        name: item.name,
        sku: item.sku,
        qr_code: item.qr_code,
        stock_count: item.stock_count.toString(),
        price: item.price.toString(),
      });
    }
  }, [item]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!item) return;
    if (!form.name || !form.sku || !form.qr_code) {
      toast.error("Name, SKU, and QR string are required.");
      return;
    }

    const updatedFields = {
      name: form.name.trim(),
      sku: form.sku.trim().toUpperCase(),
      qr_code: form.qr_code.trim(),
      stock_count: parseInt(form.stock_count || "0", 10),
      price: parseFloat(form.price || "0"),
    };

    const optimisticItem: InventoryItem = {
      ...item,
      ...updatedFields,
      updated_at: new Date().toISOString(),
    };

    // Optimistically update UI immediately
    onItemUpdated(optimisticItem);
    onOpenChange(false);

    // Offline: queue the change
    if (settings.offlineMode || !navigator.onLine) {
      addToQueue({
        itemId: item.id,
        itemName: updatedFields.name,
        payload: updatedFields,
        timestamp: new Date().toISOString(),
      });
      toast.info("Saved offline", {
        description: "Will sync automatically when back online",
        icon: <WifiOff className="h-4 w-4" />,
      });
      return;
    }

    setLoading(true);
    const { data, error } = await supabase
      .from("inventory")
      .update({ ...updatedFields, updated_at: new Date().toISOString() })
      .eq("id", item.id)
      .select()
      .single();

    setLoading(false);

    if (error) {
      // Queue it on failure
      addToQueue({
        itemId: item.id,
        itemName: updatedFields.name,
        payload: updatedFields,
        timestamp: new Date().toISOString(),
      });
      toast.info("Saved offline", {
        description: "Will sync automatically when back online",
        icon: <WifiOff className="h-4 w-4" />,
      });
      return;
    }

    onItemUpdated(data as InventoryItem);
    toast.success(`"${data.name}" updated`);
  };

  if (!item) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="mx-4 max-w-sm rounded-xl">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Pencil className="h-4 w-4 text-primary" />
            <DialogTitle>Edit Product</DialogTitle>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 py-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="edit-name">Product Name *</Label>
            <Input
              id="edit-name"
              name="name"
              value={form.name}
              onChange={handleChange}
              required
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="edit-sku">SKU *</Label>
            <Input
              id="edit-sku"
              name="sku"
              value={form.sku}
              onChange={handleChange}
              required
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="edit-qr">Barcode *</Label>
            <Input
              id="edit-qr"
              name="qr_code"
              value={form.qr_code}
              onChange={handleChange}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="edit-stock">Stock Count</Label>
              <Input
                id="edit-stock"
                name="stock_count"
                type="number"
                min="0"
                value={form.stock_count}
                onChange={handleChange}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="edit-price">Price (₱)</Label>
              <Input
                id="edit-price"
                name="price"
                type="number"
                min="0"
                step="0.01"
                value={form.price}
                onChange={handleChange}
              />
            </div>
          </div>

          <DialogFooter className="mt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving…
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
