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
    <div className="mx-auto max-w-4xl px-6 py-16">
      <header className="mb-16 animate-fade-in border-b border-white/[0.04] pb-8">
        <div className="flex items-end justify-between">
          <div>
            <p className="mb-2 text-[11px] uppercase tracking-[0.2em] text-muted-foreground/40">
              Document Intelligence
            </p>
            <h1 className="font-serif text-5xl tracking-tight">Bid Extractor</h1>
            <p className="mt-2 text-sm text-muted-foreground/60">
              Upload a bid document to extract a structured analysis
            </p>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs text-muted-foreground/40">
              {session?.user.email}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="text-muted-foreground/40 hover:text-foreground"
              onClick={() => supabase.auth.signOut()}
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      {stats && (
        <div className="mb-14 grid animate-fade-in grid-cols-2 gap-3 stagger-1 sm:grid-cols-4">
          {[
            { label: "Total", value: stats.total, color: "bg-foreground/50" },
            { label: "Complete", value: stats.complete, color: "bg-emerald-500" },
            { label: "In Progress", value: stats.inProgress, color: "bg-yellow-500" },
            { label: "Failed", value: stats.failed, color: "bg-destructive" },
          ].map((stat) => (
            <div
              key={stat.label}
              className="group rounded-xl border border-white/[0.04] bg-white/[0.015] p-5 transition-all duration-300 hover:border-white/[0.08] hover:bg-white/[0.025]"
            >
              <div className="flex items-center gap-2">
                <div className={`h-1.5 w-1.5 rounded-full ${stat.color}`} />
                <span className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground/50">
                  {stat.label}
                </span>
              </div>
              <p className="mt-3 font-serif text-3xl font-light tabular-nums tracking-tight text-foreground/80">
                {stat.value}
              </p>
            </div>
          ))}
        </div>
      )}

      <div className="space-y-16">
        <div className="animate-slide-up stagger-2">
          <UploadDropzone />
        </div>

        <section className="animate-slide-up stagger-3">
          <div className="mb-6 flex items-end justify-between">
            <h2 className="font-serif text-2xl tracking-tight">
              Recent Extractions
            </h2>
            <Link to="/history">
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-muted-foreground/50 hover:text-foreground"
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
