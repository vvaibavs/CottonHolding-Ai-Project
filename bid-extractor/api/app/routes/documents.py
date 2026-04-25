import magic
from fastapi import APIRouter, BackgroundTasks, Depends, File, Form, HTTPException, UploadFile
from pathlib import Path

from app.auth import get_current_user
from app.deps import supabase_admin
from app.gemini import generate_questions
from app.jobs import run_extraction
from app.schemas import BidExtraction
from app.settings import settings

router = APIRouter(tags=["documents"])

ALLOWED = {
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
}


@router.post("/documents", status_code=202)
async def upload(
    background: BackgroundTasks,
    file: UploadFile = File(...),
    thinking_budget: int = Form(4096),
    user: dict = Depends(get_current_user),
):
    if file.content_type not in ALLOWED:
        raise HTTPException(status_code=415, detail="Only PDF and DOCX accepted")

    max_bytes = settings.max_upload_mb * 1024 * 1024
    data = await file.read(max_bytes + 1)
    if len(data) > max_bytes:
        raise HTTPException(
            status_code=413, detail=f"File exceeds {settings.max_upload_mb} MB"
        )

    real_mime = magic.from_buffer(data[:2048], mime=True)
    if real_mime not in ALLOWED:
        raise HTTPException(status_code=415, detail=f"Content is {real_mime}")

    row = (
        supabase_admin.table("extractions")
        .insert(
            {
                "user_id": user["id"],
                "file_name": file.filename,
                "file_size_bytes": len(data),
                "mime_type": real_mime,
                "status": "pending",
            }
        )
        .execute()
    )
    job_id = row.data[0]["id"]

    safe_name = Path(file.filename or "upload").name or "upload"
    storage_path = f"{user['id']}/{job_id}/{safe_name}"
    supabase_admin.storage.from_("bids").upload(
        path=storage_path,
        file=data,
        file_options={"content-type": real_mime, "upsert": "false"},
    )
    supabase_admin.table("extractions").update(
        {"storage_path": storage_path}
    ).eq("id", job_id).execute()

    budget = max(0, min(4096, thinking_budget))
    background.add_task(run_extraction, job_id=job_id, content=data, mime=real_mime, thinking_budget=budget)
    return {"job_id": job_id, "status": "pending"}


@router.get("/documents/{job_id}/url")
async def get_document_url(job_id: str, user: dict = Depends(get_current_user)):
    row = (
        supabase_admin.table("extractions")
        .select("storage_path, user_id")
        .eq("id", job_id)
        .single()
        .execute()
    )
    if not row.data or row.data["user_id"] != user["id"]:
        raise HTTPException(status_code=404, detail="Not found")
    storage_path = row.data.get("storage_path")
    if not storage_path:
        raise HTTPException(status_code=404, detail="File not stored")
    signed = supabase_admin.storage.from_("bids").create_signed_url(
        storage_path, expires_in=3600
    )
    return {"url": signed["signedURL"]}


@router.post("/documents/{job_id}/questions")
async def gen_questions(job_id: str, user: dict = Depends(get_current_user)):
    row = (
        supabase_admin.table("extractions")
        .select("result, questions, user_id")
        .eq("id", job_id)
        .single()
        .execute()
    )
    if not row.data or row.data["user_id"] != user["id"]:
        raise HTTPException(status_code=404, detail="Not found")

    if row.data.get("questions"):
        return row.data["questions"]

    if not row.data.get("result"):
        raise HTTPException(status_code=400, detail="Extraction not complete")

    extraction = BidExtraction.model_validate(row.data["result"])
    question_set = await generate_questions(extraction)
    result_json = question_set.model_dump(mode="json")

    supabase_admin.table("extractions").update(
        {"questions": result_json}
    ).eq("id", job_id).execute()

    return result_json
