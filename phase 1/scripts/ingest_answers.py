#!/usr/bin/env python3
"""Parse Claude Lens/answers.md into training/*.json artifacts."""

from __future__ import annotations

import argparse
import hashlib
import json
import re
import sys
from pathlib import Path
from typing import Any

# Bracket tags at end of sentences in corpus
CHIP_PATTERN = re.compile(
    r"\s*\[(Well-supported|Strongly supported|Inferred|Speculative|"
    r"Multiple interpretations possible|Requires human judgment|"
    r"Limited evidence available|WEAK EVIDENCE FLAG|ASSUMPTION FLAG|"
    r"REQUIRES HUMAN JUDGMENT|High confidence|Moderate confidence[^\]]*)\]\s*",
    re.IGNORECASE,
)

LABEL_MAP = {
    "well-supported": "well_supported",
    "strongly supported": "strongly_supported",
    "inferred": "inferred",
    "speculative": "speculative",
    "multiple interpretations possible": "multiple_interpretations",
    "requires human judgment": "requires_human_judgment",
    "limited evidence available": "limited_evidence",
    "weak evidence flag": "weak_evidence",
    "assumption flag": "assumption",
    "requires human judgment": "requires_human_judgment",
}

PART_HEADER = re.compile(
    r"^PART\s+(\d+)\s+—\s+(.+)$",
    re.MULTILINE,
)


def normalize_label(raw: str) -> str:
    key = raw.strip().lower()
    if key.startswith("moderate confidence"):
        return "moderate_confidence"
    if key.startswith("high confidence"):
        return "high_confidence"
    return LABEL_MAP.get(key, key.replace(" ", "_"))


def split_sentences_with_chips(text: str) -> tuple[str, list[dict[str, Any]]]:
    """Strip inline chip brackets; return clean text and claim list."""
    claims: list[dict[str, Any]] = []
    parts: list[str] = []
    last = 0
    for m in CHIP_PATTERN.finditer(text):
        segment = text[last : m.start()].strip()
        if segment:
            parts.append(segment)
            label = normalize_label(m.group(1))
            claims.append(
                {
                    "sentence": segment,
                    "label": label,
                    "explanation": "",
                }
            )
        last = m.end()
    tail = text[last:].strip()
    if tail:
        parts.append(tail)
    clean = " ".join(parts)
    clean = re.sub(r"\s+", " ", clean).strip()
    return clean, claims


def extract_flags(text: str) -> list[str]:
    flags: list[str] = []
    for m in CHIP_PATTERN.finditer(text):
        lab = normalize_label(m.group(1))
        if lab in ("weak_evidence", "assumption"):
            flags.append(lab)
    return flags


def parse_parts(content: str) -> dict[int, str]:
    sections: dict[int, str] = {}
    matches = list(PART_HEADER.finditer(content))
    for i, m in enumerate(matches):
        part_num = int(m.group(1))
        start = m.end()
        end = matches[i + 1].start() if i + 1 < len(matches) else len(content)
        sections[part_num] = content[start:end].strip()
    return sections


def parse_part01(text: str) -> dict[str, Any]:
    banner_match = re.search(
        r"BANNER:\s*(.+?)\nEnable High-Stakes Mode",
        text,
        re.DOTALL,
    )
    banner_line1 = (
        banner_match.group(1).strip()
        if banner_match
        else "This looks like a high-stakes career and financial decision."
    )
    return {
        "version": "1.0",
        "trigger_keywords": ["mba"],
        "banner": {
            "line1": banner_line1,
            "line2": "Enable High-Stakes Mode for added scrutiny and verification guidance.",
            "actions": ["enable", "dismiss"],
        },
        "on_enable": {
            "high_stakes_mode": True,
            "tags": ["career", "decision", "high-stakes"],
        },
    }


def parse_turn_block(block: str) -> dict[str, Any] | None:
    user_m = re.search(r"USER ASKS:\s*\n(.+?)(?=\n\nCLAUDE|\Z)", block, re.DOTALL)
    asst_m = re.search(
        r"CLAUDE RESPONDS:\s*\n\n(.+?)(?=\n\n---|\n\nFOLLOW-UP|\Z)",
        block,
        re.DOTALL,
    )
    if not user_m:
        return None
    user = user_m.group(1).strip()
    assistant: dict[str, Any] = {"content": "", "claims": [], "flags": []}
    if asst_m:
        raw = asst_m.group(1).strip()
        assistant["flags"] = extract_flags(raw)
        content, claims = split_sentences_with_chips(raw)
        assistant["content"] = content
        assistant["claims"] = claims
    return {"user": user, "assistant": assistant}


