"""Split assistant prose into sentences for classification."""

from __future__ import annotations

import re

_ABBREV = re.compile(r"\b(?:Mr|Mrs|Ms|Dr|Prof|vs|etc|e\.g|i\.e)\.\s", re.I)
_SENTENCE_END = re.compile(r"(?<=[.!?])\s+")


def split_sentences(text: str) -> list[str]:
    t = text.strip()
    if not t:
        return []
    protected = _ABBREV.sub(lambda m: m.group(0).replace(". ", "<DOT> "), t)
    parts = _SENTENCE_END.split(protected)
    out: list[str] = []
    for p in parts:
        s = p.replace("<DOT> ", ". ").strip()
        if len(s) > 10:
            out.append(s)
    return out if out else [t]
