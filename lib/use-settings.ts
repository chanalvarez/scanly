"use client";

import { useState, useEffect, useCallback } from "react";

export interface AppSettings {
  offlineMode: boolean;
  lowStockThreshold: number;
}

export const DEFAULT_SETTINGS: AppSettings = {
  offlineMode: false,
  lowStockThreshold: 5,
};

const STORAGE_KEY = "scanly-settings";

function loadSettings(): AppSettings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

function saveSettings(settings: AppSettings) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    window.dispatchEvent(new Event("scanly-settings-change"));
  } catch {}
}

export function useSettings() {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);

  useEffect(() => {
    setSettings(loadSettings());
    const handleChange = () => setSettings(loadSettings());
    window.addEventListener("scanly-settings-change", handleChange);
    return () => window.removeEventListener("scanly-settings-change", handleChange);
  }, []);

  const updateSettings = useCallback(
    (patch: Partial<AppSettings>) => {
      const next = { ...settings, ...patch };
      setSettings(next);
      saveSettings(next);
    },
    [settings]
  );

  return { settings, updateSettings };
}
