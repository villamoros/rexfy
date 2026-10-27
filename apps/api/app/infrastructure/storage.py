"""Where uploaded files live: a local folder in development, S3-compatible storage elsewhere."""

from functools import lru_cache
from pathlib import Path
from typing import Protocol

import boto3

from app.core.config import get_settings


class Storage(Protocol):
    def save(self, key: str, data: bytes, content_type: str) -> None: ...

    def delete(self, key: str) -> None: ...

    def url(self, key: str) -> str: ...


class LocalStorage:
    """Files on disk, served by the API itself at /files/<key>."""

    def __init__(self, root: Path, public_url: str) -> None:
        self.root = root
        self._public_url = public_url.rstrip("/")

    def path(self, key: str) -> Path:
        path = (self.root / key).resolve()
        if not path.is_relative_to(self.root.resolve()):
            raise ValueError("Ruta de archivo no válida")
        return path

    def save(self, key: str, data: bytes, content_type: str) -> None:
        path = self.path(key)
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_bytes(data)

    def delete(self, key: str) -> None:
        self.path(key).unlink(missing_ok=True)

    def url(self, key: str) -> str:
        return f"{self._public_url}/files/{key}"


class S3Storage:
    """Any S3-compatible bucket (AWS S3, Cloudflare R2, MinIO) with public-read objects."""

    def __init__(self, bucket: str, public_url: str, **client_options: str | None) -> None:
        self._bucket = bucket
        self._public_url = public_url.rstrip("/")
        self._client = boto3.client("s3", **{k: v for k, v in client_options.items() if v})

    def save(self, key: str, data: bytes, content_type: str) -> None:
        self._client.put_object(
            Bucket=self._bucket,
            Key=key,
            Body=data,
            ContentType=content_type,
            CacheControl="public, max-age=31536000, immutable",
        )

    def delete(self, key: str) -> None:
        self._client.delete_object(Bucket=self._bucket, Key=key)

    def url(self, key: str) -> str:
        return f"{self._public_url}/{key}"


@lru_cache
def get_storage() -> Storage:
    settings = get_settings()
    if settings.storage_backend == "s3":
        return S3Storage(
            settings.s3_bucket,
            settings.s3_public_url,
            endpoint_url=settings.s3_endpoint_url,
            region_name=settings.s3_region,
            aws_access_key_id=settings.s3_access_key_id,
            aws_secret_access_key=settings.s3_secret_access_key,
        )
    return LocalStorage(Path(settings.local_storage_dir), settings.public_api_url)
