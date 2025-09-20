import os
import datetime as dt
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from pydantic import BaseModel, EmailStr
from jose import jwt, JWTError
from passlib.context import CryptContext
from sqlalchemy import Column, Integer, String, DateTime, Float, ForeignKey, create_engine, text
from sqlalchemy.orm import declarative_base, sessionmaker, relationship, Session


# Database setup
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./srs.db")
connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}
engine = create_engine(DATABASE_URL, echo=False, future=True, connect_args=connect_args)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False, future=True)
Base = declarative_base()


class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    created_at = Column(DateTime, default=dt.datetime.utcnow)


class Item(Base):
    __tablename__ = "items"
    id = Column(Integer, primary_key=True, index=True)
    german = Column(String, nullable=False)
    english = Column(String, nullable=False)
    level = Column(String, index=True)
    frequency = Column(Integer, default=0)


class UserSRS(Base):
    __tablename__ = "user_srs"
    user_id = Column(Integer, ForeignKey("users.id"), primary_key=True)
    item_id = Column(Integer, ForeignKey("items.id"), primary_key=True)
    ease = Column(Float, default=2.5)
    interval = Column(Integer, default=0)  # days
    reps = Column(Integer, default=0)
    lapses = Column(Integer, default=0)
    due = Column(DateTime, default=dt.datetime.utcnow)
    last_reviewed = Column(DateTime, default=None)


class Review(Base):
    __tablename__ = "reviews"
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    item_id = Column(Integer, ForeignKey("items.id"))
    rating = Column(Integer)  # 1-4 (Again, Hard, Good, Easy)
    response_ms = Column(Integer, default=0)
    reviewed_at = Column(DateTime, default=dt.datetime.utcnow)


def init_db():
    Base.metadata.create_all(bind=engine)


# Auth setup
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

JWT_SECRET = os.getenv("JWT_SECRET", "dev_secret_change_me")
JWT_ALGO = "HS256"
ACCESS_EXPIRES_MIN = int(os.getenv("ACCESS_EXPIRES_MIN", "60"))


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(password: str, password_hash: str) -> bool:
    return pwd_context.verify(password, password_hash)


def create_access_token(data: dict, expires_delta: Optional[dt.timedelta] = None):
    to_encode = data.copy()
    expire = dt.datetime.utcnow() + (expires_delta or dt.timedelta(minutes=ACCESS_EXPIRES_MIN))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, JWT_SECRET, algorithm=JWT_ALGO)


def get_current_user(db: Session = Depends(get_db), token: str = Depends(oauth2_scheme)) -> User:
    credentials_exc = HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Could not validate credentials")
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGO])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exc
    except JWTError:
        raise credentials_exc
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise credentials_exc
    return user


# Schemas
class SignupIn(BaseModel):
    email: EmailStr
    password: str


class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"


class ItemOut(BaseModel):
    id: int
    german: str
    english: str
    level: Optional[str] = None
    frequency: Optional[int] = 0


class ReviewIn(BaseModel):
    item_id: int
    rating: int  # 1-again, 2-hard, 3-good, 4-easy
    response_ms: Optional[int] = 0


# SM-2 scheduling (simplified)
def sm2_schedule(s: UserSRS, rating: int) -> UserSRS:
    now = dt.datetime.utcnow()
    if rating < 3:  # Again/Hard
        s.reps = 0
        s.lapses += 1
        s.interval = 1
    else:
        if s.reps == 0:
            s.interval = 1 if rating == 3 else 3
        elif s.reps == 1:
            s.interval = 6 if rating >= 3 else 1
        else:
            s.interval = int(round(s.interval * s.ease))

        # Ease factor update
        # rating: 1,2,3,4 → q: 0,1,2,3 mapped to delta
        q = max(0, min(3, rating - 1))
        s.ease = max(1.3, s.ease + (0.1 - (3 - q) * (0.08 + (3 - q) * 0.02)))
        s.reps += 1

    s.due = now + dt.timedelta(days=s.interval)
    s.last_reviewed = now
    return s


router = APIRouter()


@router.post("/auth/signup", response_model=TokenOut)
def signup(data: SignupIn, db: Session = Depends(get_db)):
    if db.query(User).filter(User.email == data.email).first():
        raise HTTPException(status_code=400, detail="Email already in use")
    user = User(email=data.email, password_hash=hash_password(data.password))
    db.add(user)
    db.commit()
    token = create_access_token({"sub": user.email})
    return TokenOut(access_token=token)


@router.post("/auth/login", response_model=TokenOut)
def login(form: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == form.username).first()
    if not user or not verify_password(form.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = create_access_token({"sub": user.email})
    return TokenOut(access_token=token)


@router.get("/me")
def me(user: User = Depends(get_current_user)):
    return {"email": user.email, "id": user.id}


@router.get("/srs/due", response_model=List[ItemOut])
def get_due(level: Optional[str] = None, limit: int = 20, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    now = dt.datetime.utcnow()
    # Join items with user_srs; include items without state (treat as due now)
    q = db.query(Item).filter(Item.level == level) if level else db.query(Item)
    items = q.limit(limit * 10).all()
    due_items: List[Item] = []
    for it in items:
        s = db.query(UserSRS).filter(UserSRS.user_id == user.id, UserSRS.item_id == it.id).first()
        if not s or (s.due and s.due <= now):
            due_items.append(it)
        if len(due_items) >= limit:
            break
    return [ItemOut(id=i.id, german=i.german, english=i.english, level=i.level, frequency=i.frequency) for i in due_items]


@router.post("/srs/review")
def post_review(data: ReviewIn, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    item = db.query(Item).filter(Item.id == data.item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    s = db.query(UserSRS).filter(UserSRS.user_id == user.id, UserSRS.item_id == item.id).first()
    if not s:
        s = UserSRS(user_id=user.id, item_id=item.id, ease=2.5, interval=0, reps=0, lapses=0, due=dt.datetime.utcnow())
        db.add(s)
        db.flush()

    sm2_schedule(s, data.rating)
    db.add(Review(user_id=user.id, item_id=item.id, rating=data.rating, response_ms=data.response_ms))
    db.commit()
    return {"ok": True, "next_due": s.due.isoformat(), "interval_days": s.interval, "ease": round(s.ease, 2)}


@router.post("/srs/items/import")
def import_items(items: List[ItemOut], db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    # Simple import endpoint for initial seeding (admin-lite)
    inserted = 0
    for it in items:
        exists = db.query(Item).filter(Item.german == it.german).first()
        if exists:
            continue
        db.add(Item(german=it.german, english=it.english, level=it.level, frequency=it.frequency or 0))
        inserted += 1
    db.commit()
    return {"inserted": inserted}

