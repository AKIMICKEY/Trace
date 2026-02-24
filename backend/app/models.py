import uuid
from datetime import date, datetime
from sqlalchemy import Column, String, Text, Date, DateTime, JSON, UniqueConstraint
from sqlalchemy.dialects.sqlite import BLOB
from app.database import Base


def generate_uuid():
    return str(uuid.uuid4())


class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    api_key = Column(String(128), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class Diary(Base):
    __tablename__ = "diaries"
    __table_args__ = (UniqueConstraint("user_id", "date", name="uq_user_date"),)

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), nullable=False, index=True)
    content = Column(Text, nullable=False)
    date = Column(Date, nullable=False, index=True)
    time_entries = Column(JSON, nullable=True)
    ai_evaluation = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class Portrait(Base):
    __tablename__ = "portraits"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), nullable=False, index=True)
    period_start = Column(Date, nullable=False)
    period_end = Column(Date, nullable=False)
    portrait_data = Column(JSON, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
