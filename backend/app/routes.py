from fastapi import APIRouter, Depends, Header, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from datetime import date, datetime, timedelta
from typing import Optional
import calendar

from app.database import get_db
from app.models import User, Diary, Portrait
from app.schemas import DiaryCreate, DiaryResponse, CalendarResponse, PortraitResponse, ApiKeyUpdate, ApiKeyResponse
from app.ai_service import generate_diary_evaluation, generate_user_portrait

router = APIRouter()


async def get_or_create_user(user_id: Optional[str], db: AsyncSession) -> User:
    if user_id:
        result = await db.execute(select(User).where(User.id == user_id))
        user = result.scalar_one_or_none()
        if user:
            return user
    
    new_user = User()
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)
    return new_user


@router.get("/user/init")
async def init_user(
    db: AsyncSession = Depends(get_db),
    x_user_id: str = Header(None, alias="X-User-ID")
):
    user = await get_or_create_user(x_user_id, db)
    return {"user_id": user.id}


@router.get("/diaries")
async def get_diary(
    date_param: str = None,
    db: AsyncSession = Depends(get_db),
    x_user_id: str = Header(None, alias="X-User-ID")
):
    user = await get_or_create_user(x_user_id, db)
    
    query = select(Diary).where(Diary.user_id == user.id)
    if date_param:
        diary_date = datetime.strptime(date_param, "%Y-%m-%d").date()
        query = query.where(Diary.date == diary_date)
        result = await db.execute(query)
        diary = result.scalar_one_or_none()
        if diary:
            return DiaryResponse.from_orm(diary)
        return None
    
    result = await db.execute(query.order_by(Diary.date.desc()))
    diaries = result.scalars().all()
    return [DiaryResponse.from_orm(d) for d in diaries]


@router.post("/diaries", response_model=DiaryResponse)
async def create_or_update_diary(
    diary_data: DiaryCreate,
    db: AsyncSession = Depends(get_db),
    x_user_id: str = Header(None, alias="X-User-ID")
):
    user = await get_or_create_user(x_user_id, db)
    diary_date = datetime.strptime(diary_data.date, "%Y-%m-%d").date()
    
    result = await db.execute(
        select(Diary).where(
            and_(Diary.user_id == user.id, Diary.date == diary_date)
        )
    )
    existing_diary = result.scalar_one_or_none()
    
    if existing_diary:
        existing_diary.content = diary_data.content or ""
        existing_diary.time_entries = [entry.model_dump() for entry in diary_data.time_entries] if diary_data.time_entries else None
        existing_diary.updated_at = datetime.utcnow()
        await db.commit()
        await db.refresh(existing_diary)
        return DiaryResponse.from_orm(existing_diary)
    
    new_diary = Diary(
        user_id=user.id,
        content=diary_data.content or "",
        date=diary_date,
        time_entries=[entry.model_dump() for entry in diary_data.time_entries] if diary_data.time_entries else None
    )
    db.add(new_diary)
    await db.commit()
    await db.refresh(new_diary)
    return DiaryResponse.from_orm(new_diary)


@router.delete("/diaries/{diary_id}")
async def delete_diary(
    diary_id: str,
    db: AsyncSession = Depends(get_db),
    x_user_id: str = Header(None, alias="X-User-ID")
):
    user = await get_or_create_user(x_user_id, db)
    
    result = await db.execute(
        select(Diary).where(Diary.id == diary_id, Diary.user_id == user.id)
    )
    diary = result.scalar_one_or_none()
    
    if not diary:
        raise HTTPException(status_code=404, detail="日记不存在")
    
    await db.delete(diary)
    await db.commit()
    return {"message": "删除成功"}


@router.post("/diaries/{diary_id}/ai-evaluate", response_model=DiaryResponse)
async def ai_evaluate_diary(
    diary_id: str,
    db: AsyncSession = Depends(get_db),
    x_user_id: str = Header(None, alias="X-User-ID")
):
    user = await get_or_create_user(x_user_id, db)
    
    result = await db.execute(
        select(Diary).where(Diary.id == diary_id, Diary.user_id == user.id)
    )
    diary = result.scalar_one_or_none()
    
    if not diary:
        raise HTTPException(status_code=404, detail="日记不存在")
    
    recent_result = await db.execute(
        select(Diary)
        .where(Diary.user_id == user.id, Diary.date <= diary.date)
        .order_by(Diary.date.desc())
        .limit(5)
    )
    recent_diaries = [
        {
            "date": str(d.date), 
            "content": d.content,
            "time_entries": d.time_entries
        } 
        for d in recent_result.scalars().all()
    ]
    
    portrait_result = await db.execute(
        select(Portrait)
        .where(Portrait.user_id == user.id)
        .order_by(Portrait.created_at.desc())
        .limit(1)
    )
    latest_portrait = portrait_result.scalar_one_or_none()
    portrait_data = latest_portrait.portrait_data if latest_portrait else None
    
    evaluation = await generate_diary_evaluation(
        diary.content, 
        diary.time_entries,
        recent_diaries, 
        portrait_data,
        user.api_key
    )
    
    diary.ai_evaluation = evaluation
    diary.updated_at = datetime.utcnow()
    await db.commit()
    await db.refresh(diary)
    
    return DiaryResponse.from_orm(diary)


