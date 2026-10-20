---
doc: checklist
status: approved
---

# Build Checklist

Build mode: fast

## Slices

- [x] **1. Application Scaffolding, Theme & Ingestion Console**
  Becomes usable: A running local React + Tailwind developer studio with dark-mode HUD, header, and terminal editor.
  Why now: Establishes runnable foundation and dev server so subsequent slices attach to live UI immediately.
  PRD ref: `prd.md > Screens and Layout`, `prd.md > Error Ingestion & Detection`
  Spec ref: `spec.md > Stack`, `spec.md > File Structure`, `spec.md > Components > TerminalInput.jsx`
  Build: Initialize Vite + React project with Tailwind CSS, Lucide icons, create Header, TerminalInput, App shell.
  Verify (mechanical): Run npm run build and confirm it compiles with 0 errors.
  Learner check: Open http://localhost:5173 and see dark-mode terminal studio.
  Commit: `feat: scaffold ErrorSpeak developer console and terminal input`

- [x] **2. Diagnostic Engine & One-Click Presets**
  Becomes usable: Clicking any of the 5 presets (Python KeyError, Node Module Not Found, Git Conflict, Docker OOM, CORS) immediately parses the error and populates the structured triage model.
  Why now: The unique kernel (the triage logic) comes early, not last.
  PRD ref: `prd.md > Deterministic & AI Triage Engine`, `prd.md > The Core Journey`
  Spec ref: `spec.md > Components > PresetRibbon.jsx`, `spec.md > Data Model`
  Build: Implement engine/presets.js and engine/parser.js with regex pattern extractors for Python, Node, Git, Docker, and CORS; wire up PresetRibbon.
  Verify (mechanical): Automated node test verifying all 5 presets parse into valid TriageReport objects with non-empty rootCause and fixCommand.
  Learner check: Click each preset chip in the browser and see the input update and detection badge change.
  Commit: `feat: implement triage parser engine and 5 developer presets`

- [x] **3. Interactive Remediation Card with 1-Click Fix & Confetti**
  Becomes usable: Full 3-part triage card appears with plain-language explanation, pinpoint fault line, copyable terminal command with visual clipboard feedback and confetti celebration.
  Why now: Closes the core loop and delivers the working POC described in scope and PRD for demo video recording.
  PRD ref: `prd.md > Remediation Action Card`, `prd.md > States and Boundaries`
  Spec ref: `spec.md > Components > TriageCard.jsx`, `spec.md > Look and Feel`
  Build: Implement TriageCard.jsx with severity meter, plain English box, fault line highlight, copy-to-clipboard button with visual feedback, and canvas-confetti celebration.
  Verify (mechanical): Test build production bundle with npm run build, verify zero errors and clean output.
  Learner check: Click "Copy Fix Command" on a diagnosed error, observe the copied clipboard state and celebration effect.
  Commit: `feat: add remediation card, 1-click copy fix, and visual feedback`

## Hands-on Checkpoints

- [x] Early usable behavior explored — Slice 2 preset triage verified in browser
- [x] Final kick-the-tires exploration and feedback completed

## Final Review

- [x] Final review complete — feedback resolved and learner confirms ready to ship

## Code Tour and App Map

- [x] Learning activity complete — guided route, focused alternative, prior practice connected, or brief recap
- [x] Optional edit and transfer reflection addressed — offered/declined/already covered/not applicable as appropriate
- [x] `devpost/app-map.html` generated from finished code, checked, and shown, including a project-grounded practice to reuse

Activity and evidence: Verified all 5 error presets parse into complete TriageReports (src/engine/test-parser.js) and render interactive triage HUD (src/components/TriageCard.jsx).
Route and stops: Stop 1: src/components/TerminalInput.jsx (entry); Stop 2: src/engine/parser.js (kernel); Stop 3: src/components/TriageCard.jsx (remediation).
Edit outcome: Test script added to package.json and verified.
Reflection: Focused alternative applied; deterministic local fallback ensures zero demo failure.
Activity mode: Live app and editor running at http://localhost:5173.

## Revisions

Revision 1 (2026-10-20): review against the judging criteria found that the planned LLM connector was never built, some fix commands did not fix anything, sample answers were canned, and the README overclaimed. Scope, PRD and spec were updated first, then these slices were built.

- [x] **4. Honest local engine**
  Becomes usable: samples run through the real parser; every report has a fixKind and a confidence; unrecognized errors say so instead of guessing.
  PRD ref: `prd.md > Local Triage Engine`
  Spec ref: `spec.md > Engine Modules`, `spec.md > Data Model`
  Build: rewrote `parser.js` (innermost Python frame, pip/npm package-name rules, EADDRINUSE, ERESOLVE, rejected pushes, SSH, Docker daemon/ports, DB auth), reduced `presets.js` to raw inputs, added Postgres and Rust samples.
  Verify (mechanical): `npm test` checks every sample's error type, location and fix.
  Commit: `feat: honest local engine with confidence and fix kinds`

- [x] **5. Evidence check and command safety**
  Becomes usable: the card shows "N/N claims found in your trace" and a safety rating for every command.
  PRD ref: `prd.md > Evidence Check`, `prd.md > Command Safety Check`
  Spec ref: `spec.md > Engine Modules`
  Build: `grounding.js`, `safety.js`, new provenance strip and evidence list in `TriageCard.jsx`.
  Verify (mechanical): tests confirm destructive commands are flagged and invented claims are caught.
  Commit: `feat: evidence check and command safety check`

- [x] **6. Ask Claude with redaction**
  Becomes usable: with their own key, the user asks Claude; secrets are hidden first and the answer is checked.
  PRD ref: `prd.md > Ask Claude (optional)`
  Spec ref: `spec.md > External Services and Dependencies`, `spec.md > Security and Privacy`
  Build: `redact.js`, `claude.js` (structured output, refusal handling, fallbacks), `ClaudePanel.jsx`, `SettingsModal.jsx`, header connection button.
  Verify (mechanical): `npm run build` passes; tests confirm redaction; request shape checked with a stubbed fetch.
  Learner check: Postgres sample shows 2 hidden items and a clean preview; Rust sample shows low confidence and offers Claude.
  Commit: `feat: optional Claude connector with secret redaction`

- [x] **7. Connect any LLM**
  Becomes usable: the user connects any provider (Anthropic, OpenAI, Gemini, OpenRouter, Groq, or a custom OpenAI-compatible base URL) by entering a model name and an API key; the provider is detected automatically and the answer is checked the same way as before.
  PRD ref: `prd.md > Connect Any LLM (optional)`
  Spec ref: `spec.md > External Services and Dependencies`, `spec.md > Engine Modules`
  Build: `providers.js` (key-prefix and base-URL provider detection), `triage-schema.js` (shared schema, prompt and `toReport`), `llm.js` (OpenAI-compatible dispatcher for non-Anthropic providers), updated `claude.js` (model passed in, effort/fallback gated by model support), renamed `ClaudePanel.jsx` to `AIPanel.jsx`, reworked `SettingsModal.jsx` (model + key + Advanced base URL) and header button; removed `model.js`.
  Verify (mechanical): `npm test` covers provider detection; request shape checked with stubbed fetch for OpenAI, Gemini and a local base URL.
  Learner check: modal shows the detected provider.
  Commit: `feat: connect any LLM provider`
