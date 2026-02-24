from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from sqlalchemy import text

from app.database import init_db, engine
from app.routes import router


async def migrate_db():
    async with engine.begin() as conn:
        result = await conn.execute(text("PRAGMA table_info(diaries)"))
        columns = [row[1] for row in result.fetchall()]
        if 'time_entries' not in columns:
            await conn.execute(text("ALTER TABLE diaries ADD COLUMN time_entries JSON"))


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    await migrate_db()
    yield


app = FastAPI(
    title="智能日记本 API",
    description="AI日记本后端服务",
    version="1.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router, prefix="/api/v1")


@app.get("/")
async def root():
    return {"message": "智能日记本 API 服务运行中"}
