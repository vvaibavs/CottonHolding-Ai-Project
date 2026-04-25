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
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-xs text-muted-foreground">Loading extraction...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4">
        <div className="rounded-lg border border-destructive/20 bg-destructive/5 px-6 py-4">
          <p className="text-sm text-destructive">
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

  const handleCitationClick = (page: number) => {
    if (!isWide) setMobileTab("document");
    const wasCollapsed = isWide && pdfCollapsed;
    if (wasCollapsed) setPdfCollapsed(false);
    setTimeout(
      () => viewerRef.current?.scrollToPage(page),
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
    <>
      <div className="mb-6 flex items-center gap-3">
        <Link to="/">
          <Button
            variant="ghost"
            size="icon"
            className="text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
            <h1 className="truncate font-serif text-lg tracking-tight">
              {data.file_name}
            </h1>
          </div>
          <StatusTimer
            status={data.status}
            statusMessage={data.status_message}
          />
        </div>
        <div className="flex shrink-0 items-center gap-1">
          {parsedResult && (
            <>
              <Button
                variant="ghost"
                size="icon"
                className="text-muted-foreground hover:text-foreground"
                onClick={handleExportJson}
                title="Export JSON"
              >
                <Download className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="text-muted-foreground hover:text-foreground"
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
              className="text-muted-foreground hover:text-foreground"
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
            <CardTitle>Processing</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Your document is being analyzed. This usually takes 30–60 seconds.
            </p>
          </CardContent>
        </Card>
      )}

      {data.status === "failed" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-destructive">
              Extraction Failed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">{data.error_message ?? "Unknown error"}</p>
          </CardContent>
        </Card>
      )}

      {data.status === "complete" && parsedResult && (
        <ExtractionResults
          data={parsedResult}
          jobId={id!}
          questions={parsedQuestions}
          onCitationClick={handleCitationClick}
        />
      )}

      {data.status === "complete" && !parsedResult && (
        <Card>
          <CardHeader>
            <CardTitle className="text-destructive">
              Invalid Extraction Result
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">
              The AI returned data that doesn't match the expected schema.
              Please try uploading the document again.
            </p>
          </CardContent>
        </Card>
      )}
    </>
  );

  const PdfPanel = pdfUrl ? (
    <PdfViewer ref={viewerRef} url={pdfUrl} className="w-full" />
  ) : (
    <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
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
        {/* Left — Results */}
        <div
          className={
            pdfCollapsed
              ? "flex-1 overflow-y-auto p-6"
              : "shrink-0 overflow-y-auto p-6"
          }
          style={pdfCollapsed ? undefined : { width: `${splitPercent}%` }}
        >
          {ResultsContent}
        </div>

        {/* Drag handle */}
        {!pdfCollapsed && (
          <div
            className="group flex w-1.5 shrink-0 cursor-col-resize items-center justify-center bg-border/40 transition-colors hover:bg-primary/20 active:bg-primary/30"
            onPointerDown={onPointerDown}
            onDoubleClick={() => setSplitPercent(50)}
            title="Drag to resize &middot; Double-click to reset"
          >
            <div className="flex flex-col gap-1">
              <div className="h-1 w-1 rounded-full bg-muted-foreground/30 transition-colors group-hover:bg-primary/60" />
              <div className="h-1 w-1 rounded-full bg-muted-foreground/30 transition-colors group-hover:bg-primary/60" />
              <div className="h-1 w-1 rounded-full bg-muted-foreground/30 transition-colors group-hover:bg-primary/60" />
            </div>
          </div>
        )}

        {/* Right — PDF viewer (stays mounted when collapsed for instant citation jumps) */}
        <div
          className={
            pdfCollapsed
              ? "hidden"
              : "min-w-0 flex-1 overflow-y-auto bg-muted p-4"
          }
        >
          {PdfPanel}
        </div>
      </div>
    );
  }

  // Mobile: tab switcher
  return (
    <div className="flex h-screen flex-col">
      <div className="flex shrink-0 border-b border-border bg-card/50">
        {(["results", "document"] as const).map((tab) => (
          <button
            key={tab}
            className={`flex flex-1 items-center justify-center gap-2 py-3 text-xs uppercase tracking-widest transition-colors ${
              mobileTab === tab
                ? "border-b-2 border-foreground text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
            onClick={() => setMobileTab(tab)}
          >
            {tab === "results" ? "Analysis" : "Document"}
          </button>
        ))}
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        {mobileTab === "results" ? ResultsContent : PdfPanel}
      </div>
    </div>
  );
}
