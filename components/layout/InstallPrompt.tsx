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
                <div className="flex flex-col gap-4">
                  {/* Step cards */}
                  <div className="flex flex-col gap-2">
                    {/* Step 1 */}
                    <div className="flex items-center gap-3 rounded-xl bg-secondary px-3 py-2.5">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground">1</span>
                      <p className="text-sm">
                        Tap the{" "}
                        <span className="inline-flex items-center gap-1 rounded-md bg-background px-1.5 py-0.5 font-medium">
                          {/* Safari share icon */}
                          <svg className="h-4 w-4 text-blue-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>
                            <polyline points="16 6 12 2 8 6"/>
                            <line x1="12" y1="2" x2="12" y2="15"/>
                          </svg>
                          Share
                        </span>{" "}
                        button at the bottom of Safari
                      </p>
                    </div>

                    {/* Step 2 */}
                    <div className="flex items-center gap-3 rounded-xl bg-secondary px-3 py-2.5">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground">2</span>
                      <p className="text-sm">
                        Scroll and tap{" "}
                        <span className="inline-flex items-center gap-1 rounded-md bg-background px-1.5 py-0.5 font-medium">
                          <svg className="h-4 w-4 text-blue-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="3" y="3" width="18" height="18" rx="2"/>
                            <line x1="12" y1="8" x2="12" y2="16"/>
                            <line x1="8" y1="12" x2="16" y2="12"/>
                          </svg>
                          Add to Home Screen
                        </span>
                      </p>
                    </div>

                    {/* Step 3 */}
                    <div className="flex items-center gap-3 rounded-xl bg-secondary px-3 py-2.5">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground">3</span>
                      <p className="text-sm">
                        Tap{" "}
                        <span className="rounded-md bg-blue-500 px-2 py-0.5 text-xs font-bold text-white">
                          Add
                        </span>{" "}
                        in the top-right corner
                      </p>
                    </div>
                  </div>

                  <Button variant="outline" className="w-full" onClick={handleDismiss}>
                    Got it
                  </Button>

                  {/* Animated arrow pointing to Safari toolbar */}
                  <div className="flex flex-col items-center gap-1 pb-1">
                    <p className="text-xs text-muted-foreground">Tap the Share button here</p>
                    <motion.div
                      animate={{ y: [0, 6, 0] }}
                      transition={{ repeat: Infinity, duration: 1.2, ease: "easeInOut" }}
                    >
                      <svg className="h-6 w-6 text-primary" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 16l-6-6h12l-6 6z"/>
                      </svg>
                    </motion.div>
                  </div>
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
