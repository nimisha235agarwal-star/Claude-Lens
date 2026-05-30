# Claude Lens — Product Requirements Document (PRD)
**For use with Cursor AI**
Version 1.1 | May 2026

---

## 1. Project Overview

**Product Name:** Claude Lens
**Type:** Responsive desktop web application
**Purpose:** Help users evaluate and trust AI-generated outputs in high-stakes workflows — without replacing human judgment.

**Design Philosophy:**
- Thoughtful, calm, minimal, research-oriented
- Claude-style aesthetic: soft orange accents, neutral backgrounds, rounded cards, subtle shadows, elegant typography
- Feels like *"a thoughtful AI thinking partner that helps users inspect answers before acting on them"*

**Tech Stack (recommended):**
- React (Vite or Next.js)
- Tailwind CSS
- Framer Motion (for lightweight animations)
- Anthropic Claude API (`claude-sonnet-4-20250514`)

**Canonical training corpus:** `answers.md` — the single source of truth for copy, chip labels, screen flows, challenge/accordion structure, and acceptance tests. All model behavior, demo mode, and regression fixtures must align with this document.

---

## 1.5 Ground Truth & Model Training (`answers.md`)

`answers.md` is the **MBA Decision 2027 — Full User Journey** corpus. It is used to train and validate Claude Lens in four ways:

| Mode | Purpose | When used |
|------|---------|-----------|
| **System context injection** | Paste or attach full corpus (or relevant Part) into Claude system prompt | Live API calls when `use_corpus: true` |
| **Structured seed JSON** | Parsed turns, chips, panels as `training/` artifacts | Demo mode, Storybook, offline E2E |
| **Few-shot exemplars** | 1–2 turns per Part in classify/challenge/reasoning prompts | Phase 4 engine calls |
| **Regression goldens** | Expected section titles, chip labels, banner copy | CI contract tests |

### Corpus structure (7 parts → 7 screens)

| Part | Screen | Training artifact |
|------|--------|-------------------|
| 1 | Onboarding & High-Stakes trigger | `training/part01_onboarding.json` |
| 2 | Main chat (+ 3 follow-ups) | `training/part02_main_chat.json` |
| 3 | Challenge panel | `training/part03_challenge.json` |
| 4 | Reasoning accordion (5 sections) | `training/part04_reasoning.json` |
| 5 | High-Stakes responses | `training/part05_high_stakes.json` |
| 6 | Confidence chip explanations | `training/part06_chip_explanations.json` |
| 7 | Extended Q&A (6 topics) | `training/part07_extended_qa.json` |

### Parsing rules (markdown → model-ready)

1. **User/assistant turns:** Lines under `USER ASKS:` / `CLAUDE RESPONDS:` become `{ role, content }`.
2. **Inline chip markers:** Bracket tags in corpus — `[Well-supported]`, `[Inferred]`, `[Speculative]`, `[Multiple interpretations possible]`, `[Requires human judgment]`, `[Limited evidence available]` — are stripped from displayed text and stored as `claim.label` on the preceding sentence.
3. **High-Stakes flags:** `[WEAK EVIDENCE FLAG]`, `[ASSUMPTION FLAG]`, `[REQUIRES HUMAN JUDGMENT]` map to `flags[]` on the message for UI rendering.
4. **Part 6:** Each `SENTENCE` / `CHIP` / `EXPLANATION` triplet becomes a row in `chip_explanations` keyed by normalized sentence hash (fallback lookup when classify API is slow or offline).

### Model quality bar (acceptance)

Live or demo responses for the reference query *"Should I pursue an MBA in 2027?"* must:

- Include **≥6** distinct claims with correct qualitative labels per Part 2.
- Surface **DisclaimerBox** copy aligned with Part 5 when High-Stakes Mode is on.
- Return challenge panel sections matching Part 3 headings and tone.
- Populate all **five** accordion sections per Part 4 when user clicks "View full reasoning".
- Serve Part 6 popover text for the nine reference sentences (exact or paraphrase within 90% semantic match in eval).

### Demo & training flags

