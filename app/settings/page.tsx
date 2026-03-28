"use client";

import { useState, useEffect } from "react";
import { Settings, Wifi, Bell, RefreshCw, CheckCircle2, WifiOff, CloudUpload } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { useSettings } from "@/lib/use-settings";
import { getQueue, flushQueue } from "@/lib/offline-queue";
import type { InventoryItem } from "@/types/inventory";

export default function SettingsPage() {
  const { settings, updateSettings } = useSettings();
  const [syncing, setSyncing] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [isOnline, setIsOnline] = useState(true);
  const [lastSynced, setLastSynced] = useState<string | null>(null);

  useEffect(() => {
    setPendingCount(getQueue().length);
    setIsOnline(navigator.onLine);
    setLastSynced(localStorage.getItem("scanly-last-synced"));

    const updateQueue = () => setPendingCount(getQueue().length);
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("scanly-queue-change", updateQueue);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("scanly-queue-change", updateQueue);
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

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

  const handlePendingSync = async () => {
    if (syncing || !isOnline) return;
    setSyncing(true);
    const { synced, failed } = await flushQueue();
    setSyncing(false);

    if (synced > 0) toast.success(`${synced} pending change${synced > 1 ? "s" : ""} synced`);
    if (failed > 0) toast.error(`${failed} changes failed — will retry when online`);
    if (synced === 0 && failed === 0) toast.info("No pending changes to sync");
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
        <div className="ml-auto">
          <Badge variant={isOnline ? "success" : "outline"} className="gap-1">
            {isOnline ? (
              <><CheckCircle2 className="h-3 w-3" /> Online</>
            ) : (
              <><WifiOff className="h-3 w-3" /> Offline</>
            )}
          </Badge>
        </div>
      </div>

      {/* Pending changes */}
      {pendingCount > 0 && (
        <Card className="border-amber-500/30 bg-amber-500/10">
          <CardContent className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <CloudUpload className="h-5 w-5 text-amber-400" />
              <div>
                <p className="font-medium text-amber-400">
                  {pendingCount} pending change{pendingCount > 1 ? "s" : ""}
                </p>
                <p className="text-xs text-amber-400/70">
                  {isOnline ? "Ready to sync" : "Waiting for internet connection"}
                </p>
              </div>
            </div>
            <Button
              size="sm"
              variant="outline"
              className="border-amber-500/50 text-amber-400 hover:bg-amber-500/20"
              onClick={handlePendingSync}
              disabled={syncing || !isOnline}
            >
              <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${syncing ? "animate-spin" : ""}`} />
              {syncing ? "Syncing…" : "Sync now"}
            </Button>
          </CardContent>
        </Card>
      )}

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
              <p className="font-medium">Work without internet</p>
              <p className="text-xs text-muted-foreground">
                Changes are saved locally and synced when back online
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
                  {lastSynced ? `Inventory cached at ${lastSynced}` : "Not yet cached"}
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
                Refresh cache
              </Button>
            </div>
          )}

          <p className="text-xs text-muted-foreground leading-relaxed">
            When offline mode is on, all stock changes (via scanner or editing) are queued and automatically
            uploaded the moment internet is restored.
          </p>
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
    </div>
  );
}
