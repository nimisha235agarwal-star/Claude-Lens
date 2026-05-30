"""Domain detection from user text and tags."""

from __future__ import annotations

from typing import Optional

DOMAIN_KEYWORDS: dict[str, list[str]] = {
    "career": ["mba", "job", "salary", "promotion", "career"],
    "finance": ["invest", "mortgage", "crypto", "finance", "savings"],
    "health": ["symptom", "medication", "diagnosis", "diet", "cancer", "surgery"],
    "legal": ["contract", "lawsuit", "legal", "rights", "compliance"],
    "research": ["citation", "methodology", "peer review", "phd"],
}

DOMAIN_VERIFICATION: dict[str, list[str]] = {
    "career": [
        "Speak with a fee-only financial advisor about ROI and debt.",
        "Interview recent alumni in your target post-MBA role.",
        "Request official employment reports from each program.",
    ],
    "finance": [
        "Consult a fee-only financial advisor.",
        "Cross-check with SEC and consumer finance guidance.",
    ],
    "health": [
        "Consult a licensed clinician — do not rely on general AI guidance alone.",
    ],
    "legal": [
        "Consult a licensed attorney in your jurisdiction.",
    ],
    "research": [
        "Verify claims against primary sources and peer-reviewed literature.",
    ],
}


def detect_domain(text: str, tags: Optional[list[str]] = None) -> Optional[str]:
    lower = text.lower()
    tags = tags or []
    tag_str = " ".join(tags).lower()
    scores: dict[str, int] = {d: 0 for d in DOMAIN_KEYWORDS}
    for domain, words in DOMAIN_KEYWORDS.items():
        for w in words:
            if w in lower or w in tag_str:
                scores[domain] += 1
    best = max(scores.items(), key=lambda x: x[1])
    return best[0] if best[1] > 0 else None