| Env / flag | Behavior |
|------------|----------|
| `CLAUDE_LENS_USE_CORPUS=1` | Append `answers.md` (or compressed summary) to system prompt |
| `CLAUDE_LENS_DEMO_MODE=1` | Serve JSON from `training/` without API key |
| `CLAUDE_LENS_EVAL_MODE=1` | Compare API output to goldens; fail CI on structural drift |

---

## 2. Core Design Tokens

**Default theme:** dark (matches `ui sample.png`). Light theme optional via `data-theme="light"`.

```css
/* Dark theme (default — ui sample.png) */
--bg-primary: #1a1614;
--bg-elevated: #252019;
--bg-user-bubble: #2d2824;
--bg-disclaimer: #3d2f24;
--text-primary: #f5f0eb;
--text-secondary: #b8aea4;
--accent-orange: #e8784a;
--chip-well-supported-bg: #1e3d2a;
--chip-well-supported-fg: #6fcf97;
--chip-inferred-bg: #3d3520;
--chip-inferred-fg: #e8c547;
--chip-speculative-bg: #352a3d;
--chip-speculative-fg: #b794f6;
--chip-missing-bg: #2a2a2a;
--chip-missing-fg: #9e9e9e;

/* Typography */
--font-ui: 'Inter', sans-serif;
--font-body: 'Source Serif 4', Georgia, serif;  /* assistant prose */
--font-size-sm: 13px;
--font-size-base: 15px;

/* Spacing */
--radius-card: 16px;
--radius-chip: 999px;
--radius-input: 24px;

/* Light theme (optional) */
--bg-primary-light: #FAF9F7;
--bg-card-light: #FFFFFF;
--accent-orange-light: #E8784A;
--text-primary-light: #1A1A1A;
```

---

## 3. Application Layout

**Mode A — Focus chat (default, `ui sample.png`):**

```
┌─────────────────────────────────────────────────────────┐
│  New │ Title │ tags (career, decision, high-stakes) │ HS toggle │
├─────────────────────────────────────────────────────────┤
│  User bubble (right) · DisclaimerBox · Annotated reply  │
│  MessageActions · ReasoningAccordion                    │
├─────────────────────────────────────────────────────────┤
│  ChatInput · footer: "Claude can be wrong…"             │
└─────────────────────────────────────────────────────────┘
Route: /c/[conversationId]
```

**Mode B — Full app (sidebar + panels):**

```
┌─────────────────────────────────────────────────────────┐
│  Sidebar (260px)  │  Main Chat Area  │  Side Panel      │
│  - Logo           │  - Messages      │  (320px)         │
│  - New Chat       │  - Input bar     │  Insight or      │
│  - Chat History   │                  │  Challenge       │
│  - HS toggle      │                  │                  │
└─────────────────────────────────────────────────────────┘
Route: /
```

---

## 4. Screen-by-Screen Requirements

---

### Screen 1 — Main Claude Chat Interface

**Route:** `/` (default)

#### 4.1.1 Sidebar

- **Logo:** "Claude Lens" with a small lens/eye icon, top-left
- **New Chat button:** `+ New Chat` — creates a new conversation, clears current messages, focuses input
- **High-Stakes Mode toggle:** Displayed prominently in sidebar as a toggle switch with label "High-Stakes Mode" and an info icon (`ℹ️`). Tooltip on hover: *"Enable for career, financial, medical, or research decisions."*
- **Auto-suggest High-Stakes Mode:** When a user starts typing in a new chat, detect keywords (e.g. MBA, investment, diagnosis, cancer, finance, salary, surgery, PhD, legal, lawsuit) and show a non-intrusive banner above the input. **Copy must match `answers.md` Part 1:**
  ```
  This looks like a high-stakes career and financial decision.
  Enable High-Stakes Mode for added scrutiny and verification guidance.
  [Enable]  [Dismiss]
  ```
- On **Enable:** set High-Stakes Mode ON; auto-add tags `career`, `decision`, `high-stakes` when query contains MBA (per reference journey).
- **Chat History panel:** Scrollable list of past conversations with:
  - Truncated first message as title (max 40 chars)
  - Timestamp (e.g. "Today", "Yesterday", "May 24")
  - Click to load that conversation
  - Hover reveals a `🗑️` delete icon per conversation
