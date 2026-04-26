import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { HistoryList } from "@/features/history/components/HistoryList";

export default function HistoryPage() {
  return (
    <div className="mx-auto max-w-4xl px-6 py-16">
      <div className="mb-10 flex animate-fade-in items-center gap-4 border-b border-white/[0.04] pb-8">
        <Link to="/">
          <Button variant="ghost" size="icon" className="text-muted-foreground/50 hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <p className="mb-1 text-[11px] uppercase tracking-[0.15em] text-muted-foreground/40">
            Archive
          </p>
          <h1 className="font-serif text-3xl tracking-tight">Extraction History</h1>
        </div>
      </div>
      <div className="animate-slide-up stagger-1">
        <HistoryList />
      </div>
    </div>
  );
}
