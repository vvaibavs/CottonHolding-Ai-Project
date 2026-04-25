import { ChevronDown, ChevronUp, Minus, Plus } from "lucide-react";
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { Document, Page } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

export interface PdfViewerHandle {
  scrollToPage: (page: number) => void;
}

interface Props {
  url: string;
  className?: string;
}

const ZOOM_STEPS = [0.5, 0.75, 1, 1.25, 1.5, 2] as const;
const ZOOM_MIN = 0.5;
const ZOOM_MAX = 2;

export const PdfViewer = forwardRef<PdfViewerHandle, Props>(
  ({ url, className }, ref) => {
    const [numPages, setNumPages] = useState(0);
    const [containerWidth, setContainerWidth] = useState(600);
    const [zoom, setZoom] = useState(1);
    const [currentPage, setCurrentPage] = useState(1);
    const containerRef = useRef<HTMLDivElement>(null);
    const pageRefs = useRef<Record<number, HTMLDivElement | null>>({});

    useImperativeHandle(ref, () => ({
      scrollToPage: (page: number) => {
        const el = pageRefs.current[page];
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "start" });
          el.classList.add("ring-2", "ring-blue-500");
          setTimeout(
            () => el.classList.remove("ring-2", "ring-blue-500"),
            1500,
          );
        }
      },
    }));

    const measureWidth = useCallback(() => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.clientWidth - 32);
      }
    }, []);

    useEffect(() => {
      measureWidth();
      const observer = new ResizeObserver(measureWidth);
      if (containerRef.current) observer.observe(containerRef.current);
      return () => observer.disconnect();
    }, [measureWidth]);

    useEffect(() => {
      if (numPages === 0) return;
      const observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (entry.isIntersecting) {
              const page = Number(entry.target.getAttribute("data-page"));
              if (page) setCurrentPage(page);
            }
          }
        },
        { rootMargin: "-20% 0px -70% 0px" },
      );
      for (let i = 1; i <= numPages; i++) {
        const el = pageRefs.current[i];
        if (el) observer.observe(el);
      }
      return () => observer.disconnect();
    }, [numPages]);

    const zoomIn = () => {
      const next = ZOOM_STEPS.find((s) => s > zoom);
      if (next) setZoom(next);
    };

    const zoomOut = () => {
      const prev = [...ZOOM_STEPS].reverse().find((s) => s < zoom);
      if (prev) setZoom(prev);
    };

    const goToPage = (page: number) => {
      const clamped = Math.min(numPages, Math.max(1, page));
      const el = pageRefs.current[clamped];
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    };

    const pageWidth = Math.round(containerWidth * zoom);

    return (
      <div ref={containerRef} className={className}>
        {numPages > 0 && (
          <div className="sticky top-0 z-10 mb-3 flex items-center justify-between rounded-lg border border-border bg-card/90 px-3 py-1.5 shadow-sm backdrop-blur-sm">
            <div className="flex items-center gap-1">
              <button
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage <= 1}
                className="rounded p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:opacity-30"
              >
                <ChevronUp className="h-3.5 w-3.5" />
              </button>
              <span className="min-w-[4.5rem] text-center text-xs tabular-nums text-muted-foreground">
                {currentPage} / {numPages}
              </span>
              <button
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage >= numPages}
                className="rounded p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:opacity-30"
              >
                <ChevronDown className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={zoomOut}
                disabled={zoom <= ZOOM_MIN}
                className="rounded p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:opacity-30"
              >
                <Minus className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => setZoom(1)}
                className="min-w-[3rem] rounded px-1.5 py-0.5 text-center text-xs tabular-nums text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                title="Reset zoom"
              >
                {Math.round(zoom * 100)}%
              </button>
              <button
                onClick={zoomIn}
                disabled={zoom >= ZOOM_MAX}
                className="rounded p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:opacity-30"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}

        <Document
          file={url}
          onLoadSuccess={({ numPages: n }) => setNumPages(n)}
          onLoadError={(err) => console.error("PDF load error:", err)}
          loading={
            <div className="flex h-64 items-center justify-center">
              <div className="flex flex-col items-center gap-2">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
                <span className="text-xs text-muted-foreground">
                  Loading document...
                </span>
              </div>
            </div>
          }
          error={
            <div className="flex h-64 items-center justify-center text-sm text-destructive">
              Failed to load PDF. The link may have expired — try refreshing.
            </div>
          }
        >
          {Array.from({ length: numPages }, (_, i) => i + 1).map(
            (pageNumber) => (
              <div
                key={pageNumber}
                data-page={pageNumber}
                ref={(el) => {
                  pageRefs.current[pageNumber] = el;
                }}
                className="mb-4 rounded transition-all duration-300"
              >
                <Page
                  pageNumber={pageNumber}
                  width={pageWidth}
                  renderTextLayer
                  renderAnnotationLayer
                />
              </div>
            ),
          )}
        </Document>
      </div>
    );
  },
);

PdfViewer.displayName = "PdfViewer";
