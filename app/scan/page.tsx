import dynamic from "next/dynamic";
import { ScanLine } from "lucide-react";

// Dynamically import to avoid SSR camera API issues
const QRScanner = dynamic(
  () =>
    import("@/components/scanner/QRScanner").then((mod) => mod.QRScanner),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full flex-col items-center justify-center gap-3">
        <ScanLine className="h-10 w-10 animate-pulse text-primary" />
        <p className="text-sm text-muted-foreground">Loading scanner…</p>
      </div>
    ),
  }
);

export default function ScanPage() {
  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col">
      {/* Header */}
      <div className="px-4 pt-6 pb-3">
        <h1 className="text-2xl font-bold tracking-tight">Scanner</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Scan a QR code to manage stock
        </p>
      </div>

      {/* Scanner fills remaining space */}
      <div className="relative flex-1 overflow-hidden rounded-t-2xl">
        <QRScanner />
      </div>
    </div>
  );
}
