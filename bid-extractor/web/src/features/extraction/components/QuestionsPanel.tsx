import { ClipboardCopy, MessageSquareText } from "lucide-react";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

import { useGenerateQuestions } from "../api/useGenerateQuestions";
import type { QuestionSet } from "../schemas";

const PRIORITY_ORDER = ["must_ask", "should_ask", "nice_to_ask"] as const;
const PRIORITY_STYLE: Record<string, { label: string; className: string }> = {
  must_ask: { label: "Must Ask", className: "border-red-500/15 bg-red-500/[0.06] text-red-400/80" },
  should_ask: { label: "Should Ask", className: "border-yellow-500/15 bg-yellow-500/[0.06] text-yellow-400/80" },
  nice_to_ask: { label: "Nice to Ask", className: "border-blue-500/15 bg-blue-500/[0.06] text-blue-400/80" },
};

const CATEGORY_LABEL: Record<string, string> = {
  scope_clarification: "Scope",
  legal_contractual: "Legal / Contractual",
  insurance_bonding: "Insurance / Bonding",
  timeline_scheduling: "Timeline / Scheduling",
  submission_requirements: "Submission Requirements",
  pricing_financial: "Pricing / Financial",
  technical_requirements: "Technical Requirements",
};

function copyAllQuestions(questions: QuestionSet["questions"]) {
  const sorted = [...questions].sort(
    (a, b) => PRIORITY_ORDER.indexOf(a.priority) - PRIORITY_ORDER.indexOf(b.priority),
  );
  const text = sorted
    .map((q, i) => `${i + 1}. [${PRIORITY_STYLE[q.priority]?.label ?? q.priority}] ${q.question}`)
    .join("\n\n");
  navigator.clipboard.writeText(text);
}

export function QuestionsPanel({
  jobId,
  questions,
}: {
  jobId: string;
  questions: QuestionSet | null | undefined;
}) {
  const mutation = useGenerateQuestions(jobId);
  const [copied, setCopied] = useState(false);

  if (!questions && !mutation.data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2.5 font-serif text-lg font-normal tracking-tight">
            <MessageSquareText className="h-4 w-4 text-muted-foreground/30" />
            Questions to Ask
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-5 text-sm text-muted-foreground/50">
            Generate strategically prioritized clarification questions for the official Q&A period.
          </p>
          <Button
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending}
          >
            {mutation.isPending ? (
              <>
                <div className="mr-2 h-3.5 w-3.5 animate-spin rounded-full border border-primary-foreground/30 border-t-primary-foreground" />
                Generating...
              </>
            ) : (
              "Generate Questions"
            )}
          </Button>
          {mutation.isError && (
            <p className="mt-3 text-sm text-destructive">
              {mutation.error.message}
            </p>
          )}
        </CardContent>
      </Card>
    );
  }

  const data = questions ?? mutation.data!;
  const sorted = [...data.questions].sort(
    (a, b) => PRIORITY_ORDER.indexOf(a.priority) - PRIORITY_ORDER.indexOf(b.priority),
  );

  const grouped = new Map<string, typeof sorted>();
  for (const q of sorted) {
    const cat = q.category;
    if (!grouped.has(cat)) grouped.set(cat, []);
    grouped.get(cat)!.push(q);
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2.5 font-serif text-lg font-normal tracking-tight">
            <MessageSquareText className="h-4 w-4 text-muted-foreground/30" />
            Questions to Ask
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              copyAllQuestions(data.questions);
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            }}
          >
            <ClipboardCopy className="mr-1.5 h-3 w-3" />
            {copied ? "Copied!" : "Copy All"}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-8">
        <div className="rounded-xl border border-blue-500/10 bg-blue-500/[0.03] p-5">
          <p className="text-[11px] font-medium uppercase tracking-[0.15em] text-blue-400/60">
            Strategic Note
          </p>
          <p className="mt-2 text-sm leading-relaxed text-blue-200/60">{data.strategic_note}</p>
        </div>

        {[...grouped.entries()].map(([category, categoryQuestions]) => (
          <div key={category}>
            <h4 className="mb-4 text-[11px] font-medium uppercase tracking-[0.15em] text-muted-foreground/40">
              {CATEGORY_LABEL[category] ?? category}
            </h4>
            <div className="space-y-2">
              {categoryQuestions.map((q, i) => {
                const style = PRIORITY_STYLE[q.priority];
                return (
                  <div
                    key={`${category}-${i}`}
                    className="rounded-xl border border-white/[0.04] bg-white/[0.01] p-5 transition-colors duration-200 hover:bg-white/[0.02]"
                  >
                    <div className="mb-2.5 flex items-center gap-2">
                      <Badge
                        variant="outline"
                        className={cn("text-[10px]", style?.className)}
                      >
                        {style?.label ?? q.priority}
                      </Badge>
                      <span className="text-[10px] text-muted-foreground/30">
                        {q.derived_from.replace("_", " ")} &middot; {q.source_topic}
                      </span>
                    </div>
                    <p className="text-sm leading-relaxed text-foreground/80">{q.question}</p>
                    <p className="mt-2 text-xs leading-relaxed text-muted-foreground/40">
                      {q.why_it_matters}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
