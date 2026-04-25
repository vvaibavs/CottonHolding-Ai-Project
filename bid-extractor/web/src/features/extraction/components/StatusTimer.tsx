import { useEffect, useRef, useState } from "react";

const STATUS_LABELS: Record<string, string> = {
  pending: "Queued",
  parsing: "Extracting text from document...",
  extracting: "Analyzing with Gemini AI...",
  complete: "Complete",
  failed: "Failed",
};

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

  return (
    <div className="flex items-center gap-3">
      {!done && (
        <div className="h-3.5 w-3.5 animate-spin rounded-full border border-muted-foreground border-t-transparent" />
      )}
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        {!done && (
          <p className="text-xs text-muted-foreground">{elapsed}s elapsed</p>
        )}
      </div>
    </div>
  );
}
