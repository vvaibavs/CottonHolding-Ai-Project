import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { HistoryList } from "@/features/history/components/HistoryList";

export default function HistoryPage() {
  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <div className="mb-8 flex items-center gap-3 border-b border-border pb-6">
        <Link to="/">
          <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="font-serif text-2xl tracking-tight">Extraction History</h1>
      </div>
      <HistoryList />
    </div>
  );
}
