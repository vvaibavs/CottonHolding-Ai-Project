import { useEffect, useRef, useState } from "react";
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
  onCitationClick?: (page: number) => void;
}) {
  return (
    <Badge
      variant="outline"
      className="cursor-pointer border-border/60 text-xs text-muted-foreground transition-colors hover:border-foreground/40 hover:text-foreground"
      title={`Jump to page ${page}${verbatim ? ` · "${verbatim}"` : ""}`}
      onClick={() => onCitationClick?.(page)}
    >
      p.{page}
    </Badge>
  );
}

function Md({ children }: { children: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      rehypePlugins={[rehypeSanitize]}
      className="prose prose-sm prose-invert max-w-none prose-p:text-foreground/80 prose-headings:text-foreground prose-strong:text-foreground"
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
}: {
  data: BidExtraction;
  jobId: string;
  questions?: QuestionSet | null;
  onCitationClick?: (page: number) => void;
}) {
  const [active, setActive] = useState("summary");
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});

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

  return (
    <div className="flex gap-8">
      <nav className="sticky top-4 hidden h-fit w-44 shrink-0 space-y-0.5 lg:block">
        {SECTIONS.map((s) => (
          <a
            key={s.id}
            href={`#${s.id}`}
            className={cn(
              "block rounded px-3 py-1.5 text-xs transition-colors",
              active === s.id
                ? "bg-accent text-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {s.label}
          </a>
        ))}
      </nav>

      <div className="min-w-0 flex-1 space-y-6">
        {/* Header */}
        <div className="border-b border-border pb-4">
          <h1 className="font-serif text-2xl tracking-tight">{data.document_title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{data.issuing_entity}</p>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            {data.solicitation_number && (
              <span className="text-xs text-muted-foreground">
                {data.solicitation_number}
              </span>
            )}
            {data.estimated_value_usd != null && (
              <span className="text-xs text-foreground/80">
                ${data.estimated_value_usd.toLocaleString()}
              </span>
            )}
            {data.performance_period && (
              <span className="text-xs text-muted-foreground">
                {data.performance_period}
              </span>
            )}
          </div>
          <p className="mt-2 text-xs text-muted-foreground/60">
            {data.confidence_note}
          </p>
        </div>

        {/* Summary */}
        <Card
          id="summary"
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
          ref={(el) => {
            sectionRefs.current["dates"] = el;
          }}
        >
          <CardHeader>
            <CardTitle className="font-serif text-lg font-normal tracking-tight">
              Key Dates & Submission Requirements
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {data.key_dates.length > 0 && (
              <div>
                <h4 className="mb-3 text-xs font-medium uppercase tracking-widest text-muted-foreground">
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
                        <TableCell className="whitespace-nowrap font-mono text-xs">
                          {d.iso_date ?? d.relative_expression ?? "—"}
                          {d.time_zone && (
                            <span className="ml-1 text-muted-foreground">
                              {d.time_zone}
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-sm">{d.label}</TableCell>
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
                <h4 className="mb-3 text-xs font-medium uppercase tracking-widest text-muted-foreground">
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
                        <TableCell className="text-sm">
                          {r.item}
                          {r.page_limit && (
                            <span className="ml-1 text-xs text-muted-foreground">
                              ({r.page_limit}p max)
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-sm">{r.format ?? "—"}</TableCell>
                        <TableCell>
                          <Badge
                            variant={r.mandatory ? "default" : "secondary"}
                            className="text-xs"
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
              <p className="text-sm text-muted-foreground">
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
                <AlertDescription className="mt-2 space-y-2">
                  <p className="text-sm">{c.plain_english}</p>
                  <blockquote className="border-l-2 border-border pl-3 text-xs italic text-muted-foreground">
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
          ref={(el) => {
            sectionRefs.current["risks"] = el;
          }}
        >
          <CardHeader>
            <CardTitle className="font-serif text-lg font-normal tracking-tight">
              Risks, Ambiguities & Missing Info
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {data.risks.length > 0 && (
              <div>
                <h4 className="mb-3 text-xs font-medium uppercase tracking-widest text-muted-foreground">
                  Risks
                </h4>
                <Accordion>
                  {data.risks.map((r, i) => (
                    <AccordionItem key={i} value={`risk-${i}`}>
                      <AccordionTrigger value={`risk-${i}`}>
                        <span className="flex items-center gap-2 text-left text-sm">
                          {r.title}
                          <Badge
                            variant={
                              r.impact === "high" ? "destructive" : "secondary"
                            }
                            className="text-xs"
                          >
                            {r.likelihood}/{r.impact}
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
                <h4 className="mb-3 text-xs font-medium uppercase tracking-widest text-muted-foreground">
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
                        <p className="text-sm text-foreground/80">{a.what_is_unclear}</p>
                        <blockquote className="mt-2 border-l-2 border-border pl-3 text-xs italic text-muted-foreground">
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
                <h4 className="mb-3 text-xs font-medium uppercase tracking-widest text-muted-foreground">
                  Missing Information
                </h4>
                <ul className="list-inside list-disc space-y-1 text-sm text-foreground/80">
                  {data.missing_info.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Questions to Ask */}
        <div
          id="questions"
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
