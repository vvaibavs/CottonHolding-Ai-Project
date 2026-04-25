import { LogOut } from "lucide-react";
import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { useSession } from "@/features/auth/api/useSession";
import { UploadDropzone } from "@/features/extraction/components/UploadDropzone";
import { HistoryList } from "@/features/history/components/HistoryList";
import { supabase } from "@/lib/supabase";

export default function DashboardPage() {
  const { data: session } = useSession();

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

      <div className="space-y-12">
        <UploadDropzone />

        <section>
          <div className="mb-4 flex items-end justify-between">
            <h2 className="font-serif text-xl tracking-tight">Recent Extractions</h2>
            <Link to="/history">
              <Button variant="link" size="sm" className="text-muted-foreground hover:text-foreground">
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
