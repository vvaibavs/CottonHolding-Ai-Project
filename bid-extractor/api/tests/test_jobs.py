import json
from unittest.mock import MagicMock, patch

import pytest
import pytest_asyncio

from app.schemas import BidExtraction


MOCK_RESULT = BidExtraction(
    document_title="Test RFP",
    issuing_entity="Test Agency",
    solicitation_number="RFP-001",
    plain_english_summary="A " * 80 + "test summary that is long enough to pass the minimum length validation requirement for the plain english summary field in the schema.",
    project_scope="Build a test project",
    estimated_value_usd=100000,
    performance_period="12 months",
    key_dates=[],
    submission_requirements=[],
    callouts=[],
    risks=[],
    ambiguities=[],
    missing_info=["Evaluation criteria", "Budget ceiling"],
    confidence_note="HIGH. Clean document with no OCR issues.",
)


@pytest.mark.asyncio
async def test_run_extraction_success():
    updates: list[dict] = []

    class FakeUpdate:
        def eq(self, *args):
            return self

        def execute(self):
            return None

    class FakeTable:
        def update(self, fields):
            updates.append(fields)
            return FakeUpdate()

    mock_admin = MagicMock()
    mock_admin.table.return_value = FakeTable()

    with (
        patch("app.jobs.supabase_admin", mock_admin),
        patch("app.jobs.extract_to_markdown", return_value={
            "markdown": "--- PAGE 1 ---\nTest content",
            "page_count": 1,
        }),
        patch("app.jobs.extract_bid", return_value=MOCK_RESULT),
    ):
        from app.jobs import run_extraction
        await run_extraction("test-id", b"fake-pdf", "application/pdf")

    statuses = [u["status"] for u in updates]
    assert statuses == ["parsing", "extracting", "complete"]
    assert updates[-1]["result"]["document_title"] == "Test RFP"


def test_bid_extraction_allows_long_verbatim_fields():
    long_text = "x" * 5000
    extraction = BidExtraction(
        document_title="Long verbatim test",
        issuing_entity="Test Agency",
        solicitation_number=None,
        plain_english_summary="A " * 80 + "test summary that is long enough to pass the minimum length validation requirement for the plain english summary field in the schema.",
        project_scope="Build a test project",
        estimated_value_usd=None,
        performance_period=None,
        key_dates=[],
        submission_requirements=[],
        callouts=[
            {
                "category": "legal",
                "title": "Long callout",
                "plain_english": "This is a long callout entry.",
                "verbatim": long_text,
                "severity": "info",
                "source": {"page": 1, "verbatim": long_text},
            }
        ],
        risks=[],
        ambiguities=[
            {
                "topic": "Ambiguity",
                "what_is_unclear": "Unclear requirement details.",
                "verbatim_quote": long_text,
                "source": {"page": 1, "verbatim": long_text},
            }
        ],
        missing_info=[],
        confidence_note="HIGH. No issues.",
    )

    assert extraction.callouts[0].verbatim == long_text
    assert extraction.callouts[0].source.verbatim == long_text
    assert extraction.ambiguities[0].verbatim_quote == long_text


@pytest.mark.asyncio
async def test_run_extraction_failure():
    updates: list[dict] = []

    class FakeUpdate:
        def eq(self, *args):
            return self

        def execute(self):
            return None

    class FakeTable:
        def update(self, fields):
            updates.append(fields)
            return FakeUpdate()

    mock_admin = MagicMock()
    mock_admin.table.return_value = FakeTable()

    with (
        patch("app.jobs.supabase_admin", mock_admin),
        patch("app.jobs.extract_to_markdown", side_effect=ValueError("bad file")),
    ):
        from app.jobs import run_extraction
        await run_extraction("test-id", b"bad", "application/pdf")

    statuses = [u["status"] for u in updates]
    assert "failed" in statuses
    assert "bad file" in updates[-1]["error_message"]
