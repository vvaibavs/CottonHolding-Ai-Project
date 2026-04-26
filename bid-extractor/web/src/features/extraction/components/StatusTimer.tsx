import { useEffect, useRef, useState } from "react";

const STATUS_LABELS: Record<string, string> = {
  pending: "Queued",
  parsing: "Extracting text from document...",
  extracting: "Analyzing with Gemini AI...",
  complete: "Complete",
  failed: "Failed",
};

const STEP_ORDER = ["pending", "parsing", "extracting", "complete"];

export function StatusTimer({
  status,
  statusMessage,
}: {
  status: string;
  statusMessage?: string | null;
}) {
  const [elapsed, setElapsed] = useState(0);
  const startRef = useRef(Date.now());
  const notifiedRef = useRef(false);

  useEffect(() => {
    if (status === "complete" || status === "failed") {
      if (!notifiedRef.current && "Notification" in window) {
        notifiedRef.current = true;
        if (Notification.permission === "granted") {
          new Notification(
            status === "complete"
              ? "Extraction complete!"
              : "Extraction failed",
          );
        } else if (Notification.permission !== "denied") {
          Notification.requestPermission();
        }
      }
      return;
    }

    const timer = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startRef.current) / 1000));
    }, 1000);
    return () => clearInterval(timer);
  }, [status]);

  const done = status === "complete" || status === "failed";
  const label = statusMessage ?? STATUS_LABELS[status] ?? status;
  const stepIdx = STEP_ORDER.indexOf(status);
  const progressPct =
    status === "failed"
      ? 0
      : status === "complete"
        ? 100
        : Math.max(5, (stepIdx / (STEP_ORDER.length - 1)) * 100);

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2.5">
        {!done && (
          <div className="h-3 w-3 animate-spin rounded-full border border-foreground/20 border-t-foreground/60" />
        )}
        {status === "complete" && (
          <div className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,.4)]" />
        )}
        {status === "failed" && (
          <div className="h-2 w-2 rounded-full bg-destructive shadow-[0_0_8px_rgba(220,38,38,.4)]" />
        )}
        <p className="text-xs text-muted-foreground/70">
          {label}
          {!done && (
            <span className="ml-2 tabular-nums text-muted-foreground/30">
              {elapsed}s
            </span>
          )}
        </p>
      </div>
      {!done && (
        <div className="h-[2px] w-full overflow-hidden rounded-full bg-white/[0.04]">
          <div
            className="h-full rounded-full bg-gradient-to-r from-foreground/30 to-foreground/50 transition-all duration-700 ease-out"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      )}
    </div>
  );
}