@router.get("/calendar", response_model=CalendarResponse)
async def get_calendar(
    year: int,
    month: int,
    db: AsyncSession = Depends(get_db),
    x_user_id: str = Header(None, alias="X-User-ID")
):
    user = await get_or_create_user(x_user_id, db)
    
    _, last_day = calendar.monthrange(year, month)
    start_date = date(year, month, 1)
    end_date = date(year, month, last_day)
    
    result = await db.execute(
        select(Diary.date)
        .where(
            Diary.user_id == user.id,
            Diary.date >= start_date,
            Diary.date <= end_date
        )
        .distinct()
    )
    dates = [str(d[0]) for d in result.all()]
    
    return CalendarResponse(dates=dates)


@router.get("/portraits/latest", response_model=PortraitResponse)
async def get_latest_portrait(
    db: AsyncSession = Depends(get_db),
    x_user_id: str = Header(None, alias="X-User-ID")
):
    user = await get_or_create_user(x_user_id, db)
    
    result = await db.execute(
        select(Portrait)
        .where(Portrait.user_id == user.id)
        .order_by(Portrait.created_at.desc())
        .limit(1)
    )
    portrait = result.scalar_one_or_none()
    
    if not portrait:
        return None
    
    return PortraitResponse.from_orm(portrait)


@router.post("/portraits/generate")
async def generate_portrait(
    db: AsyncSession = Depends(get_db),
    x_user_id: str = Header(None, alias="X-User-ID")
):
    user = await get_or_create_user(x_user_id, db)
    
    today = date.today()
    week_start = today - timedelta(days=today.weekday())
    week_end = week_start + timedelta(days=6)
    
    result = await db.execute(
        select(Diary)
        .where(
            Diary.user_id == user.id,
            Diary.date >= week_start,
            Diary.date <= week_end
        )
        .order_by(Diary.date.asc())
    )
    week_diaries = result.scalars().all()
    
    if not week_diaries:
        raise HTTPException(status_code=400, detail="本周暂无日记，无法生成画像")
    
    diaries_data = [
        {
            "date": str(d.date), 
            "content": d.content,
            "time_entries": d.time_entries
        } 
        for d in week_diaries
    ]
    
    portrait_data = await generate_user_portrait(diaries_data, user.api_key)
    
    if "error" in portrait_data:
        raise HTTPException(status_code=500, detail=portrait_data["error"])
    
    new_portrait = Portrait(
        user_id=user.id,
        period_start=week_start,
        period_end=week_end,
        portrait_data=portrait_data
    )
    db.add(new_portrait)
    await db.commit()
    await db.refresh(new_portrait)
    
    return PortraitResponse.from_orm(new_portrait)


@router.get("/settings/api-key", response_model=ApiKeyResponse)
async def get_api_key_status(
    db: AsyncSession = Depends(get_db),
    x_user_id: str = Header(None, alias="X-User-ID")
):
    user = await get_or_create_user(x_user_id, db)
    return ApiKeyResponse(has_api_key=bool(user.api_key))


@router.post("/settings/api-key")
async def update_api_key(
    data: ApiKeyUpdate,
    db: AsyncSession = Depends(get_db),
    x_user_id: str = Header(None, alias="X-User-ID")
):
    user = await get_or_create_user(x_user_id, db)
    user.api_key = data.api_key if data.api_key else None
    await db.commit()
    return {"message": "API Key已保存"}


@router.delete("/settings/api-key")
async def delete_api_key(
    db: AsyncSession = Depends(get_db),
    x_user_id: str = Header(None, alias="X-User-ID")
):
    user = await get_or_create_user(x_user_id, db)
    user.api_key = None
    await db.commit()
    return {"message": "API Key已删除"}
