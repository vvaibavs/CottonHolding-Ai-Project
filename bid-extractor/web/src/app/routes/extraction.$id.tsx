import { ArrowLeft, Download, FileText, PanelRight, Printer } from "lucide-react";
import { useCallback, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useDocumentUrl } from "@/features/extraction/api/useDocumentUrl";
import { useExtractionJob } from "@/features/extraction/api/useExtractionJob";
import { ExtractionResults } from "@/features/extraction/components/ExtractionResults";
import {
  PdfViewer,
  type PdfViewerHandle,
} from "@/features/extraction/components/PdfViewer";
import { StatusTimer } from "@/features/extraction/components/StatusTimer";
import {
  BidExtractionSchema,
  QuestionSetSchema,
} from "@/features/extraction/schemas";
import { useMediaQuery } from "@/lib/useMediaQuery";

export default function ExtractionPage() {
  const { id } = useParams<{ id: string }>();
  const viewerRef = useRef<PdfViewerHandle>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [mobileTab, setMobileTab] = useState<"results" | "document">("results");
  const [splitPercent, setSplitPercent] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const [pdfCollapsed, setPdfCollapsed] = useState(false);
  const isWide = useMediaQuery("(min-width: 1024px)");

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    setIsDragging(true);
  }, []);

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isDragging || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const pct = ((e.clientX - rect.left) / rect.width) * 100;
      setSplitPercent(Math.min(80, Math.max(25, pct)));
    },
    [isDragging],
  );

  const onPointerUp = useCallback(() => setIsDragging(false), []);

  const { data, isLoading, error } = useExtractionJob(id ?? null);
  const { data: pdfUrl } = useDocumentUrl(
    data?.status === "complete" ? (id ?? null) : null,
  );

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-7 w-7 animate-spin rounded-full border border-foreground/10 border-t-foreground/50" />
          <p className="text-xs text-muted-foreground/40">Loading extraction...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-5">
        <div className="rounded-xl border border-destructive/10 bg-destructive/[0.04] px-7 py-5">
          <p className="text-sm text-destructive/80">
            {error ? (error as Error).message : "Extraction not found"}
          </p>
        </div>
        <Link to="/">
          <Button variant="outline" size="sm">
            <ArrowLeft className="mr-2 h-3 w-3" />
            Back to dashboard
          </Button>
        </Link>
      </div>
    );
  }

  const inProgress = data.status !== "complete" && data.status !== "failed";

  let parsedResult = null;
  if (data.status === "complete" && data.result) {
    const parsed = BidExtractionSchema.safeParse(data.result);
    if (parsed.success) parsedResult = parsed.data;
  }

  let parsedQuestions = null;
  if (data.questions) {
    const qp = QuestionSetSchema.safeParse(data.questions);
    if (qp.success) parsedQuestions = qp.data;
  }

  const handleCitationClick = (page: number, verbatim?: string | null) => {
    if (!isWide) setMobileTab("document");
    const wasCollapsed = isWide && pdfCollapsed;
    if (wasCollapsed) setPdfCollapsed(false);
    setTimeout(
      () => viewerRef.current?.scrollToPage(page, verbatim),
      wasCollapsed ? 150 : isWide ? 0 : 50,
    );
  };

  const handleExportJson = () => {
    if (!parsedResult) return;
    const blob = new Blob([JSON.stringify(parsedResult, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${data.file_name.replace(/\.[^.]+$/, "")}-extraction.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const ResultsContent = (
    <div className="animate-fade-in">
      <div className="mb-8 flex items-center gap-4">
        <Link to="/">
          <Button
            variant="ghost"
            size="icon"
            className="text-muted-foreground/40 hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2.5">
            <FileText className="h-4 w-4 shrink-0 text-muted-foreground/30" />
            <h1 className="truncate font-serif text-xl tracking-tight">
              {data.file_name}
            </h1>
          </div>
          <div className="mt-1.5">
            <StatusTimer
              status={data.status}
              statusMessage={data.status_message}
            />
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          {parsedResult && (
            <>
              <Button
                variant="ghost"
                size="icon"
                className="text-muted-foreground/30 hover:text-foreground"
                onClick={handleExportJson}
                title="Export JSON"
              >
                <Download className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="text-muted-foreground/30 hover:text-foreground"
                onClick={() => window.print()}
                title="Print"
              >
                <Printer className="h-4 w-4" />
              </Button>
            </>
          )}
          {isWide && (
            <Button
              variant="ghost"
              size="icon"
              className="text-muted-foreground/30 hover:text-foreground"
              onClick={() => setPdfCollapsed(!pdfCollapsed)}
              title={pdfCollapsed ? "Show document" : "Hide document"}
            >
              <PanelRight className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {inProgress && (
        <Card>
          <CardHeader>
            <CardTitle className="font-serif text-lg font-normal tracking-tight">Processing</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground/60">
              Your document is being analyzed. This usually takes 1-2 minutes.
            </p>
          </CardContent>
        </Card>
      )}

      {data.status === "failed" && (
        <Card>
          <CardHeader>
            <CardTitle className="font-serif text-lg font-normal tracking-tight text-destructive">
              Extraction Failed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-foreground/60">{data.error_message ?? "Unknown error"}</p>
          </CardContent>
        </Card>
      )}

      {data.status === "complete" && parsedResult && (
        <ExtractionResults
          data={parsedResult}
          jobId={id!}
          questions={parsedQuestions}
          onCitationClick={handleCitationClick}
          sidebarOverlay={!pdfCollapsed}
        />
      )}

      {data.status === "complete" && !parsedResult && (
        <Card>
          <CardHeader>
            <CardTitle className="font-serif text-lg font-normal tracking-tight text-destructive">
              Invalid Extraction Result
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-foreground/60">
              The AI returned data that doesn't match the expected schema.
              Please try uploading the document again.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );

  const PdfPanel = pdfUrl ? (
    <PdfViewer ref={viewerRef} url={pdfUrl} className="w-full" />
  ) : (
    <div className="flex h-64 items-center justify-center text-sm text-muted-foreground/40">
      {inProgress
        ? "PDF preview available after extraction completes."
        : "No document available."}
    </div>
  );

  if (isWide) {
    return (
      <div
        ref={containerRef}
        className="flex h-screen overflow-hidden"
        onPointerMove={pdfCollapsed ? undefined : onPointerMove}
        onPointerUp={pdfCollapsed ? undefined : onPointerUp}
      >
        <div
          className={
            pdfCollapsed
              ? "flex-1 overflow-y-auto p-8"
              : "shrink-0 overflow-y-auto p-8"
          }
          style={pdfCollapsed ? undefined : { width: `${splitPercent}%` }}
        >
          {ResultsContent}
        </div>

        {!pdfCollapsed && (
          <div
            className="group flex w-px shrink-0 cursor-col-resize items-center justify-center bg-white/[0.04] transition-colors hover:bg-white/[0.1]"
            onPointerDown={onPointerDown}
            onDoubleClick={() => setSplitPercent(50)}
            title="Drag to resize &middot; Double-click to reset"
          >
            <div className="flex flex-col gap-1 opacity-0 transition-opacity group-hover:opacity-100">
              <div className="h-1 w-1 rounded-full bg-foreground/30" />
              <div className="h-1 w-1 rounded-full bg-foreground/30" />
              <div className="h-1 w-1 rounded-full bg-foreground/30" />
            </div>
          </div>
        )}

        <div
          className={
            pdfCollapsed
              ? "hidden"
              : "min-w-0 flex-1 overflow-y-auto bg-black/30 p-4"
          }
        >
          {PdfPanel}
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col">
      <div className="flex shrink-0 border-b border-white/[0.04] bg-black/20">
        {(["results", "document"] as const).map((tab) => (
          <button
            key={tab}
            className={`flex flex-1 items-center justify-center gap-2 py-3.5 text-[11px] uppercase tracking-[0.15em] transition-all duration-200 ${
              mobileTab === tab
                ? "border-b border-foreground/50 text-foreground"
                : "text-muted-foreground/40 hover:text-foreground/60"
            }`}
            onClick={() => setMobileTab(tab)}
          >
            {tab === "results" ? "Analysis" : "Document"}
          </button>
        ))}
      </div>
      <div className="flex-1 overflow-y-auto p-5">
        {mobileTab === "results" ? ResultsContent : PdfPanel}
      </div>
    </div>
  );
}
