import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { InventoryList } from "@/components/dashboard/InventoryList";
import type { InventoryItem } from "@/types/inventory";
import { AlertCircle, Terminal } from "lucide-react";

async function getInventory(): Promise<InventoryItem[]> {
  if (!isSupabaseConfigured) return [];

  const { data, error } = await supabase
    .from("inventory")
    .select("*")
    .order("name", { ascending: true });

  if (error) {
    console.error("Failed to fetch inventory:", error.message);
    return [];
  }

  return data as InventoryItem[];
}

export default async function DashboardPage() {
  if (!isSupabaseConfigured) {
    return <SetupPrompt />;
  }

  const items = await getInventory();

  const lowStockCount = items.filter((i) => i.stock_count < 5).length;

  return (
    <div className="flex flex-col gap-4 px-4 pt-6">
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
          <StatCard
            label="Total Items"
            value={items.length.toString()}
          />
          <StatCard
            label="Total Value"
            value={`$${items
              .reduce((sum, i) => sum + i.price * i.stock_count, 0)
              .toFixed(0)}`}
          />
          <StatCard
            label="Low Stock"
            value={lowStockCount.toString()}
            danger={lowStockCount > 0}
          />
        </div>
      )}

      {/* Inventory list with search and add */}
      <InventoryList initialItems={items} />
    </div>
  );
}

function SetupPrompt() {
  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center gap-6 px-6 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
        <Terminal className="h-8 w-8 text-primary" />
      </div>
      <div>
        <h2 className="text-xl font-bold">Connect Supabase</h2>
        <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
          Create a{" "}
          <code className="rounded bg-secondary px-1.5 py-0.5 font-mono text-xs">
            .env.local
          </code>{" "}
          file in the project root with your Supabase credentials to get started.
        </p>
      </div>
      <div className="w-full rounded-xl border border-border bg-card p-4 text-left font-mono text-xs text-muted-foreground">
        <p className="text-emerald-400"># .env.local</p>
        <p className="mt-1">NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co</p>
        <p>NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key</p>
      </div>
      <p className="text-xs text-muted-foreground">
        Run the SQL schema from{" "}
        <code className="rounded bg-secondary px-1 py-0.5 font-mono">
          supabase/schema.sql
        </code>{" "}
        in your Supabase project, then restart the dev server.
      </p>
    </div>
  );
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
