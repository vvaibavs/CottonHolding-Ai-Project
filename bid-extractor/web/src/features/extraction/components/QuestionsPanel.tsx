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
  must_ask: { label: "Must Ask", className: "border-red-800/40 bg-red-950/50 text-red-400" },
  should_ask: { label: "Should Ask", className: "border-yellow-800/40 bg-yellow-950/50 text-yellow-400" },
  nice_to_ask: { label: "Nice to Ask", className: "border-blue-800/40 bg-blue-950/50 text-blue-400" },
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
          <CardTitle className="flex items-center gap-2 font-serif text-lg font-normal tracking-tight">
            <MessageSquareText className="h-4 w-4 text-muted-foreground" />
            Questions to Ask
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4 text-sm text-muted-foreground">
            Generate strategically prioritized clarification questions for the official Q&A period.
          </p>
          <Button
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending}
          >
            {mutation.isPending ? (
              <>
                <div className="mr-2 h-3.5 w-3.5 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
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
          <CardTitle className="flex items-center gap-2 font-serif text-lg font-normal tracking-tight">
            <MessageSquareText className="h-4 w-4 text-muted-foreground" />
            Questions to Ask
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            className="text-xs"
            onClick={() => {
              copyAllQuestions(data.questions);
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            }}
          >
            <ClipboardCopy className="mr-1 h-3 w-3" />
            {copied ? "Copied!" : "Copy All"}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="rounded-lg border border-blue-900/30 bg-blue-950/30 p-4">
          <p className="text-xs font-medium uppercase tracking-widest text-blue-400">
            Strategic Note
          </p>
          <p className="mt-2 text-sm text-blue-200/80">{data.strategic_note}</p>
        </div>

        {[...grouped.entries()].map(([category, categoryQuestions]) => (
          <div key={category}>
            <h4 className="mb-3 text-xs font-medium uppercase tracking-widest text-muted-foreground">
              {CATEGORY_LABEL[category] ?? category}
            </h4>
            <div className="space-y-2">
              {categoryQuestions.map((q, i) => {
                const style = PRIORITY_STYLE[q.priority];
                return (
                  <div
                    key={`${category}-${i}`}
                    className="rounded-lg border border-border bg-card p-4"
                  >
                    <div className="mb-2 flex items-center gap-2">
                      <Badge
                        variant="outline"
                        className={cn("text-[10px]", style?.className)}
                      >
                        {style?.label ?? q.priority}
                      </Badge>
                      <span className="text-[10px] text-muted-foreground">
                        {q.derived_from.replace("_", " ")} &middot; {q.source_topic}
                      </span>
                    </div>
                    <p className="text-sm text-foreground/90">{q.question}</p>
                    <p className="mt-1.5 text-xs text-muted-foreground">
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