- **Clear Chat button:** At the bottom of sidebar — "Clear Chat" — clears messages in current view with a confirmation prompt ("Clear this conversation? This cannot be undone.")

#### 4.1.2 Chat Area — Empty State

- Centered prompt with Claude Lens logo
- Subtitle: *"Ask anything. Inspect the reasoning."*
- 3–4 suggested starter prompts as pill buttons, e.g.:
  - "Should I pursue an MBA in 2027?"
  - "Is this a good time to invest in index funds?"
  - "What are the risks of a low-carb diet long-term?"

#### 4.1.3 Chat Area — Active Conversation

**User message bubble:**
- Right-aligned
- Light neutral background
- Clean sans-serif text

**Claude response:**
- Left-aligned; **serif body** (`--font-body`) for research/editorial feel (per `ui sample.png`)
- Each sentence or logical claim is a **hoverable/clickable unit**
- Claims are tagged with **Confidence Chips** (see Screen 5) inline at the end of each sentence
- **Reference content:** Part 2 of `answers.md` defines the golden MBA thread (primary question + 3 follow-ups: ROI, industries, part-time vs full-time). Starter prompt and E2E tests must use this thread first.

**Claim-level interaction:**
- Hovering a sentence highlights it with a soft orange underline
- Clicking opens the **Insight Panel** (right side panel, 320px wide) without disrupting the main layout
- The Insight Panel shows:
  - **Evidence Strength:** e.g. "Moderate — based on survey data and industry reports"
  - **Assumptions Made:** bulleted list of hidden assumptions in the claim
  - **Reasoning Explanation:** 2–3 sentences explaining the logic chain
  - **Supporting Sources:** Clickable hyperlinks to real or plausible sources (open in new tab). Format: `[Source Title](https://url.com)` rendered as real anchor tags

**Bottom of each Claude response:**
- "Challenge this answer" button (see Screen 2)
- "View full reasoning" accordion trigger (see Screen 3)
- A small timestamp and model label: *"Claude Sonnet · Just now"*

---

### Screen 2 — Challenge This Answer

**Trigger:** User clicks "Challenge this answer" below any Claude response

**Behavior:**
- Opens a **right side panel** (or replaces the Insight Panel if already open)
- Panel title: "Challenging this answer…"
- Claude API call is made with a system prompt instructing it to play devil's advocate on the original answer
- Panel streams the response (show typing indicator)

**Content sections in panel:**

| Section | Description |
|---|---|
| **Counterarguments** | 2–3 points that argue against the original claim |
| **Weak Assumptions** | Bullet list of assumptions the original answer relies on |
| **Alternative Viewpoints** | How experts from a different school of thought might respond |
| **Where It May Fail** | Specific conditions under which the recommendation breaks down |

**Design notes:**
- Tone is collaborative, not combative — avoid framing like "Claude was wrong"
- Use a slightly warm amber tint on the panel background to distinguish from Insight Panel
- "Close" button (X) top right of panel
- Scrollable if content is long

---

### Screen 3 — Progressive Transparency (Expandable Reasoning)

**Trigger:** "View full reasoning" link below any Claude response

**Behavior:**
- Expands an accordion below the response (inline, not a separate panel)
- Accordion sections expand/collapse independently

**Accordion sections:**

```
▼ Quick Answer
   One-line summary of the core recommendation.

▶ Key Assumptions
   [Click to expand]

▶ Reasoning Summary
   [Click to expand]

▶ Source Grounding
   [Click to expand]

▶ Alternative Interpretations
   [Click to expand]
```

**Section content:**

| Section | Content |
|---|---|
| Quick Answer | 1–2 sentence TL;DR |
| Key Assumptions | Bulleted list of what Claude assumed to be true |
| Reasoning Summary | Paragraph explaining the step-by-step logic |
| Source Grounding | Clickable links to sources. Mark confidence: `[High confidence]` `[Moderate]` `[Low/estimated]` |
| Alternative Interpretations | 2–3 brief alternative conclusions someone else might draw |

