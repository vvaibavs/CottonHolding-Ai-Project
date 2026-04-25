from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.deps import supabase_admin

bearer = HTTPBearer(auto_error=True)


def get_current_user(
    cred: HTTPAuthorizationCredentials = Depends(bearer),
) -> dict:
    try:
        res = supabase_admin.auth.get_user(cred.credentials)
        user = res.user
        if not user:
            raise HTTPException(status_code=401, detail="Invalid token")
        return {"id": user.id, "email": user.email}
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")
