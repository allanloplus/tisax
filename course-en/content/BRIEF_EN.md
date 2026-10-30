# English edition — translation brief

You are producing the **English edition** of the course "ISA 2027 for TISAX 標準要求解說" →
English title: **"ISA 2027 for TISAX — Requirements Explained"**.

Audience: employees of automotive suppliers in non-Chinese-speaking countries (Europe, Americas, India, SE Asia…),
typically information security, IT, quality, R&D, facilities, HR staff preparing for TISAX. Many are not native
English speakers: write **clear, plain international English** (short sentences, no idioms that only work
in US/UK, no slang). Use British/American spelling consistently (American).

## Sources
- Chinese source file (translate this, keep the SAME structure and ids): `/home/user/tisax/course/content/<key>.json`
- Original ISA 2027.1 English text, all controls: `/tmp/claude-0/-home-user-tisax/99c53a4c-3bdc-5716-bfd2-00a1e5eb5cd5/scratchpad/isa/full.txt`
  (also `isa.json` and the other `.txt` sheets in that folder).
- **Never modify anything under `/home/user/tisax/course/`.** Write only your output file.

## Output
`/home/user/tisax/course-en/content/<key>.json` — valid JSON (ensure_ascii=False, indent=1), **identical schema and ids**
to the Chinese file (same chapter ids, same control ids, same video segment ids and chapter links). Only the text changes.
Build it with a Python script in `/tmp/claude-0/-home-user-tisax/99c53a4c-3bdc-5716-bfd2-00a1e5eb5cd5/scratchpad/en/gen_<key>.py`
and validate it loads.

## How to translate each field
- `title`, `title_en` (keep `title_en` = the English chapter name; `title` = English chapter title such as
  "Chapter 1 — IS Policies and Organization"), `intro`, `blocks`, `summary`: translate.
- Controls:
  - `title`: short English control name.
  - `q_en`: keep as is (original ISA wording). `q_zh`: put the same original English question here too.
  - `objective`: use the **original ISA objective text** from full.txt (lightly cleaned), not a back-translation.
  - `req.must / should / high / vhigh / sga`: use the **original ISA requirement wording** from full.txt, one item per
    "+" bullet, sub-points joined with " – " or kept as separate items; keep the (C, I, A) markers. Must be complete.
  - `refs`: keep (translate any Chinese words).
  - `change2027`, `explain`, `practice`, `audit.questions/evidence/findings`, `tip`: translate the Chinese meaning
    faithfully and naturally.
- **Localization**: the Chinese edition sometimes refers to Taiwan (Taiwanese laws such as 個人資料保護法 PDPA,
  營業秘密法, 資通安全管理法; "Taiwanese auto-parts factory", LINE groups, NT$ amounts, etc.). For an international
  audience: keep the point but generalize — e.g. "your national data-protection law (for example the EU GDPR,
  or Taiwan's PDPA)", "a Tier-2 auto-parts plant", "a chat group (e.g. WhatsApp, LINE, Teams)". Comparison tables that
  are only about Taiwan law: turn them into a generic "Local law vs. GDPR" comparison with Taiwan as one example.
  Keep the same number of blocks.
- Inline `**bold**` markers are allowed (keep them where the Chinese has them).

## Video dialogue (`video[].lines`)
- Keep every segment (same `id`, `chapter`); translate `title`.
- Translate each line into **natural spoken English** for a lively classroom dialogue between
  **Allan** (lecturer: friendly, experienced consultant and auditor, uses real-world cases, a bit of humor) and
  **ARALE** (young, cheerful assistant who asks the learners' questions and sums up). Keep `who` and `emo`.
  You may keep the same number of lines (preferred) — do not drop content.
- Each spoken line ≤ 220 characters, no emoji, no brackets, no slashes "/", no "～". Write numbers the way they should be
  spoken where it matters ("ISA 2027" ok, control ids like "5.2.9" ok, "72 hours" ok).
  Spell names consistently: Allan, ARALE, TISAX, ISA, ENX, VDA.
- `slide`: translate title and bullets (bullets ≤ 60 characters each, 2–5 bullets); tables: translate cells.

## Glossary (use consistently)
資訊安全 Information Security · 原型件保護 Prototype Protection · 資料保護 Data Protection · 保護需求 protection needs ·
高／極高 high / very high · 支援資產 supporting assets · 安全區域 security zone · 成熟度等級 maturity level ·
控制項 control · 必須 must · 應該 should · 稽核員 auditor · 評鑑 assessment · 標籤 label · 矯正措施計畫 corrective action plan (CAP) ·
不符合 non-conformity · 觀察事項 observation · 承攬商 contractor · 保密協議 non-disclosure agreement (NDA) ·
處理者／控制者 processor / controller · 資料保護長 data protection officer (DPO) · 營運持續 business continuity.

Do not mention that the text is AI-generated or translated. Reply with a short summary (counts).
