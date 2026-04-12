"use client";

import {
  createContext,
  useCallback,
  useContext,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const FIVERR_URL = "https://www.fiverr.com/chanalvarez";

const BANNER_STYLE: CSSProperties = {
  background: "rgba(0,0,0,0.85)",
  backdropFilter: "blur(12px)",
  WebkitBackdropFilter: "blur(12px)",
  color: "white",
  fontSize: 13,
  padding: "10px 20px",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  position: "fixed",
  top: 0,
  left: 0,
  right: 0,
  zIndex: 9999,
  gap: 12,
};

const DEMO_CONTENT_PT = 52;

type DemoBlockContextValue = {
  blockAction: () => void;
};

const DemoBlockContext = createContext<DemoBlockContextValue | null>(null);

/**
 * Call from client handlers before mutating data. Returns true if the action
 * was blocked (demo modal shown).
 */
export function useDemoBlockAction(): () => boolean {
  const ctx = useContext(DemoBlockContext);
  return useCallback(() => {
    if (process.env.NEXT_PUBLIC_IS_DEMO !== "true") return false;
    ctx?.blockAction();
    return true;
  }, [ctx]);
}

export function DemoGuard({ children }: { children: ReactNode }) {
  const [restrictionOpen, setRestrictionOpen] = useState(false);
  const isDemo = process.env.NEXT_PUBLIC_IS_DEMO === "true";

  if (!isDemo) {
    return <>{children}</>;
  }

  return (
    <DemoBlockContext.Provider
      value={{ blockAction: () => setRestrictionOpen(true) }}
    >
      <header style={BANNER_STYLE}>
        <p className="min-w-0 flex-1 leading-snug">
          <span className="block">🔍 Demo Mode — Data is simulated.</span>
          <span className="block opacity-90">This is a portfolio preview.</span>
        </p>
        <a
          href={FIVERR_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 rounded-md bg-white/15 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-white/25"
        >
          View on Fiverr
        </a>
      </header>

      <div style={{ paddingTop: DEMO_CONTENT_PT }}>{children}</div>

      <DialogPrimitive.Root
        open={restrictionOpen}
        onOpenChange={setRestrictionOpen}
      >
        <DialogPrimitive.Portal>
          <DialogPrimitive.Overlay
            className={cn(
              "fixed inset-0 z-[10040] bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
            )}
          />
          <DialogPrimitive.Content
            className={cn(
              "fixed left-[50%] top-[50%] z-[10050] grid w-[calc(100%-2rem)] max-w-md translate-x-[-50%] translate-y-[-50%] gap-4 rounded-xl border border-border bg-background p-6 text-foreground shadow-lg duration-200",
              "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95"
            )}
          >
            <div className="flex flex-col space-y-1.5 pr-8 text-center sm:text-left">
              <DialogPrimitive.Title className="text-lg font-semibold leading-none tracking-tight">
                Demo Restriction
              </DialogPrimitive.Title>
              <DialogPrimitive.Description className="text-sm text-muted-foreground">
                This action is disabled in demo mode. Contact me to see the full
                version.
              </DialogPrimitive.Description>
            </div>

            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <DialogPrimitive.Close asChild>
                <Button type="button" variant="outline">
                  Got it
                </Button>
              </DialogPrimitive.Close>
              <Button type="button" asChild>
                <a
                  href={FIVERR_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Hire Me on Fiverr
                </a>
              </Button>
            </div>

            <DialogPrimitive.Close className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </DialogPrimitive.Close>
          </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>
    </DemoBlockContext.Provider>
  );
}
