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

export const PdfViewer = forwardRef<PdfViewerHandle, Props>(
  ({ url, className }, ref) => {
    const [numPages, setNumPages] = useState(0);
    const [containerWidth, setContainerWidth] = useState(600);
    const containerRef = useRef<HTMLDivElement>(null);
    const pageRefs = useRef<Record<number, HTMLDivElement | null>>({});

    useImperativeHandle(ref, () => ({
      scrollToPage: (page: number) => {
        const el = pageRefs.current[page];
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "start" });
          el.classList.add("ring-2", "ring-blue-500", "ring-offset-2");
          setTimeout(
            () =>
              el.classList.remove("ring-2", "ring-blue-500", "ring-offset-2"),
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

    return (
      <div ref={containerRef} className={className}>
        <Document
          file={url}
          onLoadSuccess={({ numPages }) => setNumPages(numPages)}
          onLoadError={(err) => console.error("PDF load error:", err)}
          loading={
            <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
              Loading document...
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
                ref={(el) => {
                  pageRefs.current[pageNumber] = el;
                }}
                className="mb-4 transition-all duration-300"
              >
                <div className="mb-1 text-center text-xs text-muted-foreground">
                  Page {pageNumber} of {numPages}
                </div>
                <Page
                  pageNumber={pageNumber}
                  width={containerWidth}
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
