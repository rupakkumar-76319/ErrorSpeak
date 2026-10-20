---
doc: prd
status: approved
---

# ErrorSpeak — Product Requirements

A local-first developer triage tool that turns opaque terminal errors into plain-English explanations, the exact fault line, and fixes that are evidence-checked and safety-checked before the user copies them.
Source: `scope.md > The Unique Kernel` and `scope.md > The Core Loop`.

## The Core Journey
1. **Arrival:** The developer lands on a dark developer console with an input editor and a tray of 7 sample errors (Python, Node.js, Git, Docker, CORS, a Postgres error that leaks a password, and a Rust error the local rules don't cover).
2. **Error Ingestion:** The developer clicks a sample or pastes their own terminal output. The environment badge updates as they type.
3. **Local Triage:** The engine parses the input in the browser:
   - Detects the environment (Python, Node.js, Git, Docker, Web, Shell).
   - Extracts the error type and the innermost fault location (file and line).
   - Scores severity (1 to 10) and reports its own confidence (high, medium, low).
4. **Inspection:** The triage card shows:
   - **Provenance strip:** local engine or the connected LLM (provider and model name), confidence, and "N/N claims found in your trace".
   - **What happened:** plain English, with a TL;DR toggle for the root cause.
   - **Where it broke:** file, line and the offending code.
   - **The fix:** a command labelled as a real fix, a code edit, or a diagnostic step; a safety rating; and why it works.
   - **Suggested patch:** before and after code when the fix is an edit.
   - **Evidence check:** each claim marked found or not found in the trace.
5. **Second Opinion:** The AI panel shows how many sensitive items will be hidden and lets the user preview the exact redacted text. With a model connected, it returns a structured report that is checked the same way, and the user can switch between the local view and the connected model's view.
6. **Outcome:** The developer copies the command (confetti only for non-destructive commands) and fixes the error.

## Screens and Layout
A single developer studio surface:
* **Header Bar:** logo, "Local-first · works offline" badge, "Connect Any LLM" button showing connection state (`LLM: <model>` once connected), and a link to the source.
* **Sample Tray:** 7 chips: Python KeyError, Node.js Module Missing, Git Merge Conflict, Docker OOMKilled, Browser CORS Block, Postgres Auth (leaks a password), Rust Borrow Error.
* **Main Split Workstation:**
  - **Left Panel:** monospace editor with line numbers, live environment badge, clear button, "Run Triage Engine" (Ctrl+Enter).
  - **Right Panel:** local / connected-model view switch (after the model answers, labelled with the model name), the triage card, and the AI panel.
* **LLM Settings Modal:** a model-name field and a password-type API key field, a collapsed "Advanced" section for a base URL (any OpenAI-compatible server, e.g. Ollama at `http://localhost:11434/v1`, where the key is optional), a detected-provider line, "remember on this device" option, privacy note, disconnect button.

## Look and Feel
* **Palette:** deep slate dark mode (`#070B14`, slate-900/950 cards) with high-contrast text.
* **Accents:** cyan for diagnosis, emerald for safe or verified, amber for caution or unverified, rose for errors and destructive commands, violet for the connected LLM.
* **Typography:** Fira Code for terminal content, Inter for explanations.
* **Interactions:** short scan animation, copy feedback, confetti for safe fixes, collapsible evidence list that opens automatically when something is unverified.

## Features and Behavior

### Error Ingestion & Detection
Source: `scope.md > The Core Loop`.
- The user can paste any text into the editor or click a sample. Samples go through the same parser as pasted text; there are no canned answers.
- *Acceptance Criteria:*
  - [x] Typing or pasting updates the environment badge immediately.
  - [x] Clicking a sample fills the editor and runs triage without a page reload.

### Local Triage Engine
Source: `scope.md > The Unique Kernel`.
- Produces a structured report: `{ environment, errorType, severity, location, offendingCode, plainExplanation, rootCause, fixKind, fixCommand, whyItWorks, fixDiff, confidence }`.
- Uses the innermost Python frame, the first non-internal Node frame, real package names (e.g. `cv2` → `opencv-python`, `@scope/pkg/sub` → `@scope/pkg`), and the container, origin and branch names from the trace.
- When no rule matches, it says so (low confidence, no fix) instead of guessing.
- *Acceptance Criteria:*
  - [x] All 7 samples produce the expected error type, location and fix (`npm test`).
  - [x] Unrecognized input shows low confidence and points to the AI panel.

### Evidence Check
Source: `scope.md > The Unique Kernel`.
- Matches the error type, file and line, quoted code, installed package names, and the connected model's evidence quotes against the raw trace.
- *Acceptance Criteria:*
  - [x] The card shows "N/N claims found in your trace".
  - [x] An invented file, package or quote is marked "not found" (covered by tests).

### Command Safety Check
Source: `scope.md > The Unique Kernel`.
- Rates every suggested command as safe, caution or danger, with reasons.
- *Acceptance Criteria:*
  - [x] `rm -rf`, `git reset --hard`, force pushes, `curl | sh` and `docker system prune` are flagged as destructive, and the copy button becomes "Copy anyway".
  - [x] Placeholders, `sudo`, `--force` and `--legacy-peer-deps` are flagged as caution.

### Connect Any LLM (optional)
Source: `scope.md > The POC Boundary`.
- The user enters a model name and an API key; the provider is detected from the key prefix (`sk-ant-` Anthropic, `sk-or-` OpenRouter, `gsk_` Groq, `AIza` Google Gemini, `sk-` OpenAI) or, if a base URL is set under Advanced, treated as a custom OpenAI-compatible server (key optional, e.g. a local Ollama instance).
- Settings are stored only in this browser, as JSON under `errorspeak.llm` (session by default, or `localStorage` when "Remember" is ticked). The key is sent only to the chosen provider.
- Redacts API keys, tokens, JWTs, private keys, connection-string passwords, secret assignments, emails and user-folder names before sending; the user can preview the exact text.
- Anthropic is called through `@anthropic-ai/sdk` with a zod structured-output schema. Every other provider is called as an OpenAI-compatible chat-completions endpoint with `response_format: json_object` and the schema spelled out in the prompt, then validated with zod.
- *Acceptance Criteria:*
  - [x] Without a model connected, the panel offers "Connect an LLM to enable" and the app works fully offline.
  - [x] The Postgres sample shows 2 sensitive items hidden, and the preview contains no password or user name.
  - [x] The AI report shows a violet "`<provider> · <model>`" badge and goes through the evidence and safety checks.
  - [x] API errors (bad key, rate limit, model/endpoint not found, network or CORS failure, invalid or wrong-shaped JSON) are shown in the panel and the local diagnosis stays visible.

## States and Boundaries
* **Empty State:** prompt to paste an error or pick a sample, with the Trace / Explain / Fix safely steps.
* **Analyzing:** a short scan state on the run button.
* **Results:** triage card plus AI panel.
* **Low Confidence:** "No reliable fix from the local rules", and the AI panel is highlighted.
* **AI Loading / Error:** spinner on the button; readable error message in the panel.

## Product Decisions
* **Local-first, AI second:** most beginner errors follow known patterns, so they are answered instantly, offline and free; the AI is used where it adds value.
* **Verify instead of trust:** AI answers and rule answers are both checked against the trace, because a confident wrong answer is the main risk for beginners.
* **Bring-your-own key and model, no backend:** nothing passes through a server we run, and the user decides which provider to use and what is sent.
* **Single surface layout:** the whole loop fits on one screen and in a short demo video.

## What We're Building
* Responsive web app with a high-contrast developer theme.
* Local engine for Python, Node.js, Git, Docker, CORS and shell errors.
* Evidence check, command safety check and secret redaction.
* Optional connector to any LLM provider, with structured output.
* 7 sample errors and an automated test suite.

## Deferred From the POC
* Shell integration that captures failures automatically (`errorspeak watch`).
* Saved history of resolved errors.
* Multi-file repository context for the connected model.

## Possible Later Enhancements
* VS Code / Cursor extension that highlights the fault line in place.
* Learning from fixes the user confirms worked.

## Non-Goals
* A full terminal emulator in the browser.
* Running fix commands automatically.
