---
doc: prd
status: approved
---

# ErrorSpeak — Product Requirements

An intelligent developer terminal triage studio that transforms opaque terminal errors and stack traces into instant plain-English explanations, visual problem maps, and 1-click verified terminal remediation commands.
Source: `scope.md > The Unique Kernel` and `scope.md > The Core Loop`.

## The Core Journey
1. **Arrival:** The developer lands on the ErrorSpeak dashboard. A high-contrast dark developer console greets them with a clean code/error input area and a quick-start tray of 5 realistic preloaded error scenarios (Node.js, Python, Docker, Git, Web CORS).
2. **Error Ingestion:** The developer either clicks a preset scenario or pastes their own raw terminal error output into the console input.
3. **Instant Triage Execution:** The engine instantly parses the input (client-side in <100ms):
   - Categorizes runtime environment (e.g., Python 3.11, Node.js 22, Git CLI).
   - Extracts the exact error type (e.g., `ModuleNotFoundError`, `KeyError`, `OOMKilled`).
   - Pinpoints the offending file and line number.
   - Computes an error severity & complexity score (1 to 10).
4. **Remediation Inspection:** The developer views the 3-panel triage card:
   - **Plain English Breakdown:** Clear explanation of what went wrong in plain human language.
   - **Visual Fault Locator:** Code snippet highlighting the exact triggering line.
   - **Remediation Terminal Command:** 1-click copyable shell command with a rationale of why the command fixes the problem.
5. **Success / Verification:** The developer clicks "Copy Command", executes it in their shell, and marks the issue as resolved.

## Screens and Layout
A single, high-density, beautifully crafted developer studio surface:
* **Header Bar:** ErrorSpeak logo, CPU-native status badge ("100% Local Engine • Fast Triage"), and GitHub repo link.
* **Top Ribbon — Quick Presets Tray:** 5 clickable scenario chips:
  1. `Python KeyError: 'user_id'`
  2. `Node.js ERR_MODULE_NOT_FOUND: 'express'`
  3. `Git Conflict: Merge branch 'feature'`
  4. `Docker OOMKilled (Exit Code 137)`
  5. `Browser CORS Preflight Blocked`
* **Main Split Workstation:**
  - **Left Panel (Input & Raw Terminal):** Monospace terminal editor with line numbers, clear button, and "Run Triage Agent" CTA.
  - **Right Panel (Triage Results Card):** 
    - Diagnostic header: Environment Badge, Error Classification, Severity Meter.
    - Plain-Language Summary Box.
    - Root-cause pinpoint box (File + Line).
    - Fix Action Card with 1-click copyable command & diff view.
    - "Explain Like I'm 5" vs "Senior Dev TL;DR" toggle.

## Look and Feel
* **Palette:** Deep carbon developer dark mode (`#0B0F19`, `#111827`, `#1F2937`) with high-contrast text (`#F9FAFB`).
* **Accents:** Neon Cyan (`#06B6D4` / `#38BDF8`) for AI diagnostics, Emerald (`#10B981`) for verified fixes, Rose (`#F43F5E`) for error flags, Amber (`#F59E0B`) for warnings.
* **Typography:** `JetBrains Mono` / `Fira Code` for code & terminal elements, clean modern sans-serif (`Inter`) for analysis and instructions.
* **Interactions:** Crisp micro-animations, copy button feedback states ("Copied to Clipboard!"), instant preset loading.

## Features and Behavior

### Error Ingestion & Detection
Source: `scope.md > The Core Loop`.
- The user can paste any string into the terminal input textarea.
- The system automatically detects whether the input looks like Python, JavaScript/Node, Git, or Docker.
- *Acceptance Criteria:*
  - [x] Pasting a stack trace immediately updates the active environment badge.
  - [x] Clicking any preset chip populates the input and triggers analysis immediately without page reload.

### Deterministic & AI Triage Engine
Source: `scope.md > The Unique Kernel`.
- The engine decomposes the error into structured JSON: `{ environment, errorType, location, explanation, fixCommand, whyItWorks, severity }`.
- Operates 100% locally on CPU via smart regex & parser patterns; supports optional live LLM API call if key is provided.
- *Acceptance Criteria:*
  - [x] Correctly identifies error types across all 5 built-in presets.
  - [x] Displays explanation in plain English with zero jargon.

### Remediation Action Card
Source: `scope.md > What "Working" Looks Like`.
- Displays the exact terminal command or code fix needed to resolve the error.
- Includes a dedicated "Copy Fix Command" button with visual feedback.
- *Acceptance Criteria:*
  - [x] Clicking copy button places command into system clipboard and shows green checkmark state.
  - [x] Explanation highlights the command's flag or parameter rationale.

## States and Boundaries
* **Empty State:** Clean terminal prompt with animated cursor (`$ paste error or choose preset above...`).
* **Active Triage State:** Smooth scanning animation (<200ms) indicating analysis.
* **Success / Results State:** Rich, color-coded triage card populated with all 4 diagnostic layers.
* **Invalid / Unrecognized Input State:** Gentle guidance banner suggesting standard formats or offering manual analysis mode.

## Product Decisions
* **Single Surface Layout:** Chosen over multi-page navigation to keep the core loop frictionless and instantly demonstrable within 60 seconds on video.
* **Built-in Preset Tray:** Guarantees flawless, zero-lag demonstration during the video pitch without relying on live network connectivity or rate limits.
* **100% CPU Client Execution:** Enables instantaneous load times, zero backend dependencies, and zero setup hurdles for hackathon reviewers.

## What We're Building
* Complete responsive web dashboard with high-contrast developer theme.
* Local CPU parsing engine covering Node.js, Python, Git, Docker, and Web errors.
* 5 realistic preloaded error scenarios with verified fixes.
* Interactive copy-to-clipboard, view toggles, and severity indicators.

## Deferred From the POC
* Real-time bash shell interception daemon (`errorspeak watch`).
* User accounts and saved error history database.
* Full multi-file repository indexing.

## Possible Later Enhancements
* IDE extension for VS Code / Cursor to highlight runtime errors in-line.
* Automated terminal patch execution via local MCP server.

## Non-Goals
* Re-implementing a full bash terminal emulator in the browser.
* Training custom local foundation models on GPU.
