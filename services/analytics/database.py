
"""
PostgreSQL connection pool and data-access helpers.

Drizzle migrations remain the single source of truth for:
- visitors
- sessions
- events

This module connects to PostgreSQL and executes queries only.
It does not create tables or run migrations.
"""

from __future__ import annotations

import os
from contextlib import asynccontextmanager
from typing import AsyncIterator
from uuid import UUID
from datetime import datetime

import asyncpg
from asyncpg import Pool, Record
from dotenv import load_dotenv

load_dotenv()

_pool: Pool | None = None


async def get_pool() -> Pool:
    """Return the shared PostgreSQL connection pool."""
    global _pool

    if _pool is None:
        database_url = os.environ.get("DATABASE_URL")

        if not database_url:
            raise RuntimeError(
                "DATABASE_URL is not set. Configure your analytics "
                "service environment before starting FastAPI."
            )

        _pool = await asyncpg.create_pool(
            database_url,
            min_size=1,
            max_size=5,
            command_timeout=30,
            statement_cache_size=0,
        )

    return _pool


async def close_pool() -> None:
    """Close the shared connection pool."""
    global _pool

    if _pool is not None:
        await _pool.close()
        _pool = None


@asynccontextmanager
async def get_connection() -> AsyncIterator[asyncpg.Connection]:
    """Acquire a connection from the shared pool."""
    pool = await get_pool()

    async with pool.acquire() as connection:
        yield connection


async def create_visitor(
    connection: asyncpg.Connection,
) -> UUID:
    """Create an anonymous visitor and return its ID."""
    visitor_id = await connection.fetchval(
        """
        INSERT INTO visitors DEFAULT VALUES
        RETURNING id
        """
    )

    return visitor_id


async def create_session(
    connection: asyncpg.Connection,
    visitor_id: UUID,
) -> UUID:
    """Create a session associated with an existing visitor."""
    session_id = await connection.fetchval(
        """
        INSERT INTO sessions (visitor_id)
        VALUES ($1)
        RETURNING id
        """,
        visitor_id,
    )

    return session_id


async def validate_visitor_session(
    connection: asyncpg.Connection,
    visitor_id: UUID,
    session_id: UUID | None,
) -> bool:
    """
    Verify that the visitor exists and, when supplied, the session
    belongs to that visitor.
    """
    if session_id is None:
        exists = await connection.fetchval(
            "SELECT EXISTS (SELECT 1 FROM visitors WHERE id = $1)",
            visitor_id,
        )
        return bool(exists)

    exists = await connection.fetchval(
        """
        SELECT EXISTS (
            SELECT 1
            FROM sessions
            WHERE id = $1
              AND visitor_id = $2
        )
        """,
        session_id,
        visitor_id,
    )

    return bool(exists)



async def insert_event(
    connection: asyncpg.Connection,
    *,
    visitor_id: UUID,
    session_id: UUID | None,
    event_name: str,
    event_type: str,
    feature: str,
    journey: str | None,
    metadata: dict,
    timestamp: datetime | None = None,
) -> Record:
    """Persist an event using the existing Drizzle-managed schema."""
    import json

    row = await connection.fetchrow(
        """
        INSERT INTO events (
            visitor_id,
            session_id,
            event_name,
            event_type,
            feature,
            journey,
            timestamp,
            metadata
        )
        VALUES (
            $1, $2, $3, $4, $5, $6,
            COALESCE($7, NOW()),
            $8::jsonb
        )
        RETURNING
            id,
            visitor_id,
            session_id,
            event_name,
            event_type,
            feature,
            journey,
            timestamp,
            metadata
        """,
        visitor_id,
        session_id,
        event_name,
        event_type,
        feature,
        journey,
        timestamp,
        json.dumps(metadata),
    )

    return row
