"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Download, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function InstallPrompt() {
  const [promptEvent, setPromptEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [show, setShow] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Already installed as standalone — don't show
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
      return;
    }

    // Check if dismissed recently (don't nag again for 3 days)
    const dismissed = localStorage.getItem("scanly-install-dismissed");
    if (dismissed && Date.now() - parseInt(dismissed) < 3 * 24 * 60 * 60 * 1000) return;

    // iOS detection — Safari doesn't support beforeinstallprompt
    const ios =
      /iphone|ipad|ipod/i.test(navigator.userAgent) &&
      !(window.navigator as { standalone?: boolean }).standalone;
    setIsIOS(ios);

    if (ios) {
      // Show iOS manual instructions after a short delay
      setTimeout(() => setShow(true), 2000);
      return;
    }

    // Android / Chrome — listen for the native install prompt
    const handler = (e: Event) => {
      e.preventDefault();
      setPromptEvent(e as BeforeInstallPromptEvent);
      setTimeout(() => setShow(true), 1500);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!promptEvent) return;
    await promptEvent.prompt();
    const { outcome } = await promptEvent.userChoice;
    if (outcome === "accepted") {
      setShow(false);
      setIsInstalled(true);
    }
  };

  const handleDismiss = () => {
    setShow(false);
    localStorage.setItem("scanly-install-dismissed", Date.now().toString());
  };

  if (isInstalled) return null;

  return (
    <AnimatePresence>
      {show && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleDismiss}
          />

          {/* Bottom sheet */}
          <motion.div
            className="fixed bottom-0 left-0 right-0 z-50 mx-auto max-w-md"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 350, damping: 30 }}
          >
            <div className="rounded-t-2xl border-t border-border bg-card px-5 pb-10 pt-5">
              {/* Drag handle */}
              <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-border" />

              {/* Dismiss button */}
              <button
                onClick={handleDismiss}
                className="absolute right-4 top-4 rounded-full p-1.5 text-muted-foreground hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>

              {/* Logo + text */}
              <div className="flex items-center gap-4 mb-5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/icons/icon-192.png"
                  alt="Scanly"
                  className="h-16 w-16 rounded-2xl border border-border shadow-lg"
                />
                <div>
                  <p className="text-lg font-bold">Install Scanly</p>
                  <p className="text-sm text-muted-foreground">
                    Add to your home screen for quick access
                  </p>
                </div>
              </div>

              {/* Feature pills */}
              <div className="mb-5 flex flex-wrap gap-2">
                {["Works offline", "Barcode scanner", "Real-time stock"].map((f) => (
                  <span
                    key={f}
                    className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary"
                  >
                    {f}
                  </span>
                ))}
              </div>

              {isIOS ? (
                // iOS manual instructions
                <div className="flex flex-col gap-3">
                  <p className="text-sm text-muted-foreground">
                    To install on iPhone:
                  </p>
                  <ol className="flex flex-col gap-2 text-sm">
                    <li className="flex items-center gap-2">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground">1</span>
                      Tap the <strong>Share</strong> button in Safari&apos;s toolbar
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground">2</span>
                      Scroll down and tap <strong>Add to Home Screen</strong>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground">3</span>
                      Tap <strong>Add</strong> in the top right
                    </li>
                  </ol>
                  <Button variant="outline" className="mt-2 w-full" onClick={handleDismiss}>
                    Got it
                  </Button>
                </div>
              ) : (
                // Android install button
                <Button className="w-full gap-2 h-12 text-base" onClick={handleInstall}>
                  <Download className="h-5 w-5" />
                  Install App
                </Button>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
