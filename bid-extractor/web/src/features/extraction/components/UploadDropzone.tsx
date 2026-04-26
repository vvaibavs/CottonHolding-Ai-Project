import { FileText, Upload, X } from "lucide-react";
import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";

import { Button } from "@/components/ui/button";
import { cn, formatBytes } from "@/lib/utils";

import { useCreateExtraction } from "../api/useCreateExtraction";

const BUDGET_MIN = 0;
const BUDGET_MAX = 4096;

function percentToBudget(pct: number): number {
  return Math.round(BUDGET_MIN + (pct / 100) * (BUDGET_MAX - BUDGET_MIN));
}

export function UploadDropzone() {
  const mutation = useCreateExtraction();
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [budgetPct, setBudgetPct] = useState(100);

  const onDrop = useCallback((accepted: File[]) => {
    const file = accepted[0];
    if (file) setPendingFile(file);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
        [".docx"],
    },
    maxSize: 50 * 1024 * 1024,
    multiple: false,
    disabled: mutation.isPending || !!pendingFile,
  });

  function handleSubmit() {
    if (!pendingFile) return;
    mutation.mutate({ file: pendingFile, thinkingBudget: percentToBudget(budgetPct) });
  }

  const budget = percentToBudget(budgetPct);

  return (
    <div>
      {!pendingFile ? (
        <div
          {...getRootProps()}
          className={cn(
            "flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed p-20 transition-all duration-300",
            isDragActive
              ? "border-foreground/30 bg-white/[0.03]"
              : "border-white/[0.06] hover:border-white/[0.12] hover:bg-white/[0.015]",
          )}
        >
          <input {...getInputProps()} />
          <Upload className="mb-5 h-7 w-7 text-muted-foreground/30" />
          {isDragActive ? (
            <p className="font-serif text-lg text-foreground/80">Drop your file here</p>
          ) : (
            <div className="text-center">
              <p className="font-serif text-lg text-foreground/70">
                Drag & drop a PDF or DOCX file
              </p>
              <p className="mt-2 text-xs text-muted-foreground/40">
                or click to browse &middot; max 50 MB
              </p>
            </div>
          )}
          <Button variant="outline" size="sm" className="mt-8">
            Select File
          </Button>
        </div>
      ) : (
        <div className="space-y-5 rounded-xl border border-white/[0.06] bg-white/[0.02] p-7 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div className="flex min-w-0 items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/[0.04]">
                <FileText className="h-5 w-5 text-muted-foreground/60" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm text-foreground/90">
                  {pendingFile.name}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground/40">
                  {formatBytes(pendingFile.size)}
                </p>
              </div>
            </div>
            <button
              onClick={() => setPendingFile(null)}
              className="ml-3 shrink-0 text-muted-foreground/30 transition-colors duration-200 hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="h-px bg-white/[0.04]" />

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-[11px] uppercase tracking-[0.15em] text-muted-foreground/50">
                Thinking Budget
              </label>
              <span className="tabular-nums text-xs text-foreground/60">
                {budgetPct}% &middot; {budget.toLocaleString()} tokens
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              value={budgetPct}
              onChange={(e) => setBudgetPct(Number(e.target.value))}
              className="w-full accent-foreground"
            />
            <div className="flex justify-between text-[10px] text-muted-foreground/30">
              <span>Faster</span>
              <span>More thorough</span>
            </div>
          </div>

          <Button
            onClick={handleSubmit}
            disabled={mutation.isPending}
            className="w-full"
          >
            {mutation.isPending ? "Uploading..." : "Analyse Document"}
          </Button>
        </div>
      )}
      {mutation.isError && (
        <p className="mt-3 text-sm text-destructive">
          {mutation.error.message}
        </p>
      )}
      <p className="mt-4 text-xs text-muted-foreground/30">
        Uses Gemini AI. Limited to 20 requests per day. Do not upload confidential documents on the free tier.
      </p>
    </div>
  );
}
