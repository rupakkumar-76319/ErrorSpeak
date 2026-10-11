---
doc: spec
status: approved
---

# ErrorSpeak — Technical Specification

## How This Works, In Plain Language
ErrorSpeak is a fast, CPU-native web application built with React and Tailwind CSS. When a user pastes a terminal error or selects a preset, the application runs a local pattern-matching and triage engine. It extracts the runtime environment, error category, offending line, severity score, and generates a formatted remediation card with a 1-click copyable shell command. An optional cloud LLM API endpoint can be enabled via `.env`, but the core system functions 100% locally with zero latency, zero GPU dependencies, and zero cost.

## The Core Journey Through the System
1. **Selection:** User clicks a preset button in `PresetRibbon` or types into `TerminalInput`.
2. **Analysis Trigger:** `TerminalInput` passes the raw string to `engine/parser.js`.
3. **Parsing:** The parser tests the error string against runtime heuristics (Python traceback regex, Node.js module/stack regex, Docker error codes, Git conflict markers).
4. **State Update:** The extracted `TriageReport` object updates application state in `App.jsx`.
5. **Render:** `TriageCard.jsx` renders the plain-English translation, fault line highlight, severity badge, and copyable terminal command.
6. **Action:** User clicks "Copy Fix Command", triggering a clipboard copy and confetti/success indicator.

## Stack
* **Build Tool:** [Vite](https://vitejs.dev/) — ultra-fast CPU bundling with instant hot module replacement.
* **UI Framework:** [React 18/19](https://react.dev/) — reactive state management and component architecture.
* **Styling:** [Tailwind CSS](https://tailwindcss.com/) — modern developer dark-mode styling with zero CSS overhead.
* **Icons:** [Lucide React](https://lucide.dev/) — crisp developer iconography.
* **Feedback:** [Canvas Confetti](https://www.npmjs.com/package/canvas-confetti) — instant delight upon copying the verified fix.

## Where It Runs and How Someone Tries It
* **Runtime:** Local Node.js environment (`node v22.14.0`).
* **Start Command:**
  ```bash
  npm run dev
  ```
* **Browser Access:** Opens at `http://localhost:5173`.
* **Hardware Profile:** 100% CPU execution. No GPU requirements.

## Look and Feel
* **Palette:** Slate-950 (`#020617`) background, Slate-900 (`#0f172a`) cards, Slate-800 borders.
* **Accents:** Cyan-400 (`#22d3ee`) for AI scanner, Emerald-400 (`#34d399`) for verified fixes, Rose-400 (`#fb7185`) for error lines.
* **Fonts:** Monospace for terminal code and stack traces; clean Inter-style sans-serif for diagnosis.

## Components
Implements `prd.md > Screens and Layout`.

### `Header.jsx`
Displays the ErrorSpeak branding, "CPU-Native Local Engine" badge, and link to GitHub repository.
PRD ref: `prd.md > Screens and Layout`.

### `PresetRibbon.jsx`
Renders 5 one-click sample error scenarios across Python, Node.js, Git, Docker, and Web. Clicking an item dispatches it immediately to the input.
PRD ref: `prd.md > Error Ingestion & Detection`.

### `TerminalInput.jsx`
Monospace terminal editor with line numbers, paste actions, clear button, and an active analyze trigger.
PRD ref: `prd.md > Error Ingestion & Detection`.

### `TriageCard.jsx`
Displays the structured diagnostic report: environment badge, severity meter, plain-English explanation, fault line locator, and 1-click copyable remediation shell command.
PRD ref: `prd.md > Remediation Action Card`.

## Data Model
```typescript
interface TriageReport {
  id: string;
  environment: "Python" | "Node.js" | "Git" | "Docker" | "Web / Network";
  errorName: string;
  severity: number; // 1 to 10
  location: string; // e.g. "server.js:42" or "N/A"
  plainExplanation: string;
  rootCause: string;
  fixCommand: string;
  whyItWorks: string;
  diffBefore?: string;
  diffAfter?: string;
}
```

## File Structure
```
M:\build-with-ai-project\
├── devpost/
│   ├── learner-profile.md
│   ├── scope.md
│   ├── prd.md
│   ├── spec.md
│   └── checklist.md
├── src/
│   ├── components/
│   │   ├── Header.jsx
│   │   ├── PresetRibbon.jsx
│   │   ├── TerminalInput.jsx
│   │   └── TriageCard.jsx
│   ├── engine/
│   │   ├── parser.js
│   │   └── presets.js
│   ├── App.jsx
│   ├── index.css
│   └── main.jsx
├── index.html
├── package.json
├── vite.config.js
└── tailwind.config.js
```

## External Services and Dependencies
* Core functionality has **zero mandatory external cloud dependencies**.
* Optional: Gemini Flash / OpenRouter API endpoint if user supplies `VITE_AI_API_KEY` in `.env`.

## Important Failure Modes
* **Unrecognized Input:** Falls back to generic heuristic analysis with friendly advice.
* **Empty Input:** Shows interactive placeholder prompt with guide hints.

## What Was Simplified and Why
* **Client-Side Parser instead of heavy local LLM:** Runs instantaneously on standard CPU, zero RAM spikes, zero GPU setup needed, and ensures 100% uptime for video recording.

## Decisions and Open Issues
* Agreed to build a standalone, browser-based developer dashboard for optimal demo video recording and visual appeal.
