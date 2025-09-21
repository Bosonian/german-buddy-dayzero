import datetime as dt
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey
from sqlalchemy.orm import Session

from .srs import Base, engine, SessionLocal, get_current_user, User


class ReadingItem(Base):
    __tablename__ = "reading_items"
    id = Column(Integer, primary_key=True)
    cefr = Column(String, index=True)  # A1..C2
    topic = Column(String, index=True)
    title = Column(String)
    text = Column(Text, nullable=False)
    tokens = Column(Integer, default=0)
    features_json = Column(Text, default='{}')
    license = Column(String, default='')
    source_url = Column(String, default='')
    created_at = Column(DateTime, default=dt.datetime.utcnow, index=True)


class UserReading(Base):
    __tablename__ = "user_reading"
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True)
    item_id = Column(Integer, ForeignKey("reading_items.id"), index=True)
    score = Column(Integer, default=0)
    time_ms = Column(Integer, default=0)
    read_at = Column(DateTime, default=dt.datetime.utcnow)


def init_reading_db():
    Base.metadata.create_all(bind=engine)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


class ReadingOut(BaseModel):
    id: int
    cefr: str
    topic: Optional[str] = ''
    title: Optional[str] = ''
    text: str
    tokens: int
    source_url: Optional[str] = ''
    license: Optional[str] = ''


class ReadingImportIn(BaseModel):
    cefr: str
    topic: Optional[str] = ''
    title: Optional[str] = ''
    text: str
    tokens: Optional[int] = 0
    features_json: Optional[str] = '{}'
    license: Optional[str] = ''
    source_url: Optional[str] = ''


class TrackIn(BaseModel):
    item_id: int
    score: int = 0
    time_ms: int = 0


router = APIRouter()


@router.get("/reading/daily", response_model=List[ReadingOut])
def get_daily_readings(level: Optional[str] = None, limit: int = 2, db: Session = Depends(get_db)):
    q = db.query(ReadingItem)
    if level:
        q = q.filter(ReadingItem.cefr == level)
    items = q.order_by(ReadingItem.created_at.desc()).limit(min(limit, 10)).all()
    return [ReadingOut(id=i.id, cefr=i.cefr, topic=i.topic, title=i.title, text=i.text, tokens=i.tokens, source_url=i.source_url, license=i.license) for i in items]


@router.post("/reading/track")
def track_reading(data: TrackIn, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    it = db.query(ReadingItem).filter(ReadingItem.id == data.item_id).first()
    if not it:
        raise HTTPException(status_code=404, detail="Reading item not found")
    rec = UserReading(user_id=user.id, item_id=it.id, score=max(0, min(100, data.score)), time_ms=max(0, data.time_ms))
    db.add(rec)
    db.commit()
    return {"ok": True}


@router.post("/reading/import")
def import_readings(items: List[ReadingImportIn], user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    # Admin-lite: allow authenticated import; add proper role later
    inserted = 0
    for it in items:
        # Basic dedupe by title+cefr+len(text)
        exists = db.query(ReadingItem).filter(ReadingItem.cefr == it.cefr, ReadingItem.title == it.title, ReadingItem.tokens == (it.tokens or 0)).first()
        if exists:
            continue
        db.add(ReadingItem(
            cefr=it.cefr,
            topic=it.topic or '',
            title=it.title or '',
            text=it.text,
            tokens=it.tokens or len(it.text.split()),
            features_json=it.features_json or '{}',
            license=it.license or '',
            source_url=it.source_url or ''
        ))
        inserted += 1
    db.commit()
    return {"inserted": inserted}

