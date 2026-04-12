"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";
import { toast } from "sonner";
import { isDemo } from "@/lib/is-demo";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { ScanSuccessAnimation } from "@/components/scanner/ScanSuccessAnimation";
import { ProductCardOverlay } from "@/components/scanner/ProductCardOverlay";
import { Loader2, CameraOff } from "lucide-react";
import type { InventoryItem } from "@/types/inventory";

const SCANNER_ID = "html5qr-scanner";
const DEBOUNCE_MS = 2000;
const SCAN_FPS = 20;

// All major retail barcode formats + QR as fallback
const SUPPORTED_FORMATS = [
  Html5QrcodeSupportedFormats.EAN_13,       // standard retail (most common)
  Html5QrcodeSupportedFormats.EAN_8,
  Html5QrcodeSupportedFormats.UPC_A,        // North American retail
  Html5QrcodeSupportedFormats.UPC_E,
  Html5QrcodeSupportedFormats.CODE_128,     // warehouse / logistics
  Html5QrcodeSupportedFormats.CODE_39,
  Html5QrcodeSupportedFormats.CODE_93,
  Html5QrcodeSupportedFormats.ITF,          // cartons / outer packaging
  Html5QrcodeSupportedFormats.QR_CODE,      // QR as fallback
];

export function QRScanner() {
  const demoMode = isDemo();
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const lastScannedRef = useRef<string | null>(null);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [isStarted, setIsStarted] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [scannedItem, setScannedItem] = useState<InventoryItem | null>(null);
  const [demoSample, setDemoSample] = useState<InventoryItem | null>(null);

  const handleBarcode = useCallback(async (decodedText: string) => {
    if (lastScannedRef.current === decodedText) return;
    lastScannedRef.current = decodedText;

    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      lastScannedRef.current = null;
    }, DEBOUNCE_MS);

    const { data, error } = await supabase
      .from("inventory")
      .select("*")
      .eq("qr_code", decodedText)   // column still named qr_code in DB — stores the barcode value
      .single();

    if (error || !data) {
      toast.error(`No product found for barcode: "${decodedText}"`);
      return;
    }

    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 1200);
    setScannedItem(data as InventoryItem);
  }, []);

  useEffect(() => {
    if (!demoMode) return;
    supabase
      .from("inventory")
      .select("*")
      .order("name", { ascending: true })
      .limit(1)
      .maybeSingle()
      .then(({ data }) => {
        if (data) setDemoSample(data as InventoryItem);
      });
  }, [demoMode]);

  useEffect(() => {
    if (demoMode) return;

    const scanner = new Html5Qrcode(SCANNER_ID, { formatsToSupport: SUPPORTED_FORMATS, verbose: false });
    scannerRef.current = scanner;

    Html5Qrcode.getCameras()
      .then((devices) => {
        if (!devices || devices.length === 0) {
          setCameraError("No camera devices found.");
          return;
        }

        const camera =
          devices.find((d) =>
            d.label.toLowerCase().includes("back") ||
            d.label.toLowerCase().includes("rear") ||
            d.label.toLowerCase().includes("environment")
          ) || devices[devices.length - 1];

        return scanner.start(
          camera.id,
          {
            fps: SCAN_FPS,
            // Wide rectangle suits barcodes; tall enough for QR fallback
            qrbox: { width: 300, height: 120 },
            aspectRatio: 1.7,   // landscape-ish to fill a phone screen naturally
          },
          handleBarcode,
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
  }, [handleBarcode, demoMode]);

  const handleDemoSimulateScan = () => {
    if (!demoSample) {
      toast.error("No sample products in this workspace.");
      return;
    }
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 1200);
    setScannedItem(demoSample);
  };

  const handleClose = () => {
    setScannedItem(null);
    lastScannedRef.current = null;
  };

  const handleStockChange = (newCount: number) => {
    setScannedItem((prev) => (prev ? { ...prev, stock_count: newCount } : null));
  };

  if (demoMode) {
    return (
      <div className="relative flex h-full flex-col items-center justify-center overflow-hidden bg-background">
        <div className="relative flex w-full flex-1 flex-col items-center justify-center gap-4 px-8 text-center">
          <CameraOff className="h-12 w-12 text-muted-foreground/50" />
          <div>
            <p className="font-medium text-foreground">Camera off in demo mode</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Preview the scan flow with sample inventory data — no camera or barcode
              hardware required.
            </p>
          </div>
          <Button size="lg" className="rounded-xl" onClick={handleDemoSimulateScan}>
            Simulate barcode scan
          </Button>
        </div>

        <ScanSuccessAnimation show={showSuccess} />
        <ProductCardOverlay
          item={scannedItem}
          onClose={handleClose}
          onStockChange={handleStockChange}
        />
      </div>
    );
  }

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

        {/* Wide barcode scan frame */}
        {isStarted && !scannedItem && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="relative h-28 w-72">
              {/* Corner markers — wide rectangle for barcodes */}
              {(["top-0 left-0", "top-0 right-0", "bottom-0 left-0", "bottom-0 right-0"] as const).map(
                (pos, i) => (
                  <div
                    key={i}
                    className={`absolute h-6 w-8 ${pos} border-white ${
                      i === 0 ? "border-t-2 border-l-2 rounded-tl-sm"
                      : i === 1 ? "border-t-2 border-r-2 rounded-tr-sm"
                      : i === 2 ? "border-b-2 border-l-2 rounded-bl-sm"
                      : "border-b-2 border-r-2 rounded-br-sm"
                    }`}
                  />
                )
              )}
              {/* Horizontal scan line animation */}
              <div className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-white/40" />
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
            Align the barcode within the frame to scan
          </p>
        </div>
      )}
    </div>
  );
}
