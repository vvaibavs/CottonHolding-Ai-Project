import { ChevronsRight } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import rehypeSanitize from "rehype-sanitize";
import remarkGfm from "remark-gfm";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import type { BidExtraction, QuestionSet } from "../schemas";
import { QuestionsPanel } from "./QuestionsPanel";

function PageBadge({
  page,
  verbatim,
  onCitationClick,
}: {
  page: number;
  verbatim?: string | null;
  onCitationClick?: (page: number, verbatim?: string | null) => void;
}) {
  return (
    <button
      className="group/pg relative inline-flex items-center gap-1 rounded-full border border-white/[0.08] px-2 py-0.5 text-[11px] tabular-nums text-muted-foreground/60 transition-all duration-200 hover:border-white/[0.2] hover:text-foreground hover:shadow-[0_0_8px_rgba(255,255,255,.06)]"
      title={`Jump to page ${page}${verbatim ? ` · "${verbatim}"` : ""}`}
      onClick={() => onCitationClick?.(page, verbatim)}
    >
      <span className="absolute inset-0 rounded-[inherit] bg-white/[0.03] opacity-0 transition-opacity duration-200 group-hover/pg:opacity-100" />
      <span className="relative">pg. {page}</span>
    </button>
  );
}

function Md({ children }: { children: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      rehypePlugins={[rehypeSanitize]}
      className="prose prose-sm prose-invert max-w-none prose-p:text-foreground/70 prose-p:leading-relaxed prose-headings:text-foreground prose-strong:text-foreground/90 prose-li:text-foreground/70"
    >
      {children}
    </ReactMarkdown>
  );
}

const SECTIONS = [
  { id: "summary", label: "Summary" },
  { id: "scope", label: "Scope" },
  { id: "dates", label: "Dates & Submissions" },
  { id: "callouts", label: "Legal & Compliance" },
  { id: "risks", label: "Risks & Ambiguities" },
  { id: "questions", label: "Q&A Questions" },
] as const;

const SEVERITY_VARIANT: Record<string, "info" | "standard" | "elevated" | "critical"> = {
  info: "info",
  standard: "standard",
  elevated: "elevated",
  critical: "critical",
};