def parse_part02(text: str) -> dict[str, Any]:
    turns: list[dict[str, Any]] = []
    # Primary block before first FOLLOW-UP
    primary = re.split(r"FOLLOW-UP QUESTION \d+:", text, maxsplit=1)[0]
    turn = parse_turn_block(primary)
    if turn:
        turns.append(turn)

    for m in re.finditer(
        r"FOLLOW-UP QUESTION \d+:\s*\n(.+?)\n\nCLAUDE RESPONDS:\s*\n\n(.+?)(?=\n\n---|\n\n━|\Z)",
        text,
        re.DOTALL,
    ):
        user = m.group(1).strip()
        raw = m.group(2).strip()
        content, claims = split_sentences_with_chips(raw)
        turns.append(
            {
                "user": user,
                "assistant": {
                    "content": content,
                    "claims": claims,
                    "flags": extract_flags(raw),
                },
            }
        )

    follow_ups = [t["user"] for t in turns[1:]] if len(turns) > 1 else []
    return {
        "version": "1.0",
        "reference_query": turns[0]["user"] if turns else "",
        "turns": turns,
        "follow_ups": follow_ups,
    }


def parse_bullet_section(text: str, header: str) -> list[str]:
    pattern = rf"{re.escape(header)}\s*\n\n(.+?)(?=\n\n[A-Z]|\Z)"
    m = re.search(pattern, text, re.DOTALL)
    if not m:
        return []
    body = m.group(1).strip()
    # Paragraphs separated by double newlines
    items = [p.strip() for p in re.split(r"\n\n+", body) if p.strip()]
    return items


def parse_part03(text: str) -> dict[str, Any]:
    main = text.split("FOLLOW-UP CHALLENGE")[0]
    challenge = {
        "counterarguments": parse_bullet_section(main, "COUNTERARGUMENTS"),
        "weak_assumptions": [],
        "alternative_viewpoints": parse_bullet_section(main, "ALTERNATIVE VIEWPOINTS"),
        "where_it_may_fail": parse_bullet_section(main, "WHERE THE RECOMMENDATION MAY FAIL"),
    }
    weak_m = re.search(
        r"WEAK ASSUMPTIONS IN THE ORIGINAL ANSWER\s*\n\n(.+?)(?=\n\nALTERNATIVE)",
        main,
        re.DOTALL,
    )
    if weak_m:
        challenge["weak_assumptions"] = [weak_m.group(1).strip()]

    follow_up: dict[str, Any] | None = None
    fu_m = re.search(
        r"FOLLOW-UP CHALLENGE QUESTION:\s*\n(.+?)\n\nCLAUDE CHALLENGES:\s*\n\n(.+)",
        text,
        re.DOTALL,
    )
    if fu_m:
        follow_up = {
            "question": fu_m.group(1).strip(),
            "response": fu_m.group(2).strip(),
        }

    return {"version": "1.0", "challenge": challenge, "follow_up": follow_up}


def parse_part04(text: str) -> dict[str, Any]:
    sections = {
        1: "quick_answer",
        2: "key_assumptions",
        3: "reasoning_summary",
        4: "source_grounding",
        5: "alternative_interpretations",
    }
    reasoning: dict[str, Any] = {
        "quick_answer": "",
        "key_assumptions": [],
        "reasoning_summary": "",
        "source_grounding": [],
        "alternative_interpretations": [],
    }
    for num, key in sections.items():
        m = re.search(
            rf"SECTION {num}\s+—\s+[^\n]+\n\n(.+?)(?=\n\nSECTION \d|\Z)",
            text,
            re.DOTALL,
        )
        if not m:
            continue
        body = m.group(1).strip()
        if num == 1:
            reasoning["quick_answer"] = body
        elif num == 3:
            reasoning["reasoning_summary"] = body
        elif num == 2:
            reasoning["key_assumptions"] = [body]
        elif num == 5:
            reasoning["alternative_interpretations"] = [
                p.strip() for p in re.split(r"\n\n+", body) if p.strip()
            ]
        elif num == 4:
            sources = []
            for line in body.split("\n"):
                line = line.strip()
                if not line:
                    continue
                conf = "moderate"
                if "[High confidence]" in line:
                    conf = "high"
                elif "[Moderate confidence" in line:
                    conf = "moderate"
                title = re.sub(r"\s*\[(High|Moderate) confidence[^\]]*\]", "", line).strip()
                url_m = re.search(r"Available at\s+(\S+)|at\s+([a-z0-9./-]+\.[a-z]+)", line, re.I)
                url = url_m.group(1) or (url_m.group(2) if url_m else "") or ""
                if url and not url.startswith("http"):
                    url = f"https://{url}"
                sources.append({"title": title, "url": url, "confidence": conf})
            reasoning["source_grounding"] = sources

    return {"version": "1.0", "reasoning": reasoning}


