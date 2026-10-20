---
doc: scope
status: approved
---

# ErrorSpeak

A local-first triage tool that turns cryptic terminal errors into a plain-English explanation, the exact line that broke, and a fix that has been checked before you copy it.

## The Unique Kernel
Chatbots answer an error with confident prose you can't verify, and sometimes with a command that deletes your work. ErrorSpeak's kernel is **trust**:
1. A rule-based engine runs in the browser, offline, and says how confident it is.
2. Every claim on the card (error type, file, line, package, quoted code) is checked against the trace you pasted, and anything not found is flagged.
3. Every suggested command passes a safety check that flags destructive or risky commands (`rm -rf`, `git reset --hard`, `curl | sh`, force pushes) before you copy them.
4. For errors the rules don't cover, the user can ask an LLM they connect themselves (Anthropic, OpenAI, Gemini, OpenRouter, Groq, or any OpenAI-compatible server, including a local one). Secrets are stripped from the trace first, the user sees exactly what is sent, and the model's answer goes through the same evidence and safety checks.

## Who It's For
* **Primary Persona:** Junior developers, bootcamp students, and self-taught programmers who hit intimidating walls of terminal text (Node.js, Python, Git, Docker) and lose hours guessing or are afraid to ask for help.
* **Alternative Today:** Pasting the trace (often with API keys and passwords still in it) into a search engine or a chatbot, reading outdated forum threads, and trying commands they don't understand.

## The Core Loop
1. **Input:** The developer pastes a terminal error or clicks a sample.
2. **Analysis:** The local engine detects the environment, error type, fault line and severity, and reports its confidence.
3. **Action:** The developer reads a 3-part diagnosis:
   - *Plain English:* what broke, in human terms.
   - *Where it broke:* file, line and the offending code.
   - *The fix:* a command or patch, its safety rating, and why it works.
4. **Second opinion (optional):** If confidence is low, or they want more, they ask the LLM they've connected with their own API key. Secrets are redacted first and the answer is evidence-checked.
5. **Outcome:** The developer fixes the error in under a minute without leaking secrets or running something destructive.

## Inspiration & Identity
* **Aesthetic:** High-contrast developer terminal look (dark slate palette, monospace accents, emerald/amber/rose status colors, violet for the connected LLM).
* **Energy:** Fast, calm and honest, like Raycast or Linear.
* **References:** [Raycast](https://raycast.com), [Vercel](https://vercel.com).

## Why This Matters to the Learner
To practice spec-driven agentic development end to end, and to build an AI feature the responsible way: local-first, privacy-preserving, and verified rather than trusted blindly.

## What "Working" Looks Like
A developer opens the app, pastes a Python `KeyError` or Node `Cannot find module` trace (or clicks a sample), and within a fraction of a second sees:
1. The environment badge and the engine's confidence.
2. A plain-language explanation.
3. The fault line, plus "N/N claims found in your trace".
4. A copyable command with a safety rating and a suggested patch.
For an unrecognized error (the Rust sample), the card says the local rules have nothing reliable and offers to ask the connected LLM, with a preview of the redacted text that will be sent.

## The POC Boundary (What's In)
* Browser-only web app (Vite + React + Tailwind CSS), no backend.
* Local rule-based engine for Python, Node.js, Git, Docker, CORS and shell errors, with confidence levels.
* Evidence check and command safety check on every diagnosis.
* Optional "Connect any LLM" feature: the user enters their own model name and API key (Anthropic, OpenAI, Gemini, OpenRouter, Groq, or a custom OpenAI-compatible base URL such as a local Ollama server). The key is kept in the browser, the provider is detected from the key prefix or base URL, secret redaction has a preview, and the model's answer goes through the same checks as the local report.
* 7 sample errors, including a secret-leak demo and an error only a connected LLM can handle.

## Later (Post-POC)
* CLI companion (`errorspeak run "npm start"`) that triages failures automatically.
* VS Code / Cursor extension.
* Team knowledge base of resolved errors.

## Explicitly Cut
* **User accounts / authentication:** unnecessary for a proof of concept.
* **A hosted backend or proxy for the AI call:** keys would have to pass through our server; bring-your-own-key in the browser keeps the user in control.
* **Running fixes automatically:** the user always reads and copies the command themselves.
