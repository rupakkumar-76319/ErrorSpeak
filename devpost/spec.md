---
doc: spec
status: approved
---

# ErrorSpeak — Technical Specification

## How This Works, In Plain Language
ErrorSpeak is a browser-only React app. When the user pastes an error or picks a sample, a local rule-based parser turns it into a structured triage report and states its confidence. Two checks run on every report: an evidence check that looks for each claim in the original trace, and a safety check that rates the suggested command. If the user connects an LLM of their choice (model name plus API key, or a custom base URL), they can ask it for a diagnosis: the trace is redacted in the browser, sent directly to that provider, and the structured answer is shown with the same checks. There is no backend.

## The Core Journey Through the System
1. **Selection:** the user clicks a chip in `PresetRibbon` or types into `TerminalInput`; `detectEnvironment` updates the badge live.
2. **Local triage:** `App.jsx` calls `engine/parser.js > parseError(text)`, which returns a `TriageReport` with `source: "local"`.
3. **Render:** `TriageCard.jsx` shows the report and runs `engine/grounding.js > groundReport(report, rawText)` and `engine/safety.js > lintCommand(fixCommand)`.
4. **Ask the connected LLM (optional):** `AIPanel.jsx` runs `engine/redact.js > redactSecrets(rawText)` and shows the count and preview. On click, `App.jsx` lazy-loads `engine/llm.js` and calls `analyzeWithLLM({ config, redactedText, localReport })`, where `config` is `{ model, apiKey, baseUrl }`.
5. **Provider dispatch:** `engine/providers.js > detectProvider(config)` reads the key prefix (or the presence of a base URL) to pick Anthropic, OpenAI, Gemini, OpenRouter, Groq, or a custom OpenAI-compatible server. Anthropic is routed to `engine/claude.js`; every other provider goes through `engine/llm.js`'s own OpenAI-compatible request, both built on the shared contract in `engine/triage-schema.js`.
6. **AI response:** a `TriageReport` with `source: "ai"`, plus `provider` and `model` fields, and `evidence` quotes. The view switch (labelled with the model name) lets the user compare it with the local report; both go through the same checks.
7. **Copy:** the copy button writes the command to the clipboard; confetti only fires when the command is not destructive.

## Stack
* **Build tool:** Vite 5.
* **UI:** React 18, Tailwind CSS 3, Lucide icons, canvas-confetti.
* **AI:** `@anthropic-ai/sdk` (TypeScript/JS SDK) for Anthropic, with `zod` for the structured-output schema shared by every provider.
* **Hosting:** GitHub Pages via GitHub Actions (`.github/workflows/deploy.yml`, Vite `base: '/ErrorSpeak/'`).

## Where It Runs and How Someone Tries It
* **Live:** https://rupakkumar-76319.github.io/ErrorSpeak/
* **Local:** `npm install`, then `npm run dev`, then open http://localhost:5173/ErrorSpeak/
* **Tests:** `npm test` (engine, redaction, safety, evidence and provider-detection checks; no network).
* **Hardware:** any browser; no GPU.

## Look and Feel
* **Palette:** `#070B14` background, slate-900/950 cards, slate-800 borders.
* **Accents:** cyan (diagnosis), emerald (safe/verified), amber (caution/unverified), rose (errors/destructive), violet (the connected LLM).
* **Fonts:** Fira Code for terminal content; Inter for explanations.

## Components
Implements `prd.md > Screens and Layout`.

### `Header.jsx`
Brand, "Local-first · works offline" badge, "Connect Any LLM" button that opens the settings modal and shows connection state (`LLM: <model>` once connected), source link.
PRD ref: `prd.md > Screens and Layout`.

### `PresetRibbon.jsx`
Renders the sample chips from `engine/presets.js`. Clicking one fills the editor and runs triage.
PRD ref: `prd.md > Error Ingestion & Detection`.

### `TerminalInput.jsx`
Monospace editor with line numbers, live environment badge, clear button, run button and Ctrl+Enter shortcut.
PRD ref: `prd.md > Error Ingestion & Detection`.

### `TriageCard.jsx`
Header (environment, error type, severity, Plain English / TL;DR), provenance strip (source — local engine, or `<provider> · <model>` — confidence, evidence score), explanation, fault location and code, fix box labelled by `fixKind` with safety rating and "why this works", patch preview, and the collapsible evidence list.
PRD ref: `prd.md > Local Triage Engine`, `prd.md > Evidence Check`, `prd.md > Command Safety Check`.

### `AIPanel.jsx`
Explains when the connected LLM is useful (highlighted on low confidence), shows redaction counts by type and a preview of the exact text sent, the "Ask `<model>`" / "Connect an LLM to enable" button, loading state and errors.
PRD ref: `prd.md > Connect Any LLM (optional)`.

### `SettingsModal.jsx`
Model-name field, password-type API key field, a collapsed "Advanced" section for a base URL, a detected-provider line (from `engine/providers.js > detectProvider`), "remember on this device" checkbox (localStorage, otherwise sessionStorage), privacy note, disconnect button.
PRD ref: `prd.md > Connect Any LLM (optional)`.

