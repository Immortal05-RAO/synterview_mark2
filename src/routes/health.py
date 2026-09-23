from datetime import datetime, timezone
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text

from src.database import get_db

router = APIRouter(prefix="/api/health", tags=["Health Check"])


@router.get("")
def health_check(db: Session = Depends(get_db)):
    db_status = "connected"
    try:
        db.execute(text("SELECT 1"))
    except Exception as e:
        db_status = f"disconnected ({str(e)})"

    return {
        "status": "ok",
        "service": "synterview-backend",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "database": db_status
    }
