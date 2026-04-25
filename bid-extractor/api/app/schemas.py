from typing import Literal, Optional

from pydantic import BaseModel, Field


class PageRef(BaseModel):
    page: int = Field(description="1-indexed page from --- PAGE N --- markers")
    verbatim: Optional[str] = Field(
        None,
        description="Exact quoted text from the page source.",
    )


class KeyDate(BaseModel):
    label: str
    iso_date: Optional[str] = Field(None, description="YYYY-MM-DD or null")
    relative_expression: Optional[str] = None
    time_zone: Optional[str] = None
    source: PageRef


class SubmissionRequirement(BaseModel):
    item: str
    format: Optional[str] = None
    page_limit: Optional[int] = None
    mandatory: bool
    source: PageRef


class Callout(BaseModel):
    category: Literal["legal", "contractual", "insurance", "compliance", "security"]
    title: str
    plain_english: str
    verbatim: str = Field(
        ...,
        description="Exact clause text for the callout.",
    )
    severity: Literal["info", "standard", "elevated", "critical"]
    source: PageRef


class Risk(BaseModel):
    title: str
    description: str
    likelihood: Literal["low", "medium", "high"]
    impact: Literal["low", "medium", "high"]
    source: PageRef


class Ambiguity(BaseModel):
    topic: str
    what_is_unclear: str
    verbatim_quote: str = Field(
        ...,
        description="Exact quoted ambiguity text.",
    )
    source: PageRef


class BidExtraction(BaseModel):
    document_title: str
    issuing_entity: str
    solicitation_number: Optional[str] = None
    plain_english_summary: str = Field(
        min_length=150,
        max_length=20000,
        description="150-2000 words, 8th-grade reading level, no legalese",
    )
    project_scope: str
    estimated_value_usd: Optional[float] = None
    performance_period: Optional[str] = None
    key_dates: list[KeyDate]
    submission_requirements: list[SubmissionRequirement]
    callouts: list[Callout]
    risks: list[Risk]
    ambiguities: list[Ambiguity]
    missing_info: list[str] = Field(
        description="Items normally in a bid that this one omits"
    )
    confidence_note: str = Field(
        description=(
            "Rate overall extraction confidence: HIGH / MEDIUM / LOW. "
            "Then list any pages with poor text quality. "
            "Format: 'HIGH. Pages 14-16 had table rendering issues; verify dates manually.'"
        )
    )


class Question(BaseModel):
    question: str = Field(
        description="Formally phrased question addressed to the issuing entity. "
                    "Must be specific and answerable, not vague.")
    category: Literal[
        "scope_clarification", "legal_contractual", "insurance_bonding",
        "timeline_scheduling", "submission_requirements",
        "pricing_financial", "technical_requirements"]
    priority: Literal["must_ask", "should_ask", "nice_to_ask"]
    derived_from: Literal["ambiguity", "risk", "missing_info", "callout"]
    source_topic: str = Field(
        description="The exact ambiguity/risk/missing_info title this question addresses")
    why_it_matters: str = Field(
        description="One sentence: the financial or legal consequence of not getting "
                    "this answered before bidding")


class QuestionSet(BaseModel):
    questions: list[Question]
    strategic_note: str = Field(
        description="2-3 sentences of overall bidding strategy advice based on "
                    "the risk profile of this document")
