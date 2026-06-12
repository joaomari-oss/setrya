from celery import Celery
from app.config import settings

celery_app = Celery(
    "setrya",
    broker=settings.celery_broker_url,
    backend=settings.celery_result_backend,
    include=["app.tasks"],
)

celery_app.conf.update(
    task_serializer="json",
    result_serializer="json",
    accept_content=["json"],
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    task_time_limit=600,        # 10 min hard limit per track
    task_soft_time_limit=540,
    worker_max_tasks_per_child=20,  # recycle workers — librosa leaks memory
    worker_prefetch_multiplier=1,
)
