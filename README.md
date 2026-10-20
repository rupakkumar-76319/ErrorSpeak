# ErrorSpeak

> Paste a terminal error. Get a plain-English explanation, the exact line that broke, and a fix that is checked against your trace and for safety before you copy it.
> Built for the Devpost **Build With AI: Basics** hackathon.

[![License: MIT](https://img.shields.io/badge/License-MIT-emerald.svg)](LICENSE)
[![Live demo](https://img.shields.io/badge/demo-GitHub%20Pages-blue.svg)](https://rupakkumar-76319.github.io/ErrorSpeak/)

**Live demo:** https://rupakkumar-76319.github.io/ErrorSpeak/

---

## The problem

A beginner hits a 50-line wall of red text: `KeyError`, `Cannot find module`, `exited with code 137`. What usually happens next:

1. They paste it into a search engine or a chatbot, often with an API key or database password still in it.
2. They get a confident answer they can't check.
3. They run a command they don't understand. Sometimes it's `git reset --hard` or `rm -rf`.

## What ErrorSpeak does

| Step | What you see |
|---|---|
| **Explain** | What happened in plain English, with a TL;DR for experienced devs. |
| **Locate** | The file, line and code that failed (innermost frame, not the first one). |
| **Fix** | A command labelled as a real fix, a code edit or a diagnostic step, plus a before/after patch. |
| **Check the claims** | "3/3 claims found in your trace": error type, file, line, quoted code and package names are matched against what you pasted. Anything invented is flagged. |
| **Check the command** | Destructive or risky commands (`rm -rf`, `git reset --hard`, force push, `curl \| sh`, `docker system prune`) are flagged before you copy them. |
| **Connect any LLM (optional)** | For errors the local rules don't know, ask the LLM you connect — Anthropic, OpenAI, Gemini, OpenRouter, Groq, or any OpenAI-compatible server (including a local one like Ollama) — with your own model name and API key. Secrets are removed first, you can preview exactly what is sent, and the model's answer goes through the same checks. |

## How it works

**Local-first.** A rule-based engine in `src/engine/parser.js` handles common Python, Node.js, Git, Docker, CORS and shell errors in the browser, offline, and reports its own confidence. When it has no rule, it says so instead of guessing.

**AI where it helps.** You choose the model: enter a model name and an API key (or a custom base URL for a local or self-hosted server). `src/engine/providers.js` detects the provider from the key prefix (`sk-ant-` Anthropic, `sk-or-` OpenRouter, `gsk_` Groq, `AIza` Gemini, `sk-` OpenAI) or from the base URL. Anthropic is called directly from the browser through the Anthropic SDK (`src/engine/claude.js`); every other provider is called as an OpenAI-compatible chat-completions endpoint (`src/engine/llm.js`). Both share one contract (`src/engine/triage-schema.js`):
- **structured output** (a zod schema, enforced server-side for Anthropic and validated client-side for the rest) so the answer always has the same shape as the local report;
- **verbatim evidence quotes** that the app checks character by character against the trace;
- **clear error handling** for rejected keys, rate limits, missing models, network/CORS failures and malformed JSON, so a failed request doesn't break the app.

**Privacy.** `src/engine/redact.js` removes API keys, tokens, JWTs, private keys, connection-string passwords, emails and user-folder names before anything is sent. Your key is stored only in your browser (for the session by default). There is no backend.

**Verification.** `src/engine/grounding.js` (evidence check) and `src/engine/safety.js` (command safety check) run on every diagnosis, whether it came from the rules or from the connected LLM.

## Try it

The live demo has 7 sample errors. Two show the new ideas:
- **Postgres Auth (leaks a password):** the trace contains `postgres://admin:<password>@...`. Open "Preview what is sent" to see it replaced with `<PASSWORD>` and the user folder with `<USER>`.
- **Rust Borrow Error:** the local engine has no rule, says "low confidence", and offers to ask the connected LLM.

### Run locally
```bash
git clone https://github.com/rupakkumar-76319/ErrorSpeak.git
cd ErrorSpeak
npm install
npm run dev        # http://localhost:5173/ErrorSpeak/
npm test           # engine, redaction, safety, evidence and provider-detection tests (no network)
```
To connect an LLM, click **Connect Any LLM**, enter a model name, and either paste an API key (Anthropic `sk-ant-...`, OpenAI `sk-...`, Gemini `AIza...`, OpenRouter `sk-or-...`, Groq `gsk_...`) or, under Advanced, set a base URL for any OpenAI-compatible server such as a local Ollama instance (`http://localhost:11434/v1`, key optional there).

## Limits (honest list)
- The local rules cover common beginner errors, not everything. Unknown errors are marked low confidence.
- The evidence check confirms that a claim appears in your trace; it can't prove a fix is correct.
- Connecting an LLM needs your own API key (or a reachable base URL) and sends the redacted trace to that provider.
- Some providers may block direct requests from a browser (CORS); this shows up as a connection error in the AI panel.
- JSON quality for providers without enforced structured output depends on the model you choose.
- Providers other than Anthropic were tested only with a stubbed network, not against their live APIs.

## How it was built
Planned and built with the [Devpost Learn Skill Pack](https://github.com/challengepost/learn-ai-basics) in Claude Code, plan first and then build:
1. [Scope](devpost/scope.md) — the core idea and what's cut.
2. [PRD](devpost/prd.md) — screens, behavior and acceptance criteria.
3. [Spec](devpost/spec.md) — stack, components, data model, failure modes.
4. [Build checklist](devpost/checklist.md) — ordered slices, each with a mechanical check, plus the revision that added the evidence check, safety check, and the connect-any-LLM feature.
5. [App map](devpost/app-map.html) — a visual tour of the code.

The `.agents/`, `.claude/` and `agent/` folders are the skill pack installed by `npx skills add challengepost/learn-ai-basics` for different coding agents. They are planning guides and are not part of the running app.

## License
[MIT](LICENSE)
