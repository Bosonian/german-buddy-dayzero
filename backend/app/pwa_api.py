
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List, Optional

from .database import get_db, User, Item, UserSRS, get_current_user
from .srs import fsrs_schedule
from pydantic import BaseModel
from fsrs import Rating

class ItemOut(BaseModel):
    id: int
    german: str
    english: str
    frequency: Optional[int] = 0
    pattern: Optional[str] = None
    source: Optional[str] = None

class ReviewIn(BaseModel):
    item_id: int
    rating: int  # 1-again, 2-hard, 3-good, 4-easy

router = APIRouter()

@router.get("/pwa/exercises", response_model=List[ItemOut])
def get_exercises_for_pwa(
    limit: int = 20,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get exercises for the PWA.
    """
    items = db.query(Item).order_by(Item.frequency.desc()).limit(limit).all()
    return [ItemOut(id=i.id, german=i.german, english=i.english, frequency=i.frequency) for i in items]

@router.post("/pwa/review")
def post_review_for_pwa(data: ReviewIn, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    item = db.query(Item).filter(Item.id == data.item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    
    s = db.query(UserSRS).filter(UserSRS.user_id == user.id, UserSRS.item_id == item.id).first()
    if not s:
        s = UserSRS(user_id=user.id, item_id=item.id)
        db.add(s)
        db.flush()

    card = Card(stability=s.stability, difficulty=s.difficulty)
    card = fsrs_schedule(card, Rating(data.rating))

    s.stability = card.stability
    s.difficulty = card.difficulty
    s.due = card.due
    s.last_reviewed = card.last_review

    db.commit()
    return {"ok": True}
