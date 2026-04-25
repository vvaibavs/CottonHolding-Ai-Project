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
            "flex cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed p-16 transition-all",
            isDragActive
              ? "border-foreground/40 bg-card"
              : "border-border hover:border-foreground/20 hover:bg-card/50",
          )}
        >
          <input {...getInputProps()} />
          <Upload className="mb-4 h-8 w-8 text-muted-foreground/60" />
          {isDragActive ? (
            <p className="text-sm text-foreground">Drop your file here</p>
          ) : (
            <div className="text-center">
              <p className="text-sm text-foreground/80">
                Drag & drop a PDF or DOCX file
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                or click to browse &middot; max 50 MB
              </p>
            </div>
          )}
          <Button variant="outline" size="sm" className="mt-6">
            Select File
          </Button>
        </div>
      ) : (
        <div className="space-y-5 rounded-lg border border-border bg-card p-6">
          <div className="flex items-center justify-between">
            <div className="flex min-w-0 items-center gap-3">
              <FileText className="h-5 w-5 shrink-0 text-muted-foreground" />
              <div className="min-w-0">
                <p className="truncate text-sm text-foreground">
                  {pendingFile.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatBytes(pendingFile.size)}
                </p>
              </div>
            </div>
            <button
              onClick={() => setPendingFile(null)}
              className="ml-3 shrink-0 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Thinking Budget
              </label>
              <span className="tabular-nums text-xs text-foreground">
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
            <div className="flex justify-between text-[10px] text-muted-foreground/60">
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
      <p className="mt-3 text-xs text-muted-foreground/60">
        Uses Gemini AI. Limited to 20 requests per day. Do not upload confidential documents on the free tier.
      </p>
    </div>
  );
}
