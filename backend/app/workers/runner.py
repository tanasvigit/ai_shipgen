import asyncio

from ..database import SessionLocal
from .queue import Job, mark_idempotency, pop_job, push_dead_letter, requeue_job
from .tasks import process_notification_job, process_prediction_job


async def run_worker_loop() -> None:
    while True:
        job: Job | None = await asyncio.to_thread(pop_job, 2)
        if job is None:
            await asyncio.sleep(0.1)
            continue
        if not mark_idempotency(job):
            continue
        try:
            with SessionLocal() as db:
                if job.job_type == "notification":
                    process_notification_job(db, job.payload)
                elif job.job_type == "prediction":
                    process_prediction_job(db, job.payload)
        except Exception:  # noqa: BLE001
            job.attempts += 1
            if job.attempts <= job.max_retries:
                await asyncio.sleep(0.2 * job.attempts)
                requeue_job(job)
            else:
                push_dead_letter(job, "max_retries_exceeded")