**Design notes:**
- Smooth expand/collapse animation (Framer Motion `AnimatePresence`)
- Chevron icon rotates on expand
- Soft divider lines between sections
- No overwhelming text walls — each section should be max 150 words

---

### Screen 4 — High-Stakes Mode

**Trigger:** Toggle in sidebar OR user clicks "Enable" in the auto-suggest banner

**State:** Global — applies to entire conversation when active

**Visual changes when High-Stakes Mode is ON:**

1. **Sidebar toggle** glows orange and shows label "High-Stakes Mode: ON"
2. **Top banner** appears inside chat area (copy from `answers.md` Part 5):
   ```
   High-Stakes Mode is active. Uncertainty indicators are enhanced. Verify key claims independently before making any decisions.
   ```
   - Soft amber background, not alarming red
   - Can be dismissed per-session but toggle remains on

3. **Confidence chips** become more verbose:
   - "Speculative" → "Speculative — do not act without verification"
   - "Inferred" → "Inferred — based on assumptions, not confirmed data"

4. **Weak evidence is flagged** with a small `⚠️` icon before the sentence

5. **Assumptions are auto-highlighted** in a soft yellow underline within the response text

6. **Verification suggestions** appear at the bottom of each response:
   ```
   Before acting on this:
   • Speak with a [financial advisor / doctor / career coach] depending on domain
   • Cross-reference with [relevant authority or source type]
   • Consider your specific personal context — this is general guidance
   ```

7. **Warning banners (`DisclaimerBox`)** appear when High-Stakes Mode is on. **Canonical copy from `answers.md` Part 5:**
   - *"This recommendation depends heavily on personal financial assumptions and labour market conditions that cannot be verified at this time. Independent verification is strongly advised before making a decision of this magnitude."*
   - Shorter variant for inline callout (ui sample): *"This recommendation depends heavily on assumptions and should be independently verified. High-stakes mode is on… Uncertainty is surfaced more visibly, and verification steps are suggested below."*
   - Styled as brown-tinted shield callout (`--bg-disclaimer`), not red alert

8. **Verification steps** (Part 5 HS main answer) render as bulleted list after assistant message when HS is on — e.g. fee-only financial advisor, five alumni interviews, official employment reports, FT MBA calculator, studentaid.gov loan modeling.

**Applicable domains (auto-detected from query context):**
- Career decisions (MBA, job, salary, promotion)
- Finance (investment, crypto, mortgage, savings)
- Healthcare (symptoms, medication, diagnosis, diet)
- Academic research (citations, methodology, data)
- Legal (contracts, rights, compliance)

---

### Screen 5 — Confidence Spectrum (Inline Chips)

**Location:** Inline, appended to each sentence/claim in the Claude response

**Chip types:**

| Label | Color | Meaning |
|---|---|---|
| Strongly supported | Green tint `#EAF5EA` / text `#2E7D32` | Based on well-established evidence |
| Well-supported | Soft blue `#E8F0FE` / text `#1565C0` | Based on multiple credible sources |
| Inferred | Soft orange `#FDF0EA` / text `#E8784A` | Logical deduction, not directly verified |
| Multiple interpretations possible | Soft purple `#F3E8FD` / text `#6A1B9A` | Experts disagree |
| Limited evidence available | Yellow `#FFF8E1` / text `#F57F17` | Sparse sourcing |
| Requires human judgment | Gray `#F5F5F5` / text `#424242` | Context-dependent, no universal answer |
| Speculative | Purple tint (dark UI) `#352a3d` / `#b794f6` | Low confidence, exploratory |
| Missing context | Grey `#2a2a2a` / `#9e9e9e` | Individual context absent (ui sample) |

**Corpus label mapping (`answers.md` bracket tags → chip):**

