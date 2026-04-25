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
    return <p className="text-sm text-muted-foreground">Loading...</p>;
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
      <p className="text-sm text-muted-foreground">
        No extractions yet. Upload a bid document to get started.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {data.map((row) => (
        <div
          key={row.id}
          className="flex items-center gap-3 rounded-lg border border-border bg-card p-4 transition-all hover:bg-accent hover:border-border/80"
        >
          <FileText className="h-4 w-4 shrink-0 text-muted-foreground/60" />
          <Link to={`/extraction/${row.id}`} className="min-w-0 flex-1">
            <p className="truncate text-sm text-foreground">{row.file_name}</p>
            <p className="text-xs text-muted-foreground">
              {formatDate(row.created_at)}
            </p>
          </Link>
          <Badge variant={STATUS_COLOR[row.status] ?? "secondary"}>
            {row.status}
          </Badge>
          <Button
            variant="ghost"
            size="icon"
            className="shrink-0 text-muted-foreground/40 hover:text-destructive"
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
