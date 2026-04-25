from fastapi import APIRouter, Depends, HTTPException

from app.auth import get_current_user
from app.deps import supabase_admin

router = APIRouter(tags=["jobs"])


@router.get("/jobs/{job_id}")
async def get_job(job_id: str, user: dict = Depends(get_current_user)):
    row = (
        supabase_admin.table("extractions")
        .select("*")
        .eq("id", job_id)
        .eq("user_id", user["id"])
        .single()
        .execute()
    )
    if not row.data:
        raise HTTPException(status_code=404, detail="Job not found")
    return row.data


@router.delete("/jobs/{job_id}", status_code=204)
async def delete_job(job_id: str, user: dict = Depends(get_current_user)):
    row = (
        supabase_admin.table("extractions")
        .select("id, storage_path")
        .eq("id", job_id)
        .eq("user_id", user["id"])
        .single()
        .execute()
    )
    if not row.data:
        raise HTTPException(status_code=404, detail="Job not found")
    if row.data.get("storage_path"):
        supabase_admin.storage.from_("bids").remove([row.data["storage_path"]])
    supabase_admin.table("extractions").delete().eq("id", job_id).execute()
    return None


@router.get("/jobs")
async def list_jobs(user: dict = Depends(get_current_user)):
    rows = (
        supabase_admin.table("extractions")
        .select("id, file_name, status, created_at, completed_at")
        .eq("user_id", user["id"])
        .order("created_at", desc=True)
        .limit(50)
        .execute()
    )
    return rows.data