| Bracket in corpus | Chip label |
|-------------------|------------|
| `[Well-supported]` | Well-supported |
| `[Strongly supported]` | Strongly supported |
| `[Inferred]` | Inferred |
| `[Speculative]` | Speculative |
| `[Multiple interpretations possible]` | Multiple interpretations possible |
| `[Limited evidence available]` | Limited evidence available |
| `[Requires human judgment]` | Requires human judgment / Missing context |

**Part 6 goldens:** Popover explanations for the nine reference sentences in `answers.md` Part 6 must be available in `training/part06_chip_explanations.json` and used as few-shot examples for the classify endpoint.

**Interaction:**
- Chip is a small pill/badge at end of sentence
- Clicking the chip opens a **popover** (not full panel) with:
  - "Why this rating?" — 2–3 sentence explanation
  - Confidence level indicator (simple bar or label, not a number)
  - Suggestions for how to verify independently

**Design notes:**
- Chips should be visually subtle — 12px font, 4px 10px padding
- Only show 1 chip per sentence (the most relevant)
- Do not stack multiple chips per sentence

---

## 5. Global Features

### 5.1 New Chat
- Button in sidebar: `+ New Chat`
- Clears message history from view
- Resets side panels
- Keeps High-Stakes Mode state (user preference)
- Focuses the input field
- Adds previous conversation to Chat History list

### 5.2 Chat History
- Persisted in `localStorage` (or backend if auth added later)
- Sidebar scrollable list, newest on top
- Each item: truncated title + relative timestamp
- Clicking an item: loads that conversation into main chat area
- Hover on item: shows delete icon
- Delete confirmation: inline "Are you sure? [Delete] [Cancel]"

### 5.3 Clear Chat
- Button at bottom of sidebar
- Clears current conversation from view and from history
- Confirmation modal before action

### 5.4 Input Bar
- Fixed to bottom of chat area
- Placeholder (ui sample): *"Ask Claude something you want to think through carefully…"*
- Footer tagline: *"Claude can be wrong. The point isn't to trust it — it's to think with it."*
- Auto-grows vertically (up to 5 lines)
- Send on Enter (Shift+Enter for newline)
- Send button (arrow icon), disabled when empty
- Keyword detection triggers High-Stakes Mode suggestion banner (debounced, 800ms after user stops typing)

### 5.5 All Links Are Clickable
- Every source link rendered in responses, Insight Panel, and Reasoning Accordion must be a real `<a href="..." target="_blank" rel="noopener noreferrer">` anchor tag
- Sources should be formatted as: `Source Title — domain.com`
- If Claude API returns markdown links, parse and render them as HTML anchors

### 5.6 Streaming Responses
- Use streaming API (`stream: true`) for all Claude responses
- Show animated typing cursor during streaming
- Confidence chips and claim tagging applied after full response is received (post-processing step)

---

## 6. API Integration

### 6.0 Corpus injection (training context)

When `use_corpus: true` (default in dev/demo), the API prepends a compressed digest of `answers.md` or loads the relevant Part JSON for the detected screen:

```javascript
// System prompt structure
[
  { type: "text", text: BASE_CLAUDE_LENS_PERSONA },
  { type: "text", text: CORPUS_DIGEST },  // from answers.md or training/*.json
  { type: "text", text: highStakesAppendix },  // Part 5 rules if HS on
]
```

**Corpus digest rules:** Include Part matching current action (chat → Part 2+7 snippets; challenge → Part 3; reasoning → Part 4; classify → Part 6). Cap at ~6k tokens; prefer JSON extracts over raw markdown in production.

### 6.1 Main Chat

```javascript
// POST /api/v1/chat/stream
{
  model: "claude-sonnet-4-20250514",
  max_tokens: 1000,
  use_corpus: true,
  corpus_parts: ["part02", "part07"],  // optional filter
  system: `You are Claude Lens, a thoughtful AI designed to help users 
           inspect and evaluate AI-generated answers before acting on them. 
           When answering, break your response into clear, distinct claims—one 
           idea per sentence. Match the tone and depth of the reference MBA 
           journey in the provided training corpus. Do NOT output bracket chip 
           tags in prose; chips are added post-hoc. Include real or plausible 
           source links using markdown [Title](URL). Be calm, precise, and 
           research-oriented.`,
  messages: conversationHistory
}
```

