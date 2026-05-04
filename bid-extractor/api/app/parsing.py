import io
import logging
import os
import re
import tempfile

import mammoth
import pymupdf4llm
from markdownify import markdownify

logger = logging.getLogger(__name__)

PDF_MIME = "application/pdf"
DOCX_MIME = (
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
)

_INJECTION_PATTERNS = re.compile(
    r"|".join([
        r"ignore\s+(all\s+)?previous\s+instructions",
        r"ignore\s+(all\s+)?prior\s+instructions",
        r"disregard\s+(all\s+)?(previous|prior|above)\s+instructions",
        r"new\s+instructions?\s*:",
        r"system\s*override",
        r"you\s+are\s+now\s+a",
        r"act\s+as\s+(a\s+)?",
        r"pretend\s+(you\s+are|to\s+be)",
        r"switch\s+to\s+.{0,20}\s*mode",
        r"enter\s+.{0,20}\s*mode",
        r"from\s+now\s+on",
        r"forget\s+(everything|all|your)\s+(above|previous|prior)",
        r"do\s+not\s+follow\s+(the\s+)?(above|previous|prior)",
        r"override\s+(your|the)\s+(system|instructions|prompt)",
        r"</?(system|instruction|prompt)>",
    ]),
    re.IGNORECASE,
)


def sanitize_markdown(markdown: str) -> str:
    matches = _INJECTION_PATTERNS.findall(markdown)
    if matches:
        logger.warning(
            "Potential prompt injection detected (%d pattern(s) found). "
            "Stripping suspicious segments.",
            len(matches),
        )
        markdown = _INJECTION_PATTERNS.sub("[REDACTED]", markdown)
    return markdown


def extract_to_markdown(content: bytes, mime: str) -> dict:
    if mime == PDF_MIME:
        with tempfile.NamedTemporaryFile(suffix=".pdf", delete=False) as tf:
            tf.write(content)
            tmp = tf.name
        try:
            chunks = pymupdf4llm.to_markdown(tmp, page_chunks=True)
        finally:
            os.unlink(tmp)
        pages = [{"page": i + 1, "text": c["text"]} for i, c in enumerate(chunks)]
        paged_md = "\n\n".join(
            f"--- PAGE {p['page']} ---\n{p['text']}" for p in pages
        )
        return {"markdown": sanitize_markdown(paged_md), "page_count": len(pages)}

    if mime == DOCX_MIME:
        result = mammoth.convert_to_html(io.BytesIO(content))
        md = markdownify(result.value, heading_style="ATX")
        return {"markdown": sanitize_markdown(f"--- PAGE 1 ---\n{md}"), "page_count": 1}

    raise ValueError(f"Unsupported MIME: {mime}")
