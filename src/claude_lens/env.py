"""Load Claude Lens project-root ``.env`` (``GROQ_API_KEY``, etc.)."""

from __future__ import annotations

from pathlib import Path
from typing import Optional

# Claude Lens/ src/ claude_lens/ env.py -> parents[2] = Claude Lens
_DEFAULT_ROOT = Path(__file__).resolve().parents[2]


def load_project_dotenv(project_root: Optional[Path] = None) -> Path:
    """Load ``<project_root>/.env`` if present. Does not override existing env vars."""
    from dotenv import load_dotenv

    root = project_root or _DEFAULT_ROOT
    env_file = root / ".env"
    if env_file.is_file():
        load_dotenv(env_file, override=False)
    return root
