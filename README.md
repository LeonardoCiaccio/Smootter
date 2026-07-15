# Smootter

**A tool factory living inside your browser.**

Smootter is a cross-browser (Chrome-first, Firefox in progress) Manifest V3 extension
that lets you build, save, and run your own small tools directly in the browser —
no subscriptions, no per-use cost, no external SaaS. Bring your own LLM (any
OpenAI-compatible endpoint) and Smootter turns it into working browser automation,
saved links, text expansion, and article summaries, all stored locally.

---

## Table of contents

- [What's inside](#whats-inside)
- [Tech stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Getting started](#getting-started)
- [Loading the unpacked extension](#loading-the-unpacked-extension)
- [Available scripts](#available-scripts)
- [Configuring an LLM](#configuring-an-llm)
- [Project structure](#project-structure)
- [Contributing](#contributing)
- [Licensing](#licensing)

---

## What's inside

| Module | What it does |
|---|---|
| **Tools** | Describe what you need in plain language; Smootter generates a runnable browser tool (via `chrome.userScripts`) and lets you tweak it with a code editor, test it, and schedule when/where it runs. |
| **Bookmarklets** | A searchable, taggable, categorized library of saved links, with AI-powered search across your collection. |
| **Network** | An in-page inspector for every resource a page loads, including requests hidden from the regular DevTools view. |
| **Chat** | An AI chat panel that lives in the extension's own page, with Markdown rendering. |
| **Resumer** | Hover any article to reveal an icon that sends it straight into an AI chat for a summary. |
| **Replacer** | Text-expansion engine: type a placeholder (e.g. `/home`) in any field on the page and it's replaced with saved text. Placeholders starting with `/ai-` are rewritten live by your LLM instead of a static snippet. |

All AI-powered features are **bring-your-own-key**: Smootter never bundles or resells
model access. Everything else (bookmarklets, tools, replacer text, network captures) is
stored locally in the browser's own database — nothing leaves your machine unless you
explicitly call your configured LLM endpoint.

## Tech stack

- **Vue 3** + **Vue Router** for the extension UI (rendered inside a sandboxed iframe page)
- **Tailwind CSS** (+ Typography plugin) for styling, centralized in `src/styles/ui.ts`
- **Heroicons** for icons
- **TypeScript** everywhere, strict-checked with `vue-tsc`
- **Vite** for bundling (multiple build passes — see [Available scripts](#available-scripts))
- **CodeMirror 6** for the in-app code editor (tool builder)
- **IndexedDB** for local storage (bookmarklets, tools, replacer entries, chat history)
- `chrome.userScripts` / `chrome.scripting` for running generated tools and content scripts
- `marked` + `DOMPurify` for sanitized Markdown rendering

## Prerequisites

- **Node.js 20+** and **npm**
- A Chromium-based browser (Chrome 135+) for development and testing
- (Optional) An OpenAI-compatible LLM endpoint and API key, for the AI-powered features

## Getting started

```bash
# 1. Clone the repository
git clone https://github.com/LeonardoCiaccio/Smootter.git
cd Smootter

# 2. Install dependencies
npm install

# 3. Start the dev server (for UI iteration; content scripts/service worker still need a real build+load)
npm run dev

# 4. Produce a full extension build
npm run build
```

`npm run build` type-checks the whole project (`vue-tsc --noEmit`) and then runs four
Vite build passes into `dist/`: the main ES-module bundle (service worker + iframe UI),
followed by one IIFE pass per content script (`environment`, `resumer`, `replacer`).
Content scripts are built as separate single-entry IIFE bundles on purpose — see the
comment at the top of `vite.config.ts` for why they can't share a chunked build.

## Loading the unpacked extension

1. Run `npm run build`.
2. Open `chrome://extensions`.
3. Enable **Developer mode** (top right).
4. Click **Load unpacked** and select the generated `dist/` folder.
5. Open `chrome://extensions`, find Smootter, and enable **Allow User Scripts** — this
   is required for generated Tools and the Resumer/Replacer services to run.
6. Click the Smootter icon in the toolbar to open the extension UI.

After any code change, re-run `npm run build` and click the reload icon on the
extension's card in `chrome://extensions`.

## Available scripts

| Script | Description |
|---|---|
| `npm run dev` | Vite dev server for iterating on the UI. |
| `npm run build` | Type-check + full production build for Chrome, output in `dist/`. |
| `npm run build:firefox` | Same build, targeting Firefox (experimental — see note below). |
| `npm run preview` | Preview the built iframe UI standalone (outside the extension shell). |
| `npm run lint` / `npm run lint:fix` | ESLint over the whole project. |
| `npm run format` / `npm run format:check` | Prettier formatting. |

> **Firefox support** is a work in progress: the `build:firefox` script exists and
> produces a build, but browser-specific manifest handling (e.g.
> `browser_specific_settings`, Firefox's `userScripts` API shape) isn't fully wired up
> yet. Treat it as experimental until this note is removed.

## Configuring an LLM

Every AI-powered feature (Tools generation, Bookmarklets AI search, Chat, Resumer,
`/ai-` Replacer placeholders) needs an LLM configured once, from the extension's
**Options** page: an endpoint URL, model name, and API key for any OpenAI-compatible
chat-completions API. Nothing is configured by default, and no feature silently
falls back to a bundled model.

## Project structure

```
src/
├── background/     # service worker: message routing, tool/resumer/replacer services, LLM client
├── content/        # content scripts (environment, resumer, replacer) — each built as its own IIFE
├── iframe/          # the extension's own UI: views, components, composables, router
│   ├── views/        # one view per section (Tools, Bookmarklets, Network, Chat, Replacer, Options)
│   ├── components/    # UI building blocks, including the tool-builder wizard
│   ├── composables/   # reusable reactive logic
│   └── plugins/        # structural logic registered via app.use() (routing, messaging, theme, toasts)
├── shared/          # code shared between background and iframe: DB layers, message contracts, utils
└── styles/          # centralized Tailwind class definitions (ui.ts) and tailwind.css entry

public/
├── manifest.json     # MV3 manifest
├── _locales/          # i18n messages (en, it, es, fr, de)
└── icons/, fonts/      # static assets
```

## Contributing

Contributions are welcome. By submitting a pull request you agree to the
[Contributor License Agreement](CLA.md) — it keeps the project safely under a single
AGPL-3.0 license while allowing dual/commercial licensing (see below). Please also
follow the existing code style (English identifiers/comments, Tailwind-only styling
via `src/styles/ui.ts`, small single-responsibility functions).

## Licensing

Smootter is released under the **GNU Affero General Public License v3.0**
([`LICENSE`](LICENSE)). If AGPL-3.0 doesn't fit your use case (e.g. closed-source or
SaaS integration), a commercial license is available — see [`COMMERCIAL.md`](COMMERCIAL.md).
