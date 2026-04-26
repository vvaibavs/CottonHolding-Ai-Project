import asyncio
from datetime import datetime, timezone

from app.deps import supabase_admin
from app.gemini import extract_bid
from app.parsing import extract_to_markdown


async def run_extraction(
    job_id: str,
    content: bytes,
    mime: str,
    thinking_budget: int = 4096,
    storage_path: str | None = None,
) -> None:
    async def _set(**fields: object) -> None:
        await asyncio.to_thread(
            lambda: supabase_admin.table("extractions")
            .update(fields)
            .eq("id", job_id)
            .execute()
        )

    try:
        if storage_path:
            await _set(status="pending", status_message="Storing document")
            await asyncio.to_thread(
                lambda: supabase_admin.storage.from_("bids").upload(
                    path=storage_path,
                    file=content,
                    file_options={"content-type": mime, "upsert": "false"},
                )
            )
            await _set(storage_path=storage_path)

        await _set(status="parsing", status_message="Extracting text from document")
        parsed = await asyncio.to_thread(extract_to_markdown, content, mime)
        await _set(
            status="extracting",
            status_message="Calling Gemini AI",
            markdown_excerpt=parsed["markdown"][:2000],
        )
        result = await extract_bid(parsed["markdown"], thinking_budget=thinking_budget)
        await _set(
            status="complete",
            result=result.model_dump(mode="json"),
            completed_at=datetime.now(timezone.utc).isoformat(),
        )
    except Exception as e:
        await _set(status="failed", error_message=str(e)[:500])
