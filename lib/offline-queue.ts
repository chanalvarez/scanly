import { isDemo } from "@/lib/is-demo";
import { supabase } from "@/lib/supabase";

export interface PendingChange {
  itemId: string;
  itemName: string;
  payload: {
    stock_count?: number;
    name?: string;
    sku?: string;
    price?: number;
  };
  timestamp: string;
}

const QUEUE_KEY = "scanly-offline-queue";

export function getQueue(): PendingChange[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(QUEUE_KEY) || "[]");
  } catch {
    return [];
  }
}

export function addToQueue(change: PendingChange) {
  const queue = getQueue();
  // If the same item already has a queued change, merge the payloads (latest wins)
  const existing = queue.findIndex((c) => c.itemId === change.itemId);
  if (existing >= 0) {
    queue[existing] = {
      ...queue[existing],
      payload: { ...queue[existing].payload, ...change.payload },
      timestamp: change.timestamp,
    };
  } else {
    queue.push(change);
  }
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  window.dispatchEvent(new Event("scanly-queue-change"));
}

export function clearQueue() {
  localStorage.removeItem(QUEUE_KEY);
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("scanly-queue-change"));
  }
}

export async function flushQueue(): Promise<{ synced: number; failed: number }> {
  if (typeof window !== "undefined" && isDemo()) {
    return { synced: 0, failed: 0 };
  }

  const queue = getQueue();
  if (queue.length === 0) return { synced: 0, failed: 0 };

  let synced = 0;
  const failed: PendingChange[] = [];

  for (const change of queue) {
    const { error } = await supabase
      .from("inventory")
      .update({ ...change.payload, updated_at: new Date().toISOString() })
      .eq("id", change.itemId);

    if (error) {
      failed.push(change);
    } else {
      synced++;
    }
  }

  if (failed.length === 0) {
    clearQueue();
  } else {
    localStorage.setItem(QUEUE_KEY, JSON.stringify(failed));
    window.dispatchEvent(new Event("scanly-queue-change"));
  }

  if (synced > 0) {
    window.dispatchEvent(new Event("scanly-sync-complete"));
  }

  return { synced, failed: failed.length };
}

export function useQueueCount(): number {
  if (typeof window === "undefined") return 0;
  return getQueue().length;
}
