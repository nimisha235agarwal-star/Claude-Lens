"""Load Claude Lens root ``.env`` (``GROQ_API_KEY``, etc.)."""

from __future__ import annotations

import os
from pathlib import Path
from typing import Optional


def project_root() -> Path:
    """Claude Lens monorepo root (``Claude Lens/`` with ``.env``)."""
    # phase 3/src/claude_lens/env.py -> parents[3]
    candidate = Path(__file__).resolve().parents[3]
    if (candidate / "phase 1").is_dir():
        return candidate
    cwd = Path.cwd()
    if (cwd / "phase 1").is_dir():
        return cwd
    return candidate


def load_project_dotenv(root: Optional[Path] = None) -> Path:
    from dotenv import load_dotenv

    pr = root or project_root()
    env_file = pr / ".env"
    if env_file.is_file():
        load_dotenv(env_file, override=False)
    return pr


def env_flag(name: str, default: bool = False) -> bool:
    v = (os.environ.get(name) or "").strip().lower()
    if not v:
        return default
    return v in ("1", "true", "yes", "on")


def groq_configured() -> bool:
    return bool((os.environ.get("GROQ_API_KEY") or "").strip())
