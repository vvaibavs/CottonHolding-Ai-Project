import { ArrowLeft } from "lucide-react";
import { useCallback, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useDocumentUrl } from "@/features/extraction/api/useDocumentUrl";
import { useExtractionJob } from "@/features/extraction/api/useExtractionJob";
import { ExtractionResults } from "@/features/extraction/components/ExtractionResults";
import { PdfViewer, type PdfViewerHandle } from "@/features/extraction/components/PdfViewer";
import { StatusTimer } from "@/features/extraction/components/StatusTimer";
import { BidExtractionSchema, QuestionSetSchema } from "@/features/extraction/schemas";
import { useMediaQuery } from "@/lib/useMediaQuery";

export default function ExtractionPage() {
  const { id } = useParams<{ id: string }>();
  const viewerRef = useRef<PdfViewerHandle>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [mobileTab, setMobileTab] = useState<"results" | "document">("results");
  const [splitPercent, setSplitPercent] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
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
      setSplitPercent(Math.min(80, Math.max(20, pct)));
    },
    [isDragging],
  );

  const onPointerUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const { data, isLoading, error } = useExtractionJob(id ?? null);
  const { data: pdfUrl } = useDocumentUrl(
    data?.status === "complete" ? (id ?? null) : null,
  );

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8">
        <p className="text-destructive">
          {error ? (error as Error).message : "Extraction not found"}
        </p>
        <Link to="/">
          <Button variant="link" className="mt-2">
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
    // Small delay on mobile so the tab renders before we try to scroll
    setTimeout(() => viewerRef.current?.scrollToPage(page), isWide ? 0 : 50);
  };

  const ResultsContent = (
    <>
      <div className="mb-6 flex items-center gap-3">
        <Link to="/">
          <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="font-serif text-lg tracking-tight">{data.file_name}</h1>
          <StatusTimer status={data.status} statusMessage={data.status_message} />
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
            <CardTitle className="text-destructive">Extraction Failed</CardTitle>
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

  const PdfPanel = (
    <>
      {pdfUrl ? (
        <PdfViewer ref={viewerRef} url={pdfUrl} className="w-full" />
      ) : (
        <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
          {inProgress
            ? "PDF preview available after extraction completes."
            : "No document available."}
        </div>
      )}
    </>
  );

  if (isWide) {
    return (
      <div
        ref={containerRef}
        className="flex h-screen overflow-hidden"
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
      >
        {/* Left — PDF viewer */}
        <div
          className="shrink-0 overflow-y-auto bg-muted p-4"
          style={{ width: `${splitPercent}%` }}
        >
          <p className="mb-3 text-xs text-muted-foreground">
            {data.file_name}
          </p>
          {PdfPanel}
        </div>

        {/* Drag handle */}
        <div
          className="flex w-1.5 shrink-0 cursor-col-resize items-center justify-center bg-border/50 transition-colors hover:bg-border active:bg-muted-foreground/30"
          onPointerDown={onPointerDown}
        >
          <div className="h-8 w-px rounded-full bg-muted-foreground/30" />
        </div>

        {/* Right — results */}
        <div className="min-w-0 flex-1 overflow-y-auto p-6">
          {ResultsContent}
        </div>
      </div>
    );
  }

  // Mobile: tab switcher
  return (
    <div className="flex h-screen flex-col">
      <div className="flex shrink-0 border-b border-border">
        <button
          className={`flex-1 py-3 text-xs uppercase tracking-widest transition-colors ${
            mobileTab === "results"
              ? "border-b border-foreground text-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
          onClick={() => setMobileTab("results")}
        >
          Results
        </button>
        <button
          className={`flex-1 py-3 text-xs uppercase tracking-widest transition-colors ${
            mobileTab === "document"
              ? "border-b border-foreground text-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
          onClick={() => setMobileTab("document")}
        >
          Document
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {mobileTab === "results" ? ResultsContent : PdfPanel}
      </div>
    </div>
  );
}