export function ExtractionResults({
  data,
  jobId,
  questions,
  onCitationClick,
  sidebarOverlay = false,
}: {
  data: BidExtraction;
  jobId: string;
  questions?: QuestionSet | null;
  onCitationClick?: (page: number, verbatim?: string | null) => void;
  sidebarOverlay?: boolean;
}) {
  const [active, setActive] = useState("summary");
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const hideTimer = useRef<ReturnType<typeof setTimeout>>(null);

  const showSidebar = useCallback(() => {
    if (hideTimer.current) clearTimeout(hideTimer.current);
    setSidebarVisible(true);
  }, []);

  const hideSidebar = useCallback(() => {
    hideTimer.current = setTimeout(() => setSidebarVisible(false), 300);
  }, []);

  useEffect(() => {
    return () => {
      if (hideTimer.current) clearTimeout(hideTimer.current);
    };
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActive(entry.target.id);
          }
        }
      },
      { rootMargin: "-20% 0px -60% 0px" },
    );

    for (const s of SECTIONS) {
      const el = sectionRefs.current[s.id];
      if (el) observer.observe(el);
    }
    return () => observer.disconnect();
  }, []);

  const sectionCounts: Record<string, number | null> = {
    summary: null,
    scope: null,
    dates: data.key_dates.length + data.submission_requirements.length,
    callouts: data.callouts.length,
    risks: data.risks.length + data.ambiguities.length + data.missing_info.length,
    questions: questions?.questions.length ?? null,
  };

  const sidebarNav = (
    <nav className="h-fit w-44 shrink-0 space-y-0.5">
      {SECTIONS.map((s) => {
        const count = sectionCounts[s.id];
        return (
          <a
            key={s.id}
            href={`#${s.id}`}
            className={cn(
              "flex items-center justify-between rounded-lg px-3 py-2 text-xs transition-all duration-200",
              active === s.id
                ? "bg-white/[0.04] text-foreground"
                : "text-muted-foreground/40 hover:text-foreground/70 hover:bg-white/[0.02]",
            )}
          >
            <span>{s.label}</span>
            {count != null && count > 0 && (
              <span className="tabular-nums text-[10px] text-muted-foreground/25">
                {count}
              </span>
            )}
          </a>
        );
      })}
    </nav>
  );

  return (
    <div className="relative flex gap-10">
      {sidebarOverlay ? (
        <>
          {/* Hover trigger zone with icon hint */}
          <div
            className={cn(
              "fixed left-0 top-1/2 z-40 hidden -translate-y-1/2 lg:flex",
              "h-9 w-5 cursor-pointer items-center justify-center",
              "rounded-r-md border border-l-0 border-white/[0.15] bg-background shadow-sm",
              "text-foreground/70 transition-all duration-200",
              "hover:w-6 hover:bg-white/[0.1] hover:text-foreground",
              sidebarVisible && "pointer-events-none opacity-0",
            )}
            onMouseEnter={showSidebar}
          >
            <ChevronsRight className="h-3.5 w-3.5" />
          </div>
          {/* Sliding overlay sidebar */}
          <div
            className={cn(
              "fixed left-0 top-0 z-50 hidden h-full lg:block",
              "transition-transform duration-200 ease-out",
              sidebarVisible ? "translate-x-0" : "-translate-x-full",
            )}
            onMouseEnter={showSidebar}
            onMouseLeave={hideSidebar}
          >
            <div className="flex h-full w-52 flex-col border-r border-white/[0.06] bg-background/95 px-3 pt-20 shadow-[4px_0_24px_rgba(0,0,0,.4)] backdrop-blur-md">
              {sidebarNav}
            </div>
          </div>
        </>
      ) : (
        <div className="sticky top-6 hidden h-fit lg:block">
          {sidebarNav}
        </div>
      )}

      <div className="min-w-0 flex-1 space-y-8">
        {/* Header */}
        <div className="border-b border-white/[0.04] pb-6">
          <h1 className="font-serif text-3xl tracking-tight">{data.document_title}</h1>
          <p className="mt-2 text-sm text-muted-foreground/50">{data.issuing_entity}</p>
          <div className="mt-4 flex flex-wrap items-center gap-4">
            {data.solicitation_number && (
              <span className="text-[11px] uppercase tracking-wider text-muted-foreground/40">
                {data.solicitation_number}
              </span>
            )}
            {data.estimated_value_usd != null && (
              <span className="font-serif text-sm text-foreground/70">
                ${data.estimated_value_usd.toLocaleString()}
              </span>
            )}
            {data.performance_period && (
              <span className="text-xs text-muted-foreground/40">
                {data.performance_period}
              </span>
            )}
          </div>
          <div className="mt-3 flex items-center gap-2.5">
            <div
              className={cn(
                "h-1.5 w-1.5 rounded-full",
                data.confidence_note.startsWith("HIGH")
                  ? "bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,.3)]"
                  : data.confidence_note.startsWith("MEDIUM")
                    ? "bg-yellow-500 shadow-[0_0_6px_rgba(234,179,8,.3)]"
                    : "bg-destructive shadow-[0_0_6px_rgba(220,38,38,.3)]",
              )}
            />
            <p className="text-xs text-muted-foreground/40">
              {data.confidence_note}
            </p>
          </div>
        </div>

        {/* Summary */}
        <Card
          id="summary"
          className="scroll-mt-6"
          ref={(el) => {
            sectionRefs.current["summary"] = el;
          }}
        >
          <CardHeader>
            <CardTitle className="font-serif text-lg font-normal tracking-tight">
              Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Md>{data.plain_english_summary}</Md>
          </CardContent>
        </Card>

        {/* Scope */}
        <Card
          id="scope"
          className="scroll-mt-6"
          ref={(el) => {
            sectionRefs.current["scope"] = el;
          }}
        >
          <CardHeader>
            <CardTitle className="font-serif text-lg font-normal tracking-tight">
              Project Scope
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Md>{data.project_scope}</Md>
          </CardContent>
        </Card>

        {/* Dates & Submissions */}
        <Card
          id="dates"
          className="scroll-mt-6"
          ref={(el) => {
            sectionRefs.current["dates"] = el;
          }}
        >
          <CardHeader>
            <CardTitle className="font-serif text-lg font-normal tracking-tight">
              Key Dates & Submission Requirements
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-8">
            {data.key_dates.length > 0 && (
              <div>
                <h4 className="mb-4 text-[11px] font-medium uppercase tracking-[0.15em] text-muted-foreground/40">
                  Key Dates
                </h4>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Source</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.key_dates.map((d, i) => (
                      <TableRow key={i}>
                        <TableCell className="whitespace-nowrap font-mono text-xs text-foreground/60">
                          {d.iso_date ?? d.relative_expression ?? "—"}
                          {d.time_zone && (
                            <span className="ml-1 text-muted-foreground/40">
                              {d.time_zone}
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-foreground/70">{d.label}</TableCell>
                        <TableCell>
                          <PageBadge
                            page={d.source.page}
                            verbatim={d.source.verbatim}
                            onCitationClick={onCitationClick}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            {data.submission_requirements.length > 0 && (
              <div>
                <h4 className="mb-4 text-[11px] font-medium uppercase tracking-[0.15em] text-muted-foreground/40">
                  Submission Requirements
                </h4>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item</TableHead>
                      <TableHead>Format</TableHead>
                      <TableHead>Mandatory</TableHead>
                      <TableHead>Source</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.submission_requirements.map((r, i) => (
                      <TableRow key={i}>
                        <TableCell className="text-sm text-foreground/70">
                          {r.item}
                          {r.page_limit && (
                            <span className="ml-1 text-xs text-muted-foreground/40">
                              ({r.page_limit}p max)
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-foreground/50">{r.format ?? "—"}</TableCell>
                        <TableCell>
                          <Badge
                            variant={r.mandatory ? "default" : "secondary"}
                            className="text-[10px]"
                          >
                            {r.mandatory ? "Required" : "Optional"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <PageBadge
                            page={r.source.page}
                            verbatim={r.source.verbatim}
                            onCitationClick={onCitationClick}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Legal & Compliance Callouts */}
        <Card
          id="callouts"
          className="scroll-mt-6"
          ref={(el) => {
            sectionRefs.current["callouts"] = el;
          }}
        >
          <CardHeader>
            <CardTitle className="font-serif text-lg font-normal tracking-tight">
              Legal & Compliance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.callouts.length === 0 && (
              <p className="text-sm text-muted-foreground/40">
                No callouts identified.
              </p>
            )}
            {data.callouts.map((c, i) => (
              <Alert
                key={i}
                variant={SEVERITY_VARIANT[c.severity] ?? "default"}
              >
                <AlertTitle className="flex items-center gap-2 text-sm">
                  <Badge variant="outline" className="text-[10px] uppercase tracking-wider">
                    {c.category}
                  </Badge>
                  <span className="flex-1">{c.title}</span>
                  <PageBadge
                    page={c.source.page}
                    verbatim={c.source.verbatim}
                    onCitationClick={onCitationClick}
                  />
                </AlertTitle>
                <AlertDescription className="mt-3 space-y-2">
                  <p className="text-sm">{c.plain_english}</p>
                  <blockquote className="border-l border-white/[0.08] pl-3 text-xs italic text-muted-foreground/50">
                    {c.verbatim}
                  </blockquote>
                </AlertDescription>
              </Alert>
            ))}
          </CardContent>
        </Card>

        {/* Risks & Ambiguities */}
        <Card
          id="risks"
          className="scroll-mt-6"
          ref={(el) => {
            sectionRefs.current["risks"] = el;
          }}
        >
          <CardHeader>
            <CardTitle className="font-serif text-lg font-normal tracking-tight">
              Risks, Ambiguities & Missing Info
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {data.risks.length > 0 && (
              <div>
                <h4 className="mb-4 text-[11px] font-medium uppercase tracking-[0.15em] text-muted-foreground/40">
                  Risks
                </h4>
                <Accordion>
                  {data.risks.map((r, i) => (
                    <AccordionItem key={i} value={`risk-${i}`}>
                      <AccordionTrigger value={`risk-${i}`}>
                        <span className="flex flex-wrap items-center gap-2 text-left text-sm">
                          {r.title}
                          <Badge
                            variant={
                              r.likelihood === "high" ? "destructive" : "secondary"
                            }
                            className="text-[10px] uppercase tracking-wider"
                          >
                            Likelihood: {r.likelihood}
                          </Badge>
                          <Badge
                            variant={
                              r.impact === "high" ? "destructive" : "secondary"
                            }
                            className="text-[10px] uppercase tracking-wider"
                          >
                            Impact: {r.impact}
                          </Badge>
                          <PageBadge
                            page={r.source.page}
                            verbatim={r.source.verbatim}
                            onCitationClick={onCitationClick}
                          />
                        </span>
                      </AccordionTrigger>
                      <AccordionContent value={`risk-${i}`}>
                        <Md>{r.description}</Md>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>
            )}

            {data.ambiguities.length > 0 && (
              <div>
                <h4 className="mb-4 text-[11px] font-medium uppercase tracking-[0.15em] text-muted-foreground/40">
                  Ambiguities
                </h4>
                <Accordion>
                  {data.ambiguities.map((a, i) => (
                    <AccordionItem key={i} value={`amb-${i}`}>
                      <AccordionTrigger value={`amb-${i}`}>
                        <span className="flex items-center gap-2 text-left text-sm">
                          {a.topic}
                          <PageBadge
                            page={a.source.page}
                            onCitationClick={onCitationClick}
                          />
                        </span>
                      </AccordionTrigger>
                      <AccordionContent value={`amb-${i}`}>
                        <p className="text-sm text-foreground/70">{a.what_is_unclear}</p>
                        <blockquote className="mt-3 border-l border-white/[0.08] pl-3 text-xs italic text-muted-foreground/40">
                          {a.verbatim_quote}
                        </blockquote>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>
            )}

            {data.missing_info.length > 0 && (
              <div>
                <h4 className="mb-4 text-[11px] font-medium uppercase tracking-[0.15em] text-muted-foreground/40">
                  Missing Information
                </h4>
                <ul className="space-y-2 text-sm text-foreground/60">
                  {data.missing_info.map((item, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-muted-foreground/30" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Questions to Ask */}
        <div
          id="questions"
          className="scroll-mt-6"
          ref={(el) => {
            sectionRefs.current["questions"] = el;
          }}
        >
          <QuestionsPanel jobId={jobId} questions={questions} />
        </div>
      </div>
    </div>
  );
}
