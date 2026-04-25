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
    <div className="space-y-1.5">
      <div className="flex items-center gap-2">
        {!done && (
          <div className="h-3 w-3 animate-spin rounded-full border border-muted-foreground border-t-transparent" />
        )}
        {status === "complete" && (
          <div className="h-2 w-2 rounded-full bg-emerald-500" />
        )}
        {status === "failed" && (
          <div className="h-2 w-2 rounded-full bg-destructive" />
        )}
        <p className="text-xs text-muted-foreground">
          {label}
          {!done && (
            <span className="ml-2 tabular-nums text-muted-foreground/60">
              {elapsed}s
            </span>
          )}
        </p>
      </div>
      {!done && (
        <div className="h-0.5 w-full overflow-hidden rounded-full bg-border">
          <div
            className="h-full rounded-full bg-muted-foreground/50 transition-all duration-700 ease-out"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      )}
    </div>
  );
}