### 6.2 Challenge This Answer

```javascript
// Additional system instruction for challenge mode
system: `You are a thoughtful critic reviewing an AI-generated answer. 
         Surface counterarguments, weak assumptions, alternative viewpoints, 
         and conditions where the recommendation may fail. 
         Be collaborative and constructive — not adversarial.`

// User message: "Challenge this answer: [original answer text]"
```

### 6.3 Confidence Chip Assignment (Post-processing)

After the response is received, run a second lightweight API call (or a local heuristic) to tag each sentence with a confidence level. Example prompt:

```javascript
// Quick classification call
{
  model: "claude-sonnet-4-20250514",
  max_tokens: 500,
  system: "You are a confidence classifier. Given a list of sentences from an AI response, classify each as one of: strongly_supported, well_supported, inferred, multiple_interpretations, limited_evidence, requires_human_judgment, speculative. For each, provide explanation text consistent with the chip_explanations few-shots from the training corpus. Return JSON only.",
  messages: [
    { role: "user", content: `Few-shot examples:\n${JSON.stringify(chipExplanationsFewShot)}` },
    { role: "user", content: `Classify these sentences:\n${sentences.join('\n')}` }
  ]
}
```

**Offline fallback:** If classify API fails, lookup `training/part06_chip_explanations.json` by normalized sentence text; else heuristic label from hedge words (*may, might, uncertain* → speculative/inferred).

### 6.4 Insight Panel Content

When a user clicks a sentence, fetch insight detail:

```javascript
// User message: "For this specific claim: '[sentence]' — what is the evidence strength, what assumptions are being made, and what is the reasoning? Also list 2-3 relevant sources as markdown links."
```

---

## 7. Component Breakdown

| Component | Description |
|---|---|
| `Sidebar` | Logo, New Chat, History, Clear Chat, High-Stakes toggle |
| `ChatArea` | Message list, empty state, input bar |
| `MessageBubble` | User or Claude message with claim highlighting |
| `ConfidenceChip` | Inline label chip with click-to-expand popover |
| `InsightPanel` | Right panel for claim-level detail |
| `ChallengePanel` | Right panel for counterarguments |
| `ReasoningAccordion` | Expandable sections below a Claude message |
| `HighStakesBanner` | Top-of-chat-area informational banner |
| `AutoSuggestBanner` | Keyword-triggered prompt above input |
| `ChatHistoryItem` | Single conversation entry in sidebar |
| `SourceLink` | Anchor tag with external icon |
| `TypingIndicator` | Animated dots during streaming |

---

## 8. Behaviors to Avoid

- No red danger alerts or alarming visuals
- No numeric trust scores (e.g. "72% confident") — use qualitative labels only
- No cluttered dashboard views
- No auto-opening multiple panels simultaneously
- No blocking UX that prevents reading the answer while waiting for chip classification
- No generic "AI may be wrong" disclaimers — make them specific and contextual

---

## 9. Accessibility & Performance

- All interactive elements keyboard-navigable
- ARIA labels on all icon-only buttons
- Panels accessible via Escape key to close
- Streaming responses do not re-render entire list (append only)
- Chip classification call fires async — chips appear after a brief delay, not blocking response display
- LocalStorage used for chat history (no backend required for MVP)

---

## 10. File Structure (Suggested)

```
claude-lens-web/
├── src/ ... (components, hooks, lib)
└── ...

claude-lens-api/
├── src/claude_lens/ ...
├── training/                          # Generated from answers.md
│   ├── corpus_digest.txt              # Compressed summary for prompts
│   ├── part01_onboarding.json
│   ├── part02_main_chat.json
│   ├── part03_challenge.json
│   ├── part04_reasoning.json
│   ├── part05_high_stakes.json
│   ├── part06_chip_explanations.json
│   ├── part07_extended_qa.json
│   └── mba_journey.json               # Full threaded conversation
├── scripts/
│   └── ingest_answers.py              # Parse answers.md → training/*
└── tests/
    ├── test_corpus_parsing.py
    └── test_golden_mba_journey.py

src/
├── components/ ...
├── hooks/
│   ├── useClaudeStream.js
│   ├── useChatHistory.js
│   └── useKeywordDetection.js
├── utils/
│   ├── classifyClaims.js
│   ├── parseMarkdownLinks.js
│   └── detectHighStakesDomain.js
├── constants/
│   └── highStakesKeywords.js
└── ...
```