## Engine Modules
* `parser.js` — `detectEnvironment(text)` and `parseError(text)`; one parser per environment (Python, Node.js, Git, Docker, CORS, Shell) plus a generic low-confidence fallback.
* `presets.js` — the 7 sample inputs (raw text only).
* `grounding.js` — `groundReport(report, rawText)` → `{ checks[], verified, total }`.
* `safety.js` — `lintCommand(cmd)` → `{ level: "safe" | "caution" | "danger" | "none", reasons[] }`.
* `redact.js` — `redactSecrets(text)` → `{ text, findings[] }`.
* `providers.js` — `PROVIDERS` (label, default base URL, example model id per provider) and `detectProvider({ apiKey, baseUrl })`, which checks the key prefix (`sk-ant-` Anthropic, `sk-or-` OpenRouter, `gsk_` Groq, `AIza` Gemini, `sk-` OpenAI) or returns `"custom"` when a base URL is set.
* `triage-schema.js` — the contract shared by every provider: `TriageSchema` (zod), `SYSTEM_PROMPT`, `JSON_INSTRUCTIONS` (the field list spelled out for providers without schema enforcement), `buildUserMessage(redactedText, localReport)`, and `toReport(r, { provider, model })`.
* `claude.js` — `analyzeWithClaude({ apiKey, model, redactedText, localReport })`; calls the Anthropic SDK with `betaZodOutputFormat(TriageSchema)`; lazy-loaded so the SDK is not in the initial bundle.
* `llm.js` — `analyzeWithLLM({ config, redactedText, localReport })`; the dispatcher. Routes Anthropic to `claude.js`; every other provider is called directly as an OpenAI-compatible `POST {base}/chat/completions` with `response_format: { type: "json_object" }`, then validated with `TriageSchema.safeParse`.
* `test-parser.js` — assertion-based test suite run by `npm test`, including provider-detection cases.

## Data Model
```typescript
interface TriageReport {
  id: string;
  source: "local" | "ai";
  provider?: string;                    // AI reports only, e.g. "Anthropic (Claude)", "OpenAI"
  model?: string;                       // AI reports only, the user-chosen model name
  environment: string;                  // "Python" | "Node.js" | "Git" | "Docker" | "Web / Network" | "PowerShell / Shell" | ...
  errorType: string;
  severity: number;                     // 1 to 10
  confidence: "high" | "medium" | "low";
  location: string;                     // "file:line", or a short description
  offendingCode: string;
  plainExplanation: string;
  rootCause: string;
  fixKind: "shell" | "code" | "diagnose";
  fixCommand: string;                   // empty when there is no reliable fix
  whyItWorks: string;
  fixDiff: { before: string; after: string } | null;
  evidence?: string[];                  // verbatim quotes from the trace (AI reports)
  timestamp: string;
}
```

## External Services and Dependencies
* **Provider is user-chosen; no default model is assumed.** The user supplies both a model name and an API key (or a base URL), and `detectProvider` picks the provider from that input.
* **Anthropic:** called from the browser with the user's own key through `@anthropic-ai/sdk` (`dangerouslyAllowBrowser: true`, which sends the `anthropic-dangerous-direct-browser-access` header). Request settings:
  * `output_config.effort: "low"` only on models that support it (triage is a short task; keeps answers fast when available);
  * structured output via `betaZodOutputFormat(TriageSchema)` so the response always parses into a `TriageReport`;
  * server-side fallback (`fallbacks: "default"`, beta `server-side-fallback-2026-07-01`) only on `claude-opus-5` / `fable` models, so a classifier refusal is retried on a fallback model;
  * `stop_reason` checked for `refusal` and `max_tokens` before the parsed output is used.
* **OpenAI, Gemini, OpenRouter, Groq, and any custom OpenAI-compatible server:** called directly as `POST {base}/chat/completions` with `response_format: { type: "json_object" }`, the system prompt plus an explicit JSON field list, and the response validated with `TriageSchema.safeParse`. Errors are mapped to readable messages for 401/403 (key rejected), 404 (model or endpoint not found), 429 (rate limited), a network/CORS failure, invalid JSON, or the wrong JSON shape.
* The app works fully without any key or model connected.

## Important Failure Modes
* **Unrecognized input:** low confidence, no fix command, the AI panel highlighted.
* **Invalid key / rate limit / model not found / network or CORS failure / invalid or wrong-shaped JSON:** a readable message in the AI panel; the local report stays visible.
* **Storage blocked (private mode):** the settings are kept in memory for the tab.
* **The connected model claims something not in the trace:** marked "not found" in the evidence check and the evidence list opens automatically.

## Security and Privacy
* The key never leaves the browser except in requests to the chosen provider (or the user's own base URL).
* Redaction runs before every request and the user can preview the payload.
* Nothing is executed automatically; destructive commands are flagged and lose the confetti.

## What Was Simplified and Why
* **Rules instead of a local model:** instant, offline and predictable on any machine; the connected LLM handles what the rules can't.
* **Browser-direct API calls instead of a proxy:** no server to run or secure for a proof of concept; the trade-off is that users bring their own key and the browser must reach the provider directly.

## Limits (Honest List)
* Some providers may block direct browser requests (CORS); the AI panel reports this as a connection failure rather than hanging.
* JSON quality for providers without schema enforcement depends on the model chosen; a weaker model can return the wrong shape, which is caught by `TriageSchema.safeParse` and reported, not silently accepted.
* Providers other than Anthropic were exercised only through tests with a stubbed network, not against their live APIs.

## Decisions and Open Issues
* A standalone browser app keeps the demo reliable and reviewers need nothing installed.
* Open: a CLI that pipes failing commands into the same engine.
