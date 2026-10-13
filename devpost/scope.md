---
doc: scope
status: approved
---

# ErrorSpeak

An intelligent terminal triage and stack trace remediation studio that translates cryptic runtime errors into plain-English root causes, visual problem maps, and 1-click verified terminal fixes.

## The Unique Kernel
Instead of generic, wordy AI chat explanations, ErrorSpeak acts as a deterministic triage engine: it parses raw stack traces, isolates the exact offending line and trigger condition, presents a visual "Confidence & Complexity Gauge", and produces an actionable 1-click copyable shell fix alongside a code diff.

## Who It's For
* **Primary Persona:** Junior developers, bootcamp students, and self-taught programmers who encounter intimidating walls of terminal text (Node.js, Python, Git, Docker) and lose hours guessing or fearing asking for help.
* **Alternative Today:** Pasting giant stack traces into Google or generic ChatGPT windows, wading through outdated 2014 StackOverflow threads, and guessing trial-and-error commands in their shell.

## The Core Loop
1. **Input:** Developer pastes a messy terminal stack trace or selects a one-click sample error preset.
2. **Analysis:** The engine instantly parses the runtime environment, pinpoints the root cause, and calculates an error severity/complexity score.
3. **Action:** Developer views a 3-part diagnosis:
   - *Plain English:* What actually broke in human terms.
   - *The Trigger:* Exact file, line number, and runtime condition.
   - *The Remedy:* A copyable terminal command / code snippet with a "Why this works" breakdown.
4. **Outcome:** Developer copies the command, fixes their build, and returns to coding in under 30 seconds.

## Inspiration & Identity
* **Aesthetic:** High-contrast developer terminal aesthetic (dark slate/carbon palette, monospace accents, emerald/amber/rose status indicators).
* **Energy:** Fast, sharp, and empowering—resembling modern developer developer tooling like Raycast, Linear, and Vercel.
* **References:** [Raycast Developer Utilities](https://raycast.com), [Vercel Error Tracking](https://vercel.com).

## Why This Matters to the Learner
To demonstrate practical, spec-driven agentic engineering that produces a complete, visually striking developer tool that runs effortlessly on any standard CPU without heavy infrastructure or complex dependencies.

## What "Working" Looks Like
A developer opens the web app in their browser, pastes a messy Python `KeyError` or Node.js `ERR_MODULE_NOT_FOUND` stack trace (or clicks a preset demo button), and within 200ms sees:
1. Environment auto-detected with badge (e.g. `Node.js 22`).
2. Plain-language explanation banner.
3. Code highlight identifying the fault line.
4. One-click copyable terminal command to fix it, verified in the 2-minute demo video.

## The POC Boundary (What's In)
* Fast, 100% CPU-compatible local web app (Vite + React + Tailwind CSS).
* Dual Diagnostic Engine:
  - Smart Client-Side Parser with built-in instant presets (Node, Python, Git, Docker).
  - Optional Live LLM API connector for arbitrary raw error strings.
* Interactive Diagnostic Card (Plain-language translation, root cause, copyable fix, diff preview).
* Preset Demo Tray (5 instant developer error scenarios for flawless live recording).

## Later (Post-POC)
* CLI tool companion (`errorspeak run "npm start"`).
* IDE extension for VS Code / Cursor.
* Team collaborative error knowledge base.

## Explicitly Cut
* **User Accounts / Authentication:** Unnecessary friction for a hackathon proof of concept.
* **Heavy Local GPU Model Weights:** App runs 100% lightweight on CPU via local parsing and lightweight cloud API calls.
* **Complex Multi-service Cloud Backends:** Kept self-contained as a fast, zero-latency frontend application for bulletproof reliability.