---

## 11. MVP Scope vs. Later

| Feature | MVP | Later |
|---|---|---|
| Main chat with confidence chips | ✅ | |
| Insight panel (click a claim) | ✅ | |
| Challenge this answer | ✅ | |
| Progressive transparency accordion | ✅ | |
| High-Stakes Mode | ✅ | |
| Auto-suggest High-Stakes Mode | ✅ | |
| Chat history (localStorage) | ✅ | |
| New Chat / Clear Chat | ✅ | |
| Streaming responses | ✅ | |
| **`answers.md` → `training/` ingest script** | ✅ | |
| **Corpus injection in API (`use_corpus`)** | ✅ | |
| **Demo mode from training JSON** | ✅ | |
| **Golden tests vs Part 1–7** | ✅ | |
| Focus chat UI (dark, ui sample) | ✅ | |
| User authentication | | ✅ |
| Backend chat persistence | | ✅ |
| Custom domains/personas | | ✅ |
| Export conversation as PDF | | ✅ |
| Fine-tuned custom model weights | | ✅ |

---

## 12. Model Training Pipeline (from `answers.md`)

### 12.1 Ingest script

`scripts/ingest_answers.py` reads `answers.md` and writes `training/*.json`.

**Inputs:** `Claude Lens/answers.md`  
**Outputs:** seven part files + `mba_journey.json` + `corpus_digest.txt`

**Run:** `python scripts/ingest_answers.py --source ../answers.md --out training/`

### 12.2 `mba_journey.json` schema

```json
{
  "version": "1.0",
  "domain": "career",
  "reference_query": "Should I pursue an MBA in 2027?",
  "tags": ["career", "decision", "high-stakes"],
  "turns": [
    {
      "id": "turn-1",
      "user": "Should I pursue an MBA in 2027?",
      "assistant": { "content": "...", "claims": [{ "sentence": "...", "label": "inferred", "explanation": "..." }] }
    }
  ],
  "challenge": { "counterarguments": [], "weak_assumptions": [], "alternative_viewpoints": [], "where_it_may_fail": [] },
  "reasoning": { "quick_answer": "", "key_assumptions": [], "reasoning_summary": "", "source_grounding": [], "alternative_interpretations": [] },
  "high_stakes": { "banner": "", "disclaimer": "", "verification_steps": [] }
}
```

### 12.3 Training modes

| Mode | Description |
|------|-------------|
| **Corpus-guided generation** | Claude API + full/part corpus in system prompt (MVP) |
| **Demo playback** | Return pre-parsed JSON from `training/` (no API) |
| **Eval regression** | Compare live output structure to goldens (section count, labels, copy hashes) |
| **Future: fine-tune** | Export `{ messages }` JSONL from `mba_journey.json` for hosted fine-tuning — out of MVP scope |

### 12.4 Extended Q&A (Part 7)

The following topics must be retrievable via corpus or few-shot and appear in suggested follow-up chips after the main MBA answer:

1. GMAT score for top programs  
2. MBA vs specialised master's  
3. Competitive applicant profile  
4. Best MBA programs for 2027  
5. Application timeline for 2027 intake  
6. MBA scholarships  

### 12.5 CI gates

- `test_corpus_parsing.py` — ingest produces valid JSON for all 7 parts  
- `test_golden_mba_journey.py` — demo mode returns Part 2 first turn with ≥6 claims  
- `test_challenge_sections.py` — Part 3 four sections non-empty  
- `test_reasoning_sections.py` — Part 4 five sections non-empty  
- `test_chip_explanations.py` — Part 6 nine entries resolvable  

---

*End of Requirements Document*