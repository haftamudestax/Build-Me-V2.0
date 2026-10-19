import logging
import os
from contextlib import asynccontextmanager
from fastapi.middleware.cors import CORSMiddleware
from src.config.cors import ALLOWED_ORIGINS

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException

from database import close_pool, get_connection
from src.reporting.navbar import router as navbar_reporting_router
from src.tracking.navbar import router as navbar_tracking_router
from src.tracking.visitors import router as visitors_router
from src.reporting.hero import router as hero_reporting_router


load_dotenv()

logging.basicConfig(
    level=os.getenv("LOG_LEVEL", "INFO").upper(),
)
logger = logging.getLogger("build-me.analytics")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Verify the database configuration and connectivity at startup.
    try:
        async with get_connection() as connection:
            await connection.fetchval("SELECT 1")

        logger.info("Analytics service database connection verified.")
        yield
    finally:
        await close_pool()
        logger.info("Analytics service database pool closed.")


app = FastAPI(
    title="Build Me Analytics API",
    description="Navbar event tracking and reporting service.",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=False,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type", "X-Admin-Token"],
)

app.include_router(navbar_tracking_router)
app.include_router(navbar_reporting_router)
app.include_router(hero_reporting_router)
app.include_router(visitors_router)


@app.get("/", tags=["Health"])
async def root():
    return {
        "service": "Build Me Analytics API",
        "status": "running",
        "docs": "/docs",
        "health": "/health",
    }


@app.get("/health", tags=["Health"])
async def health():
    try:
        async with get_connection() as connection:
            await connection.fetchval("SELECT 1")
    except Exception as exc:
        logger.warning(
            "Analytics health check failed: %s",
            type(exc).__name__,
        )
        raise HTTPException(
            status_code=503,
            detail="Analytics database is unavailable.",
        ) from exc

    return {
        "status": "ok",
        "database": "connected",
    }
