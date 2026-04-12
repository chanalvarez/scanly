"use client";

import { useState } from "react";
import { Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useDemoBlockAction } from "@/components/DemoGuard";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import type { InventoryItem } from "@/types/inventory";

interface AddItemModalProps {
  onItemAdded: (item: InventoryItem) => void;
}

const EMPTY_FORM = {
  name: "",
  sku: "",
  qr_code: "",
  stock_count: "",
  price: "",
};

export function AddItemModal({ onItemAdded }: AddItemModalProps) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(false);
  const blockIfDemo = useDemoBlockAction();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (blockIfDemo()) return;
    if (!form.name || !form.sku || !form.qr_code) {
      toast.error("Name, SKU, and QR string are required.");
      return;
    }

    setLoading(true);
    const { data, error } = await supabase
      .from("inventory")
      .insert({
        name: form.name.trim(),
        sku: form.sku.trim().toUpperCase(),
        qr_code: form.qr_code.trim(),
        stock_count: parseInt(form.stock_count || "0", 10),
        price: parseFloat(form.price || "0"),
      })
      .select()
      .single();

    setLoading(false);

    if (error) {
      toast.error(error.message || "Failed to add item.");
      return;
    }

    toast.success(`"${data.name}" added to inventory!`);
    onItemAdded(data as InventoryItem);
    setForm(EMPTY_FORM);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="icon" className="h-11 w-11 shrink-0 rounded-xl">
          <Plus className="h-5 w-5" />
          <span className="sr-only">Add item</span>
        </Button>
      </DialogTrigger>

      <DialogContent className="mx-4 max-w-sm rounded-xl">
        <DialogHeader>
          <DialogTitle>Add New Product</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 py-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="name">Product Name *</Label>
            <Input
              id="name"
              name="name"
              placeholder="e.g. Wireless Mouse"
              value={form.name}
              onChange={handleChange}
              required
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="sku">SKU *</Label>
            <Input
              id="sku"
              name="sku"
              placeholder="e.g. WM-001"
              value={form.sku}
              onChange={handleChange}
              required
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="qr_code">Barcode *</Label>
            <Input
              id="qr_code"
              name="qr_code"
              placeholder="e.g. 4901234567890"
              value={form.qr_code}
              onChange={handleChange}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="stock_count">Initial Stock</Label>
              <Input
                id="stock_count"
                name="stock_count"
                type="number"
                min="0"
                placeholder="0"
                value={form.stock_count}
                onChange={handleChange}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="price">Price (₱)</Label>
              <Input
                id="price"
                name="price"
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={form.price}
                onChange={handleChange}
              />
            </div>
          </div>

          <DialogFooter className="mt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adding…
                </>
              ) : (
                "Add Product"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
