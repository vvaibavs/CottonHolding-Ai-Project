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
    }, 400);
  }, []);

  if (!mounted) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{
        transition: "opacity 400ms ease, backdrop-filter 400ms ease",
        opacity: visible ? 1 : 0,
        backgroundColor: visible ? "rgba(0,0,0,.6)" : "rgba(0,0,0,0)",
        backdropFilter: visible ? "blur(8px)" : "blur(0px)",
      }}
      onClick={dismiss}
    >
      <div
        className="w-full max-w-md rounded-2xl border border-white/[0.06] bg-[#0f0f12]/95 p-8 shadow-2xl backdrop-blur-xl"
        style={{
          transition: "opacity 400ms ease, transform 400ms cubic-bezier(0.16, 1, 0.3, 1)",
          opacity: visible ? 1 : 0,
          transform: visible ? "scale(1) translateY(0)" : "scale(0.96) translateY(20px)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground/40">
          Before you begin
        </p>
        <h2 className="mt-2 font-serif text-2xl tracking-tight text-foreground">
          Welcome to Bid Extractor
        </h2>
        <div className="mt-5 h-px w-full bg-gradient-to-r from-white/[0.08] via-white/[0.04] to-transparent" />

        <div className="mt-6 space-y-5 text-sm leading-relaxed text-muted-foreground/70">
          <div className="flex gap-4">
            <div className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-orange-500/[0.08]">
              <div className="h-1.5 w-1.5 rounded-full bg-orange-500/70" />
            </div>
            <p>
              <span className="font-medium text-foreground/90">Cold starts after inactivity.</span>{" "}
              The server sleeps after periods of inactivity. You should wait 1-2 minutes while it wakes up to make your first request.
            </p>
          </div>

          <div className="flex gap-4">
            <div className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-yellow-500/[0.08]">
              <div className="h-1.5 w-1.5 rounded-full bg-yellow-500/70" />
            </div>
            <p>
              <span className="font-medium text-foreground/90">Slower processing speeds.</span>{" "}
              The backend runs on a free-tier server, so extracting text from documents may take several minutes.
            </p>
          </div>

          <div className="flex gap-4">
            <div className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-500/[0.08]">
              <div className="h-1.5 w-1.5 rounded-full bg-blue-500/70" />
            </div>
            <p>
              <span className="font-medium text-foreground/90">20 requests per day.</span>{" "}
              The free tier is limited to 20 document extractions per day across all users.
            </p>
          </div>

          <div className="flex gap-4">
            <div className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-red-500/[0.08]">
              <div className="h-1.5 w-1.5 rounded-full bg-red-500/70" />
            </div>
            <p>
              <span className="font-medium text-foreground/90">No data retention guarantee.</span>{" "}
              Uploaded documents and results are not covered by zero-retention policies on the free tier. Do not upload sensitive or confidential files.
            </p>
          </div>
        </div>

        <Button className="mt-8 w-full" onClick={dismiss}>
          I Understand
        </Button>
      </div>
    </div>
  );
}