def parse_part05(text: str) -> dict[str, Any]:
    banner_m = re.search(
        r"TOP BANNER[^\n]*\n(.+?)\n\n---",
        text,
        re.DOTALL,
    )
    banner = (
        banner_m.group(1).strip()
        if banner_m
        else "High-Stakes Mode is active. Uncertainty indicators are enhanced."
    )

    hs_main_m = re.search(
        r"HIGH-STAKES VERSION OF MAIN ANSWER:\s*\n\n(.+?)\n\n---",
        text,
        re.DOTALL,
    )
    hs_content = ""
    verification_steps: list[str] = []
    disclaimer = ""

    if hs_main_m:
        block = hs_main_m.group(1).strip()
        warn_m = re.search(r"WARNING BANNER:\s*(.+)$", block, re.DOTALL)
        if warn_m:
            disclaimer = warn_m.group(1).strip()
            block = block[: warn_m.start()].strip()

        ver_m = re.search(
            r"Before acting on this recommendation, consider the following verification steps\.\s*\n\n(.+?)(?=\n\nWARNING|\Z)",
            block,
            re.DOTALL,
        )
        if ver_m:
            steps_text = ver_m.group(1).strip()
            verification_steps = [
                s.strip()
                for s in re.split(
                    r"(?<=[.!?])\s+(?=[A-Z])",
                    steps_text,
                )
                if s.strip()
            ]
            block = block[: ver_m.start()].strip()

        hs_content, claims = split_sentences_with_chips(block)
    else:
        claims = []

    return {
        "version": "1.0",
        "banner": banner,
        "disclaimer": disclaimer,
        "high_stakes_main": {
            "content": hs_content,
            "claims": claims,
            "flags": extract_flags(hs_main_m.group(1) if hs_main_m else ""),
            "verification_steps": verification_steps,
        },
    }


def parse_part06(text: str) -> dict[str, Any]:
    entries: list[dict[str, Any]] = []
    for m in re.finditer(
        r"SENTENCE:\s*(.+?)\nCHIP:\s*(.+?)\nEXPLANATION:\s*(.+?)(?=\n\nSENTENCE:|\Z)",
        text,
        re.DOTALL,
    ):
        sentence = m.group(1).strip()
        chip = normalize_label(m.group(2).strip())
        explanation = m.group(3).strip()
        norm = re.sub(r"\s+", " ", sentence.lower())
        entry_id = hashlib.sha256(norm.encode()).hexdigest()[:16]
        entries.append(
            {
                "id": entry_id,
                "sentence": sentence,
                "label": chip,
                "explanation": explanation,
            }
        )
    return {"version": "1.0", "chip_explanations": entries}


def parse_part07(text: str) -> dict[str, Any]:
    items: list[dict[str, Any]] = []
    for m in re.finditer(
        r"Q:\s*(.+?)\n\nA:\s*(.+?)(?=\n\n---|\n\n━|\Z)",
        text,
        re.DOTALL,
    ):
        question = m.group(1).strip()
        raw_answer = m.group(2).strip()
        sources_m = re.search(r"\n\nSources:\s*(.+)$", raw_answer, re.DOTALL)
        sources_text = sources_m.group(1).strip() if sources_m else ""
        answer_body = raw_answer[: sources_m.start()].strip() if sources_m else raw_answer
        content, claims = split_sentences_with_chips(answer_body)
        items.append(
            {
                "question": question,
                "assistant": {
                    "content": content,
                    "claims": claims,
                    "sources_note": sources_text,
                },
            }
        )
    return {"version": "1.0", "extended_qa": items}


def build_mba_journey(
    p01: dict[str, Any],
    p02: dict[str, Any],
    p03: dict[str, Any],
    p04: dict[str, Any],
    p05: dict[str, Any],
) -> dict[str, Any]:
    return {
        "version": "1.0",
        "domain": "career",
        "reference_query": p02.get("reference_query", ""),
        "tags": p01.get("on_enable", {}).get("tags", []),
        "turns": p02.get("turns", []),
        "follow_ups": p02.get("follow_ups", []),
        "challenge": p03.get("challenge", {}),
        "challenge_follow_up": p03.get("follow_up"),
        "reasoning": p04.get("reasoning", {}),
        "high_stakes": {
            "banner": p05.get("banner", ""),
            "disclaimer": p05.get("disclaimer", ""),
            "verification_steps": p05.get("high_stakes_main", {}).get(
                "verification_steps", []
            ),
            "main": p05.get("high_stakes_main", {}),
        },
        "onboarding": p01,
    }


