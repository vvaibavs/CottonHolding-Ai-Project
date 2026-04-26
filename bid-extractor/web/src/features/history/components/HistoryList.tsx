import { FileText, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";

import { useDeleteExtraction } from "../api/useDeleteExtraction";
import { useHistory } from "../api/useHistory";

const STATUS_COLOR: Record<string, "default" | "secondary" | "destructive"> = {
  complete: "default",
  failed: "destructive",
  pending: "secondary",
  parsing: "secondary",
  extracting: "secondary",
};

export function HistoryList() {
  const { data, isLoading, error } = useHistory();
  const { mutate: deleteExtraction, isPending: isDeleting } =
    useDeleteExtraction();

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="h-[72px] animate-pulse rounded-xl border border-white/[0.03] bg-white/[0.01]"
            style={{ animationDelay: `${i * 100}ms` }}
          />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <p className="text-sm text-destructive">
        Failed to load history: {(error as Error).message}
      </p>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-white/[0.06] py-16">
        <FileText className="mb-3 h-6 w-6 text-muted-foreground/30" />
        <p className="text-sm text-muted-foreground/50">
          No extractions yet. Upload a bid document to get started.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {data.map((row, i) => (
        <div
          key={row.id}
          className="group flex items-center gap-4 rounded-xl border border-white/[0.04] bg-white/[0.01] p-4 transition-all duration-300 hover:border-white/[0.08] hover:bg-white/[0.025]"
          style={{ animationDelay: `${i * 30}ms` }}
        >
          <FileText className="h-4 w-4 shrink-0 text-muted-foreground/30 transition-colors duration-200 group-hover:text-muted-foreground/60" />
          <Link to={`/extraction/${row.id}`} className="min-w-0 flex-1">
            <p className="truncate text-sm text-foreground/80 transition-colors duration-200 group-hover:text-foreground">
              {row.file_name}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground/40">
              {formatDate(row.created_at)}
            </p>
          </Link>
          <Badge variant={STATUS_COLOR[row.status] ?? "secondary"} className="text-[10px]">
            {row.status}
          </Badge>
          <Button
            variant="ghost"
            size="icon"
            className="shrink-0 text-muted-foreground/20 opacity-0 transition-all duration-200 hover:text-destructive group-hover:opacity-100"
            disabled={isDeleting}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              deleteExtraction(row.id);
            }}
            aria-label="Delete extraction"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      ))}
    </div>
  );
}
