import { z } from "zod";

export const PageRefSchema = z.object({
  page: z.number().int().min(1),
  verbatim: z.string().max(5000).nullable().optional(),
});
export type PageRef = z.infer<typeof PageRefSchema>;

export const KeyDateSchema = z.object({
  label: z.string(),
  iso_date: z.string().nullable().optional(),
  relative_expression: z.string().nullable().optional(),
  time_zone: z.string().nullable().optional(),
  source: PageRefSchema,
});
export type KeyDate = z.infer<typeof KeyDateSchema>;

export const SubmissionRequirementSchema = z.object({
  item: z.string(),
  format: z.string().nullable().optional(),
  page_limit: z.number().int().nullable().optional(),
  mandatory: z.boolean(),
  source: PageRefSchema,
});
export type SubmissionRequirement = z.infer<typeof SubmissionRequirementSchema>;

export const CalloutSchema = z.object({
  category: z.enum(["legal", "contractual", "insurance", "compliance", "security"]),
  title: z.string(),
  plain_english: z.string(),
  verbatim: z.string().max(5000),
  severity: z.enum(["info", "standard", "elevated", "critical"]),
  source: PageRefSchema,
});
export type Callout = z.infer<typeof CalloutSchema>;

export const RiskSchema = z.object({
  title: z.string(),
  description: z.string(),
  likelihood: z.enum(["low", "medium", "high"]),
  impact: z.enum(["low", "medium", "high"]),
  source: PageRefSchema,
});
export type Risk = z.infer<typeof RiskSchema>;

export const AmbiguitySchema = z.object({
  topic: z.string(),
  what_is_unclear: z.string(),
  verbatim_quote: z.string().max(5000),
  source: PageRefSchema,
});
export type Ambiguity = z.infer<typeof AmbiguitySchema>;

export const BidExtractionSchema = z.object({
  document_title: z.string(),
  issuing_entity: z.string(),
  solicitation_number: z.string().nullable().optional(),
  plain_english_summary: z.string().min(150).max(20000),
  project_scope: z.string(),
  estimated_value_usd: z.number().nullable().optional(),
  performance_period: z.string().nullable().optional(),
  key_dates: z.array(KeyDateSchema),
  submission_requirements: z.array(SubmissionRequirementSchema),
  callouts: z.array(CalloutSchema),
  risks: z.array(RiskSchema),
  ambiguities: z.array(AmbiguitySchema),
  missing_info: z.array(z.string()),
  confidence_note: z.string(),
});
export type BidExtraction = z.infer<typeof BidExtractionSchema>;

export const QuestionSchema = z.object({
  question: z.string(),
  category: z.enum([
    "scope_clarification", "legal_contractual", "insurance_bonding",
    "timeline_scheduling", "submission_requirements",
    "pricing_financial", "technical_requirements",
  ]),
  priority: z.enum(["must_ask", "should_ask", "nice_to_ask"]),
  derived_from: z.enum(["ambiguity", "risk", "missing_info", "callout"]),
  source_topic: z.string(),
  why_it_matters: z.string(),
});
export type Question = z.infer<typeof QuestionSchema>;

export const QuestionSetSchema = z.object({
  questions: z.array(QuestionSchema),
  strategic_note: z.string(),
});
export type QuestionSet = z.infer<typeof QuestionSetSchema>;

export const ExtractionRowSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  file_name: z.string(),
  file_size_bytes: z.number().nullable().optional(),
  mime_type: z.string().nullable().optional(),
  status: z.enum(["pending", "parsing", "extracting", "complete", "failed"]),
  status_message: z.string().nullable().optional(),
  result: BidExtractionSchema.nullable().optional(),
  questions: QuestionSetSchema.nullable().optional(),
  markdown_excerpt: z.string().nullable().optional(),
  error_message: z.string().nullable().optional(),
  created_at: z.string(),
  completed_at: z.string().nullable().optional(),
});
export type ExtractionRow = z.infer<typeof ExtractionRowSchema>;
