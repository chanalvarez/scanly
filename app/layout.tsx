import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { BottomNav } from "@/components/layout/BottomNav";
import { DemoGuard } from "@/components/DemoGuard";
import { InstallPrompt } from "@/components/layout/InstallPrompt";
import { Toaster } from "sonner";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Scanly — Inventory Manager",
  description: "Professional mobile-first inventory management with barcode scanning",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Scanly",
    startupImage: "/icons/icon-512.png",
  },
  icons: {
    apple: "/icons/icon-192.png",
    icon: "/icons/icon-512.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#6366f1",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={inter.className}>
        <DemoGuard>
          <div className="mx-auto min-h-screen max-w-md">
            <main className="pb-16">{children}</main>
            <BottomNav />
          </div>
        </DemoGuard>
        <InstallPrompt />
        <Toaster
          position="top-center"
          toastOptions={{
            style: {
              background: "hsl(222 47% 9%)",
              border: "1px solid hsl(222 47% 16%)",
              color: "hsl(213 31% 91%)",
            },
          }}
        />
      </body>
    </html>
  );
}
