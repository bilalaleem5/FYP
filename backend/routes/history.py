"""Append-only user search / browse signals for embedding-based recommendations."""
from fastapi import APIRouter, Depends, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

import database
import models
from utils.auth import get_current_user

router = APIRouter()


class SearchHistoryBody(BaseModel):
    query: str = Field(..., min_length=1, max_length=500)


@router.post("/search-history", status_code=status.HTTP_201_CREATED)
def add_search_history(
    body: SearchHistoryBody,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_user),
):
    row = models.UserSearchHistory(
        user_id=current_user.id,
        query_text=body.query.strip()[:500],
    )
    db.add(row)
    db.commit()
    return {"ok": True}
