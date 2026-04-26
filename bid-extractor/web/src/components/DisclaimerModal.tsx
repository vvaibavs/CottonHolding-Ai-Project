import { useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";

const STORAGE_KEY = "disclaimer_seen";

export function DisclaimerModal() {
  const [visible, setVisible] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem(STORAGE_KEY)) return;
    setMounted(true);
    const raf = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  const dismiss = useCallback(() => {
    setVisible(false);
    setTimeout(() => {
      sessionStorage.setItem(STORAGE_KEY, "1");
      setMounted(false);
    }, 300);
  }, []);

  if (!mounted) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{
        transition: "opacity 300ms ease, backdrop-filter 300ms ease",
        opacity: visible ? 1 : 0,
        backgroundColor: visible ? "rgba(0,0,0,.5)" : "rgba(0,0,0,0)",
        backdropFilter: visible ? "blur(4px)" : "blur(0px)",
      }}
      onClick={dismiss}
    >
      <div
        className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-2xl"
        style={{
          transition: "opacity 300ms ease, transform 300ms ease",
          opacity: visible ? 1 : 0,
          transform: visible ? "scale(1) translateY(0)" : "scale(0.95) translateY(12px)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="font-serif text-xl tracking-tight text-foreground">
          Welcome to Bid Extractor
        </h2>
        <div className="mx-auto mt-3 h-px w-full bg-border" />

        <div className="mt-5 space-y-4 text-sm leading-relaxed text-muted-foreground">
          <div className="flex gap-3">
            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-orange-500/10 text-xs text-orange-500">~</span>
            <p>
              <span className="font-medium text-foreground">Cold starts after inactivity.</span>{" "}
              The server sleeps after periods of inactivity. You should wait 1-2 minutes while it wakes up to make your first request.
            </p>
          </div>

          <div className="flex gap-3">
            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-yellow-500/10 text-xs text-yellow-500">!</span>
            <p>
              <span className="font-medium text-foreground">Slower processing speeds.</span>{" "}
              The backend runs on a free-tier server, so extracting text from documents may take several minutes.
            </p>
          </div>

          <div className="flex gap-3">
            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-500/10 text-xs text-blue-500">#</span>
            <p>
              <span className="font-medium text-foreground">20 requests per day.</span>{" "}
              The free tier is limited to 20 document extractions per day across all users.
            </p>
          </div>

          <div className="flex gap-3">
            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-red-500/10 text-xs text-red-500">&bull;</span>
            <p>
              <span className="font-medium text-foreground">No data retention guarantee.</span>{" "}
              Uploaded documents and results are not covered by zero-retention policies on the free tier. Do not upload sensitive or confidential files.
            </p>
          </div>
        </div>

        <Button className="mt-6 w-full" onClick={dismiss}>
          I Understand
        </Button>
      </div>
    </div>
  );
}
