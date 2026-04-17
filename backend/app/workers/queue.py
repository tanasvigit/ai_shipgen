import asyncio
import json
import uuid
from collections import deque
from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Any

import redis

from ..core.config import settings


@dataclass
class Job:
    id: str
    job_type: str
    payload: dict[str, Any]
    attempts: int = 0
    max_retries: int = 3
    idempotency_key: str | None = None
    created_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))


_redis_client: redis.Redis | None = None
_memory_queue: deque[Job] = deque()


def get_redis_client() -> redis.Redis:
    global _redis_client
    if _redis_client is None:
        _redis_client = redis.Redis.from_url(settings.redis_url, decode_responses=True)
    return _redis_client


def _serialize_job(job: Job) -> str:
    return json.dumps(
        {
            "id": job.id,
            "jobType": job.job_type,
            "payload": job.payload,
            "attempts": job.attempts,
            "maxRetries": job.max_retries,
            "idempotencyKey": job.idempotency_key,
            "createdAt": job.created_at.isoformat(),
        }
    )


def _deserialize_job(raw: str) -> Job:
    parsed = json.loads(raw)
    return Job(
        id=parsed["id"],
        job_type=parsed["jobType"],
        payload=parsed["payload"],
        attempts=parsed.get("attempts", 0),
        max_retries=parsed.get("maxRetries", 3),
        idempotency_key=parsed.get("idempotencyKey"),
        created_at=datetime.fromisoformat(parsed["createdAt"]),
    )


def _new_job(job_type: str, payload: dict[str, Any], max_retries: int = 3) -> Job:
    return Job(
        id=str(uuid.uuid4()),
        job_type=job_type,
        payload=payload,
        max_retries=max_retries,
        idempotency_key=payload.get("idempotencyKey"),
    )


async def enqueue_job(job_type: str, payload: dict[str, Any], max_retries: int = 3) -> None:
    await asyncio.to_thread(enqueue_job_sync, job_type, payload, max_retries)


def enqueue_job_sync(job_type: str, payload: dict[str, Any], max_retries: int = 3) -> None:
    job = _new_job(job_type=job_type, payload=payload, max_retries=max_retries)
    if settings.queue_backend != "redis":
        _memory_queue.append(job)
        return
    redis_client = get_redis_client()
    redis_client.rpush(settings.queue_name, _serialize_job(job))


def pop_job(timeout_seconds: int = 3) -> Job | None:
    if settings.queue_backend != "redis":
        if _memory_queue:
            return _memory_queue.popleft()
        return None
    redis_client = get_redis_client()
    result = redis_client.blpop(settings.queue_name, timeout=timeout_seconds)
    if result is None:
        return None
    _, raw_job = result
    return _deserialize_job(raw_job)


def push_dead_letter(job: Job, error: str) -> None:
    if settings.queue_backend != "redis":
        return
    redis_client = get_redis_client()
    payload = {
        "job": json.loads(_serialize_job(job)),
        "error": error,
        "deadLetteredAt": datetime.now(timezone.utc).isoformat(),
    }
    redis_client.rpush(settings.dead_letter_queue_name, json.dumps(payload))


def requeue_job(job: Job) -> None:
    if settings.queue_backend != "redis":
        _memory_queue.append(job)
        return
    redis_client = get_redis_client()
    redis_client.rpush(settings.queue_name, _serialize_job(job))


def mark_idempotency(job: Job) -> bool:
    if not job.idempotency_key:
        return True
    if settings.queue_backend != "redis":
        return True
    redis_client = get_redis_client()
    key = f"shipgen:idempotency:{job.idempotency_key}"
    # setnx-like behavior using set with nx
    return bool(redis_client.set(key, "1", nx=True, ex=24 * 3600))
