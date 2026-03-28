"use client";

import { useState } from "react";
import {
  Settings,
  Wifi,
  Bell,
  Smartphone,
  Camera,
  Zap,
  RefreshCw,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { useSettings } from "@/lib/use-settings";
import type { InventoryItem } from "@/types/inventory";

const SPEED_OPTIONS: { label: string; value: "slow" | "normal" | "fast"; fps: number }[] = [
  { label: "Slow", value: "slow", fps: 5 },
  { label: "Normal", value: "normal", fps: 10 },
  { label: "Fast", value: "fast", fps: 20 },
];

export default function SettingsPage() {
  const { settings, updateSettings } = useSettings();
  const [syncing, setSyncing] = useState(false);
  const [lastSynced, setLastSynced] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("scanly-last-synced");
  });

  const syncOfflineCache = async () => {
    if (!isSupabaseConfigured) {
      toast.error("Supabase is not configured.");
      return;
    }
    setSyncing(true);
    const { data, error } = await supabase
      .from("inventory")
      .select("*")
      .order("name");

    if (error || !data) {
      setSyncing(false);
      toast.error("Sync failed: " + (error?.message ?? "Unknown error"));
      return;
    }

    const now = new Date().toLocaleTimeString();
    localStorage.setItem("scanly-offline-inventory", JSON.stringify(data as InventoryItem[]));
    localStorage.setItem("scanly-last-synced", now);
    setLastSynced(now);
    setSyncing(false);
    toast.success(`${data.length} items cached for offline use`);
  };

  const handleOfflineToggle = async (checked: boolean) => {
    updateSettings({ offlineMode: checked });
    if (checked) {
      await syncOfflineCache();
    } else {
      localStorage.removeItem("scanly-offline-inventory");
      localStorage.removeItem("scanly-last-synced");
      setLastSynced(null);
      toast.info("Offline cache cleared");
    }
  };

  return (
    <div className="flex flex-col gap-4 px-4 pt-6 pb-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
          <Settings className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
          <p className="text-sm text-muted-foreground">Inventory Manager v0.1.0</p>
        </div>
      </div>

      {/* Offline Mode */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <Wifi className="h-4 w-4 text-primary" />
            <CardTitle className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
              Offline Mode
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Cache inventory locally</p>
              <p className="text-xs text-muted-foreground">
                Access your inventory without internet
              </p>
            </div>
            <Switch
              checked={settings.offlineMode}
              onCheckedChange={handleOfflineToggle}
            />
          </div>

          {settings.offlineMode && (
            <div className="flex items-center justify-between rounded-lg bg-secondary px-3 py-2">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                <p className="text-xs text-muted-foreground">
                  {lastSynced ? `Last synced at ${lastSynced}` : "Not yet synced"}
                </p>
              </div>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 gap-1 text-xs"
                onClick={syncOfflineCache}
                disabled={syncing}
              >
                <RefreshCw className={`h-3 w-3 ${syncing ? "animate-spin" : ""}`} />
                Sync now
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Low Stock Alerts */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4 text-primary" />
            <CardTitle className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
              Low Stock Alerts
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Alert threshold</p>
              <p className="text-xs text-muted-foreground">
                Show Low Stock badge when count is below this number
              </p>
            </div>
            <Badge variant="secondary" className="text-base font-bold px-3 py-1">
              {settings.lowStockThreshold}
            </Badge>
          </div>

          {/* Threshold slider */}
          <div className="flex flex-col gap-2">
            <input
              type="range"
              min={1}
              max={20}
              value={settings.lowStockThreshold}
              onChange={(e) =>
                updateSettings({ lowStockThreshold: parseInt(e.target.value) })
              }
              className="w-full accent-primary"
            />
            <div className="flex justify-between text-[10px] text-muted-foreground">
              <span>1</span>
              <span>5</span>
              <span>10</span>
              <span>15</span>
              <span>20</span>
            </div>
          </div>

          <div className="flex items-center gap-2 rounded-lg bg-secondary px-3 py-2">
            <Bell className="h-3.5 w-3.5 text-amber-400" />
            <p className="text-xs text-muted-foreground">
              Items with{" "}
              <span className="font-semibold text-foreground">
                fewer than {settings.lowStockThreshold} units
              </span>{" "}
              will show a Low Stock badge
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Scanner Settings */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <Smartphone className="h-4 w-4 text-primary" />
            <CardTitle className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
              Scanner Settings
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {/* Camera preference */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Camera className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="font-medium">Front camera</p>
                <p className="text-xs text-muted-foreground">
                  Use front camera instead of rear
                </p>
              </div>
            </div>
            <Switch
              checked={settings.preferFrontCamera}
              onCheckedChange={(checked) => {
                updateSettings({ preferFrontCamera: checked });
                toast.info(
                  checked ? "Front camera selected" : "Rear camera selected",
                  { description: "Takes effect next time you open the scanner" }
                );
              }}
            />
          </div>

          <div className="h-px bg-border" />

          {/* Scan speed */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-muted-foreground" />
              <p className="font-medium">Scan speed</p>
            </div>
            <p className="text-xs text-muted-foreground">
              Faster scanning uses more battery
            </p>
            <div className="mt-1 grid grid-cols-3 gap-2">
              {SPEED_OPTIONS.map(({ label, value, fps }) => (
                <button
                  key={value}
                  onClick={() => {
                    updateSettings({ scanSpeed: value });
                    toast.info(`Scan speed set to ${label}`);
                  }}
                  className={`flex flex-col items-center gap-0.5 rounded-lg border py-2.5 text-sm font-medium transition-colors ${
                    settings.scanSpeed === value
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-secondary text-muted-foreground"
                  }`}
                >
                  {label}
                  <span className="text-[10px] font-normal opacity-70">{fps} fps</span>
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
