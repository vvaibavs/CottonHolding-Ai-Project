import os
from pathlib import Path

import pytest

FIXTURES = Path(__file__).parent / "fixtures"


def test_pdf_extraction():
    pdf_path = FIXTURES / "sample.pdf"
    if not pdf_path.exists():
        pytest.skip("No sample.pdf fixture")

    from app.parsing import extract_to_markdown

    content = pdf_path.read_bytes()
    result = extract_to_markdown(content, "application/pdf")
    assert "markdown" in result
    assert "page_count" in result
    assert result["page_count"] >= 1
    assert "--- PAGE 1 ---" in result["markdown"]


def test_docx_extraction():
    docx_path = FIXTURES / "sample.docx"
    if not docx_path.exists():
        pytest.skip("No sample.docx fixture")

    from app.parsing import extract_to_markdown

    content = docx_path.read_bytes()
    mime = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    result = extract_to_markdown(content, mime)
    assert "markdown" in result
    assert result["page_count"] == 1
    assert "--- PAGE 1 ---" in result["markdown"]


def test_unsupported_mime():
    from app.parsing import extract_to_markdown

    with pytest.raises(ValueError, match="Unsupported MIME"):
        extract_to_markdown(b"hello", "text/plain")