def build_corpus_digest(parts: dict[int, str], artifacts: dict[str, Any]) -> str:
    lines = [
        "CLAUDE LENS TRAINING CORPUS DIGEST",
        "MBA Decision 2027 — compressed reference for system prompts.",
        "",
        f"Reference query: {artifacts.get('part02', {}).get('reference_query', '')}",
        f"Turns: {len(artifacts.get('part02', {}).get('turns', []))}",
        f"Chip explanations: {len(artifacts.get('part06', {}).get('chip_explanations', []))}",
        f"Extended Q&A: {len(artifacts.get('part07', {}).get('extended_qa', []))}",
        "",
    ]
    for n in sorted(parts.keys()):
        preview = parts[n][:500].replace("\n", " ")
        lines.append(f"--- Part {n} (preview) ---")
        lines.append(preview + ("…" if len(parts[n]) > 500 else ""))
        lines.append("")
    return "\n".join(lines)


def write_json(path: Path, data: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


def ingest(source: Path, out_dir: Path) -> None:
    content = source.read_text(encoding="utf-8")
    parts = parse_parts(content)

    p01 = parse_part01(parts.get(1, ""))
    p02 = parse_part02(parts.get(2, ""))
    p03 = parse_part03(parts.get(3, ""))
    p04 = parse_part04(parts.get(4, ""))
    p05 = parse_part05(parts.get(5, ""))
    p06 = parse_part06(parts.get(6, ""))
    p07 = parse_part07(parts.get(7, ""))
    journey = build_mba_journey(p01, p02, p03, p04, p05)

    artifacts = {
        "part01": p01,
        "part02": p02,
        "part03": p03,
        "part04": p04,
        "part05": p05,
        "part06": p06,
        "part07": p07,
    }
    digest = build_corpus_digest(parts, artifacts)

    write_json(out_dir / "part01_onboarding.json", p01)
    write_json(out_dir / "part02_main_chat.json", p02)
    write_json(out_dir / "part03_challenge.json", p03)
    write_json(out_dir / "part04_reasoning.json", p04)
    write_json(out_dir / "part05_high_stakes.json", p05)
    write_json(out_dir / "part06_chip_explanations.json", p06)
    write_json(out_dir / "part07_extended_qa.json", p07)
    write_json(out_dir / "mba_journey.json", journey)
    (out_dir / "corpus_digest.txt").write_text(digest, encoding="utf-8")

    # Merge Part 6 explanations into Part 2 / journey claim rows
    chip_entries = p06.get("chip_explanations", [])

    def _norm_sentence(s: str) -> str:
        return " ".join(s.lower().split())

    def _enrich_claims(claims: list[dict[str, Any]]) -> None:
        for c in claims:
            if c.get("explanation"):
                continue
            norm = _norm_sentence(c["sentence"])
            for e in chip_entries:
                e_norm = _norm_sentence(e["sentence"])
                if (
                    norm == e_norm
                    or norm.startswith(e_norm)
                    or e_norm.startswith(norm)
                    or e_norm.rstrip(".") in norm
                ):
                    c["explanation"] = e["explanation"]
                    break

    for turn in p02.get("turns", []):
        _enrich_claims(turn.get("assistant", {}).get("claims", []))
    for turn in journey.get("turns", []):
        _enrich_claims(turn.get("assistant", {}).get("claims", []))

    write_json(out_dir / "part02_main_chat.json", p02)
    write_json(out_dir / "mba_journey.json", journey)

    print(f"Ingested {source} -> {out_dir}")
    print(f"  part02 turns: {len(p02.get('turns', []))}")
    print(f"  part06 chips: {len(p06.get('chip_explanations', []))}")
    print(f"  part07 Q&A:   {len(p07.get('extended_qa', []))}")


def main() -> int:
    default_root = Path(__file__).resolve().parents[2]
    parser = argparse.ArgumentParser(description="Ingest answers.md into training JSON")
    parser.add_argument(
        "--source",
        type=Path,
        default=default_root / "answers.md",
        help="Path to answers.md",
    )
    parser.add_argument(
        "--out",
        type=Path,
        default=Path(__file__).resolve().parents[1] / "training",
        help="Output directory for training artifacts",
    )
    args = parser.parse_args()
    if not args.source.is_file():
        print(f"Error: source not found: {args.source}", file=sys.stderr)
        return 1
    ingest(args.source, args.out)
    return 0


if __name__ == "__main__":
    sys.exit(main())
