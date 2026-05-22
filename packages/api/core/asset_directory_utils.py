# Author: RioRyuGen
# Date: 2026-05-22
# Revision: 1.0.0
import os
from typing import Optional
from urllib.parse import urlparse, unquote

from core.get_env import get_app_data_directory_env, get_fastapi_public_base_url


def absolute_fastapi_asset_url(path: str) -> str:
    """
    Turn a FastAPI-served path (/app_data/..., /static/...) into a full URL when the public
    base is configured (split Next + FastAPI, e.g. Electron); otherwise return the path.
    """
    p = (path or "").strip()
    if not p:
        return p
    if p.startswith(("http://", "https://")):
        return p
    if not p.startswith("/"):
        p = f"/{p}"
    base = get_fastapi_public_base_url()
    if base:
        return f"{base}{p}"
    return p


def normalize_slide_asset_url(path_or_url: str) -> str:
    """Slide JSON media URLs: keep https/data/blob; make /app_data and /static absolute when FastAPI base is set."""
    if not path_or_url or not isinstance(path_or_url, str):
        return path_or_url
    s = path_or_url.strip()
    if s.startswith(("http://", "https://", "data:", "blob:")):
        return s
    if s.startswith(("/app_data/", "/static/")):
        return absolute_fastapi_asset_url(s)
    return filesystem_image_path_to_app_data_url(s)


def filesystem_image_path_to_app_data_url(path_or_url: str) -> str:
    """
    Browser-facing URL for files saved under APP_DATA_DIRECTORY/images.

    Raw absolute paths (Linux/macOS/Windows) are interpreted by the browser as paths on the
    web origin (e.g. Next.js), so AI-generated images break while https stock URLs work.
    Map known app-data image files to FastAPI's /app_data/images/... mount, as an absolute
    URL when NEXT_PUBLIC_FAST_API is set (Electron).
    """
    if not path_or_url or not isinstance(path_or_url, str):
        return path_or_url
    stripped = path_or_url.strip()
    if stripped.startswith(("http://", "https://", "data:", "blob:")):
        return stripped
    if stripped.startswith(("/app_data/", "/static/")):
        return absolute_fastapi_asset_url(stripped)
    app_data = get_app_data_directory_env()
    if not app_data:
        return stripped
    images_root = os.path.normpath(os.path.join(app_data, "images"))
    try:
        abs_image = os.path.normpath(os.path.abspath(stripped))
        abs_root = os.path.normpath(os.path.abspath(images_root))
    except (OSError, ValueError):
        return stripped
    abs_image_key = os.path.normcase(abs_image)
    abs_root_key = os.path.normcase(abs_root)
    try:
        common = os.path.commonpath([abs_root, abs_image])
    except ValueError:
        return stripped
    if os.path.normcase(common) != abs_root_key:
        return stripped
    rel = os.path.relpath(abs_image, abs_root)
    if rel.startswith(".."):
        return stripped
    return absolute_fastapi_asset_url("/app_data/images/" + rel.replace(os.sep, "/"))


def resolve_app_path_to_filesystem(path_or_url: str) -> Optional[str]:
    """
    Resolve an app-served path or URL to an actual filesystem path.

    Handles:
    - Path strings: /app_data/images/..., /static/..., absolute paths, relative
    - file:// URLs returned by export runtimes
        - HTTP URLs whose path component is an absolute filesystem path:
      When img src is /Users/.../images/xxx.png, browser resolves to
      http://origin/Users/.../images/xxx.png. Next.js returns 404 for these.

    Returns the filesystem path if the file exists, else None.
    """
    if not path_or_url:
        return None
    # Extract path from HTTP URL if needed
    path = path_or_url
    if path_or_url.startswith("http") or path_or_url.startswith("file:"):
        try:
            parsed = urlparse(path_or_url)
            path = unquote(parsed.path)
            if parsed.scheme == "file" and os.name == "nt" and path.startswith("/"):
                path = path[1:]
        except Exception:
            return None
    # Handle /app_data/images/
    if path.startswith("/app_data/images/"):
        relative = path[len("/app_data/images/"):]
        app_data = get_app_data_directory_env()
        if app_data:
            actual = os.path.join(app_data, "images", relative)
            if os.path.isfile(actual):
                return actual
        # Fallback: get_images_directory() + relative
        actual = os.path.join(get_images_directory(), relative)
        return actual if os.path.isfile(actual) else None
    # Handle /app_data/ (other subdirs)
    if path.startswith("/app_data/"):
        relative = path[len("/app_data/"):]
        app_data = get_app_data_directory_env()
        if app_data:
            actual = os.path.join(app_data, relative)
            return actual if os.path.isfile(actual) else None
    # Handle absolute filesystem path (e.g. from HTTP URL path on Mac)
    if path.startswith("/Users/") or path.startswith("/home/") or path.startswith("/var/"):
        return path if os.path.isfile(path) else None
    if "Application Support" in path or ("Library" in path and "images" in path):
        return path if os.path.isfile(path) else None
    # Handle /static/
    if path.startswith("/static/"):
        relative = path[len("/static/"):]
        actual = os.path.join("static", relative)
        return actual if os.path.isfile(actual) else None
    # Absolute path as-is
    if os.path.isabs(path):
        return path if os.path.isfile(path) else None
    # Relative to images directory
    actual = os.path.join(get_images_directory(), path)
    return actual if os.path.isfile(actual) else None


def resolve_image_path_to_filesystem(path_or_url: str) -> Optional[str]:
    return resolve_app_path_to_filesystem(path_or_url)


def get_images_directory():
    images_directory = os.path.join(get_app_data_directory_env(), "images")
    os.makedirs(images_directory, exist_ok=True)
    return images_directory


def get_exports_directory():
    export_directory = os.path.join(get_app_data_directory_env(), "exports")
    os.makedirs(export_directory, exist_ok=True)
    return export_directory

def get_uploads_directory():
    uploads_directory = os.path.join(get_app_data_directory_env(), "uploads")
    os.makedirs(uploads_directory, exist_ok=True)
    return uploads_directory
