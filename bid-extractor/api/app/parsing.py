import io
import os
import tempfile

import mammoth
import pymupdf4llm
from markdownify import markdownify

PDF_MIME = "application/pdf"
DOCX_MIME = (
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
)


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
        return {"markdown": paged_md, "page_count": len(pages)}

    if mime == DOCX_MIME:
        result = mammoth.convert_to_html(io.BytesIO(content))
        md = markdownify(result.value, heading_style="ATX")
        return {"markdown": f"--- PAGE 1 ---\n{md}", "page_count": 1}

    raise ValueError(f"Unsupported MIME: {mime}")
