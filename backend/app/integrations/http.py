"""Shared httpx client factory for outbound music-API calls.

Centralizes the TLS-verify setting so dev machines behind a TLS-inspection
proxy (e.g. Avast) can disable verification via EXTERNAL_SSL_VERIFY=false
without each integration hard-coding it.
"""
import httpx
from app.config import settings


def async_client(timeout: float = 20.0) -> httpx.AsyncClient:
    return httpx.AsyncClient(timeout=timeout, verify=settings.external_ssl_verify)


def sync_client(timeout: float = 20.0) -> httpx.Client:
    return httpx.Client(timeout=timeout, verify=settings.external_ssl_verify)
