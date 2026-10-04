<div align="center">

# 🧬 pageCLoner

### SEO Reference Cloner — Structure-Preserving Content Replacement

**Analyze a reference page. Understand its structure. Generate new content. Replace only what needs replacing.**

[![Next.js](https://img.shields.io/badge/Next.js-14-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Tests](https://img.shields.io/badge/tests-14%20passing-22c55e?style=for-the-badge&logo=githubactions&logoColor=white)](#-testing)

</div>

---

## 📖 What is this?

`pageCLoner` is **NOT** a website generator. It is an **HTML cloner / content replacer**.

You give it a reference page (URL or raw HTML), a new brand, and a new title. It then:

- 🔍 Reverse-engineers the reference page structure & SEO content
- 🧠 Generates brand-new, relevant SEO content (by AI **or** a deterministic engine)
- 🔗 Detects every replaceable asset/link/text and groups duplicates
- 🩹 Swaps **only** the replaceable parts into the *original* HTML
- ✅ Validates that DOM, CSS, JS, layout & behavior are preserved **100%**

> The reference HTML is the **source of truth** for structure. AI only changes what is explicitly replaceable.

---

## ✨ Key Features

| Feature | Description |
| --- | --- |
| 🏗️ **Structure-Preserving** | DOM hierarchy, class, ID, CSS, JS, animation & responsive behavior stay untouched |
| 🌐 **Dual Extraction** | Raw HTML fetch (View Source) + manual HTML paste fallback |
| 🔎 **Universal FAQ Parser** | Detects `.faq-box`, `.faq-card`, `<details>`, `<strong>` questions, and star-rated reviews |
| 🎯 **Content Slot System** | Each replaceable element stamped with a DOM target — no blind string matching |
| 🛡️ **Strict AI Structure Analysis** | AI only *classifies* content vs locked (classification-only); code always transforms HTML |
| 🪞 **Title Mirror Sync** | Replaces *every* repetition of the old title (title, H1, H2, banners, loose text nodes) |
| 🗺️ **Smart Asset & Link Mapping** | Auto-groups identical URLs, counts occurrences, single mapping per URL |
| 🎲 **Random Indonesian Reviewers** | Every generation yields unique UPPERCASE names (`RIZKY PRATAMA — BANDUNG`) |
| 🎨 **Page Recolor** | Detects dominant colors; remap any color page-wide via color picker |
| 🖥️ **Interactive Side-by-Side Diff** | Compare original vs clone, filter by element type, dual live preview (S/M/L/XL + fullscreen) |
| 🤖 **Bring Your Own AI** | OpenRouter, OpenAI, Groq, DeepSeek, or local Ollama — or run fully offline |
| 📦 **Flexible Export** | Download `index.html` only, or full `.zip` with `replacement-map.json` |
| 🛡️ **Integrity Guardrails** | Never invents metadata, never adds sections, never touches scripts |

---

## 🖼️ Workflow

```
USER ─ Reference URL + Brand + Title
  │
  ▼
FETCHER ────── Raw HTML  /  Manual paste
  │
  ▼
PARSER ─────── DOM tree · Metadata · Assets · Links · Content Slots
  │
  ▼
ANALYZER ───── SEO analysis · Structure analysis · Keywords · Blueprint
  │
  ▼
CONTENT ENGINE ── Meta · Headings · Article · FAQ · Reviews
  │
  ▼
MAPPING ENGINE ── Content · Asset · Link mapping
  │
  ▼
USER REVIEW ──── New image/logo/favicon/link URLs
  │
  ▼
REPLACEMENT ENGINE ── safeSetText + slot stamps
  │
  ▼
VALIDATOR ───── Structural similarity check (target: 100%)
  │
  ▼
EXPORT ──────── index.html  +  replacement-map.json
```

The UI walks you through **6 steps**:

1. **Input** — reference, brand, title, AI settings
2. **Analysis** — metadata, structure, keywords, blueprint
3. **Content** — generated meta/article/FAQ/reviews + custom instructions
4. **Assets** — group & map visual assets (filterable)
5. **Links** — group & map links/CTAs (filterable)
6. **Final** — side-by-side diff, live preview, validation, export

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** ≥ 18
- npm (or pnpm / yarn)

### Install & Run

```bash
# install dependencies
npm install

# start dev server
npm run dev
```

Open 👉 **http://localhost:3000**

**Windows shortcut:** double-click `start.bat` — it launches the server and opens the browser automatically.

### Production Build

```bash
npm run build
npm run start
```

---

## 🤖 AI Configuration

`pageCLoner` uses a **hybrid content engine**:

- **Deterministic Engine** (default, no API key) — 100% compliant with element counts & word-count tolerance (±5%). Zero cost.
- **LLM Engine** (optional) — richer copywriting variety via any OpenAI-compatible API.

### Configure via UI

Click **"Pengaturan AI"** in the header → pick a provider → paste your API key → **Test Connection**.

| Provider | Base URL | Default Model |
| --- | --- | --- |
| **OpenRouter** | `https://openrouter.ai/api/v1` | `openai/gpt-4o-mini` |
| **OpenAI** | `https://api.openai.com/v1` | `gpt-4o-mini` |
| **Groq Cloud** | `https://api.groq.com/openai/v1` | `llama-3.3-70b-versatile` |
| **DeepSeek** | `https://api.deepseek.com/v1` | `deepseek-chat` |
| **Ollama (Local)** | `http://localhost:11434/v1` | `llama3` |

Settings are saved to `localStorage` — no re-entry needed.

### 📝 Master Prompt (`INSTRUCTION.md`)

All content-generation rules live in **`INSTRUCTION.md`** at the repo root. It is automatically injected as the **system prompt** for the LLM.

You can view & edit it directly from the UI — click the **`INSTRUCTION.md`** button in the header or in Step 3.

> `INSTRUCTION.md` is kept in sync with `PRD.md` (enforced by an automated test).

---

## 🧪 Testing

```bash
npm test
```

**14 regression tests** cover:

| # | Test |
| --- | --- |
| 1 | Parser & URL grouping |
| 2 | Analyzer & SEO blueprint |
| 3 | Content engine golden rules (element + word count) |
| 4 | Replacement engine & DOM preservation |
| 5 | H1/title mirror synchronization |
| 6 | FAQ structure preservation (block inside heading + `strong`/`p`) |
| 7 | Wrapper heading locked + slot-stamp integrity |
| 8 | Random UPPERCASE Indonesian reviewer names |
| 9 | `INSTRUCTION.md` ↔ `PRD.md` consistency |
| 10 | UI/utility text excluded from paragraph slots |
| 11 | Repeated old-title replacement in loose text nodes |
| 12 | Engine reporting + visible AI-failure fallback |
| 13 | Page color analysis + color remapping |
| 14 | Strict AI structure analysis (whitelist gating, structure-safe) |

---

## 🗂️ Project Structure

```
page-cloner-v3/
├── src/
│   ├── app/
│   │   ├── page.tsx              # 6-step workflow UI
│   │   ├── layout.tsx
│   │   ├── globals.css
│   │   └── api/
│   │       ├── analyze/          # extract + parse + analyze reference
│   │       ├── generate-content/ # SEO content generation
│   │       ├── clone/            # replacement + validation
│   │       ├── export/           # zip export
│   │       ├── instructions/     # read/write INSTRUCTION.md
│   │       └── test-ai/          # AI connection test
│   ├── components/
│   │   ├── AiSettingsModal.tsx   # AI provider config
│   │   ├── InstructionModal.tsx  # master prompt editor
│   │   └── SideBySideDiff.tsx    # interactive diff viewer
│   └── lib/
│       ├── fetcher.ts            # raw HTML / manual extraction
│       ├── parser.ts             # DOM, metadata, assets, links, slots
│       ├── analyzer.ts           # SEO + structure + keywords + blueprint
│       ├── content-engine.ts     # deterministic + LLM content generation
│       ├── color-analyzer.ts     # dominant color detection + labels
│       ├── structure-analyzer.ts # strict AI structure classification (whitelist)
│       ├── slot-replacer.ts      # structure-safe replacement engine
│       ├── validator.ts          # structural similarity diff
│       ├── exporter.ts           # zip bundling
│       └── types.ts
├── test/engine.test.ts
├── INSTRUCTION.md                # AI master prompt
├── PRD.md                        # full product spec
└── start.bat                     # Windows quick launcher
```

---

## 🧠 Core Philosophy

> **Analyze the reference.**
> **Understand the structure.**
> **Generate new content.**
> **Map the replacements.**
> **Preserve the original HTML.**
> **Replace only what needs replacing.**

This project always thinks:

```
NOT:  "How do I build this website?"
BUT:  "How do I preserve this exact website structure
       while replacing its content with new, relevant content?"
```

That is the definition of **pageCLoner**.

---

## ⚠️ Responsible Use

This tool is intended for legitimate SEO content analysis & migration on pages you have the right to work with. It must **not** be used to:

- Fabricate reviews, ratings, or customer testimonials
- Make misleading claims (guaranteed wins, fake rankings, etc.)
- Infringe copyright or terms of service

For regulated topics (e.g. gambling), please use responsible language, avoid guaranteed-outcome claims, and respect local laws.

---

<div align="center">

**Built with 🩵 for cleaner, faster, structure-safe SEO cloning.**

</div>
