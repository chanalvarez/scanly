"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { ScanSuccessAnimation } from "@/components/scanner/ScanSuccessAnimation";
import { ProductCardOverlay } from "@/components/scanner/ProductCardOverlay";
import { Loader2, CameraOff } from "lucide-react";
import type { InventoryItem } from "@/types/inventory";

const SCANNER_ID = "html5qr-scanner";
const DEBOUNCE_MS = 2000;
const SCAN_FPS = 20;

export function QRScanner() {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const lastScannedRef = useRef<string | null>(null);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [isStarted, setIsStarted] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [scannedItem, setScannedItem] = useState<InventoryItem | null>(null);

  const handleQRCode = useCallback(async (decodedText: string) => {
    if (lastScannedRef.current === decodedText) return;
    lastScannedRef.current = decodedText;

    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      lastScannedRef.current = null;
    }, DEBOUNCE_MS);

    const { data, error } = await supabase
      .from("inventory")
      .select("*")
      .eq("qr_code", decodedText)
      .single();

    if (error || !data) {
      toast.error(`No product found for QR: "${decodedText}"`);
      return;
    }

    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 1200);
    setScannedItem(data as InventoryItem);
  }, []);

  useEffect(() => {
    const scanner = new Html5Qrcode(SCANNER_ID);
    scannerRef.current = scanner;

    Html5Qrcode.getCameras()
      .then((devices) => {
        if (!devices || devices.length === 0) {
          setCameraError("No camera devices found.");
          return;
        }

        // Always prefer rear/back camera
        const camera =
          devices.find((d) =>
            d.label.toLowerCase().includes("back") ||
            d.label.toLowerCase().includes("rear") ||
            d.label.toLowerCase().includes("environment")
          ) || devices[devices.length - 1];

        return scanner.start(
          camera.id,
          { fps: SCAN_FPS, qrbox: { width: 250, height: 250 }, aspectRatio: 1.0 },
          handleQRCode,
          undefined
        );
      })
      .then(() => setIsStarted(true))
      .catch((err: unknown) => {
        const msg = err instanceof Error ? err.message : "Camera access denied.";
        setCameraError(msg);
        toast.error("Could not start camera: " + msg);
      });

    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
      scannerRef.current
        ?.stop()
        .then(() => scannerRef.current?.clear())
        .catch(() => {});
    };
  }, [handleQRCode]);

  const handleClose = () => {
    setScannedItem(null);
    lastScannedRef.current = null;
  };

  const handleStockChange = (newCount: number) => {
    setScannedItem((prev) => (prev ? { ...prev, stock_count: newCount } : null));
  };

  return (
    <div className="relative flex h-full flex-col items-center justify-center overflow-hidden bg-background">
      <div className="relative w-full flex-1">
        <div id={SCANNER_ID} className="h-full w-full" />

        {!isStarted && !cameraError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-background">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Starting camera…</p>
          </div>
        )}

        {cameraError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-background px-8 text-center">
            <CameraOff className="h-12 w-12 text-muted-foreground/40" />
            <p className="font-medium text-muted-foreground">Camera Error</p>
            <p className="text-sm text-muted-foreground/60">{cameraError}</p>
          </div>
        )}

        {isStarted && !scannedItem && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="relative h-64 w-64">
              {(["top-0 left-0", "top-0 right-0", "bottom-0 left-0", "bottom-0 right-0"] as const).map(
                (pos, i) => (
                  <div
                    key={i}
                    className={`absolute h-8 w-8 ${pos} border-primary ${
                      i === 0 ? "border-t-2 border-l-2 rounded-tl-md"
                      : i === 1 ? "border-t-2 border-r-2 rounded-tr-md"
                      : i === 2 ? "border-b-2 border-l-2 rounded-bl-md"
                      : "border-b-2 border-r-2 rounded-br-md"
                    }`}
                  />
                )
              )}
            </div>
          </div>
        )}

        <ScanSuccessAnimation show={showSuccess} />
        <ProductCardOverlay
          item={scannedItem}
          onClose={handleClose}
          onStockChange={handleStockChange}
        />
      </div>

      {isStarted && !scannedItem && (
        <div className="px-6 py-4 text-center">
          <p className="text-sm text-muted-foreground">
            Point the camera at a QR code to look up a product
          </p>
        </div>
      )}
    </div>
  );
}
