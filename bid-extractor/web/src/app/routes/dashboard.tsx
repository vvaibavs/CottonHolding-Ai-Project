import { LogOut } from "lucide-react";
import { useMemo } from "react";
import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { useSession } from "@/features/auth/api/useSession";
import { UploadDropzone } from "@/features/extraction/components/UploadDropzone";
import { HistoryList } from "@/features/history/components/HistoryList";
import { useHistory } from "@/features/history/api/useHistory";
import { supabase } from "@/lib/supabase";

export default function DashboardPage() {
  const { data: session } = useSession();
  const { data: history } = useHistory();

  const stats = useMemo(() => {
    if (!history || history.length === 0) return null;
    const total = history.length;
    const complete = history.filter((r) => r.status === "complete").length;
    const failed = history.filter((r) => r.status === "failed").length;
    const inProgress = total - complete - failed;
    return { total, complete, failed, inProgress };
  }, [history]);

  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <header className="mb-12 flex items-end justify-between border-b border-border pb-6">
        <div>
          <h1 className="font-serif text-4xl tracking-tight">Bid Extractor</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Upload a bid document to extract a structured analysis
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground">
            {session?.user.email}
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="text-muted-foreground hover:text-foreground"
            onClick={() => supabase.auth.signOut()}
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </header>

      {stats && (
        <div className="mb-10 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-lg border border-border bg-card p-4">
            <div className="flex items-center gap-2 text-muted-foreground">
              <div className="h-2 w-2 rounded-full bg-foreground/60" />
              <span className="text-[10px] uppercase tracking-widest">
                Total
              </span>
            </div>
            <p className="mt-2 text-2xl font-light tabular-nums tracking-tight">
              {stats.total}
            </p>
          </div>
          <div className="rounded-lg border border-border bg-card p-4">
            <div className="flex items-center gap-2 text-emerald-500">
              <div className="h-2 w-2 rounded-full bg-emerald-500" />
              <span className="text-[10px] uppercase tracking-widest">
                Complete
              </span>
            </div>
            <p className="mt-2 text-2xl font-light tabular-nums tracking-tight">
              {stats.complete}
            </p>
          </div>
          <div className="rounded-lg border border-border bg-card p-4">
            <div className="flex items-center gap-2 text-yellow-500">
              <div className="h-2 w-2 rounded-full bg-yellow-500" />
              <span className="text-[10px] uppercase tracking-widest">
                In Progress
              </span>
            </div>
            <p className="mt-2 text-2xl font-light tabular-nums tracking-tight">
              {stats.inProgress}
            </p>
          </div>
          <div className="rounded-lg border border-border bg-card p-4">
            <div className="flex items-center gap-2 text-destructive">
              <div className="h-2 w-2 rounded-full bg-destructive" />
              <span className="text-[10px] uppercase tracking-widest">
                Failed
              </span>
            </div>
            <p className="mt-2 text-2xl font-light tabular-nums tracking-tight">
              {stats.failed}
            </p>
          </div>
        </div>
      )}

      <div className="space-y-12">
        <UploadDropzone />

        <section>
          <div className="mb-4 flex items-end justify-between">
            <h2 className="font-serif text-xl tracking-tight">
              Recent Extractions
            </h2>
            <Link to="/history">
              <Button
                variant="link"
                size="sm"
                className="text-muted-foreground hover:text-foreground"
              >
                View all
              </Button>
            </Link>
          </div>
          <HistoryList />
        </section>
      </div>
    </div>
  );
}
