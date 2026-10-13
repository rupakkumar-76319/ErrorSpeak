# ⚡ ErrorSpeak

> **Intelligent Terminal Triage & Stack Trace Auto-Remediation Studio**  
> *Built for the Devpost "Build With AI: Basics" Global Hackathon.*

[![License: MIT](https://img.shields.io/badge/License-MIT-emerald.svg)](https://opensource.org/licenses/MIT)
[![Devpost](https://img.shields.io/badge/Devpost-Challenge%20Submission-blue.svg)](https://learn-ai-basics.devpost.com/)
[![Engine](https://img.shields.io/badge/Engine-100%25%20CPU--Native-cyan.svg)](#architecture)
[![Triage Speed](https://img.shields.io/badge/Latency-%3C100ms-purple.svg)](#how-it-works)

---

## 🎯 The Problem
Every developer remembers staring at an overwhelming 50-line terminal stack trace late at night. For beginners and junior developers, cryptic runtime crashes (Python `KeyError`, Node.js `MODULE_NOT_FOUND`, Git merge conflicts, Docker `OOMKilled`) create friction and waste hours in trial-and-error debugging.

## 🚀 The Solution
**ErrorSpeak** acts as an instant diagnostic flight cockpit for terminal output:
1. **Auto-Detects Environment:** Recognizes Python, Node.js, Git, Docker, and Web CORS errors on input.
2. **Plain-English Translation:** Translates intimidating compiler dumps into clear, human-understandable terms.
3. **Fault Line Pinpoint:** Highlights the exact file, line number, and offending code snippet.
4. **1-Click Shell Fix:** Provides a copyable terminal command with a plain-English explanation of *why* the fix works.
5. **Zero Cloud Latency:** 100% CPU-native local heuristic engine—no heavy GPU models, no paid API tokens, and offline resilience.

---

## 🛠️ Tech Stack & Architecture

- **UI Framework:** [React 18](https://react.dev/)
- **Build Tool:** [Vite](https://vitejs.dev/) (Sub-second cold start and HMR)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/) (Carbon dark-mode developer theme)
- **Icons:** [Lucide React](https://lucide.dev/)
- **Visual Delight:** Canvas Confetti

### Spec-Driven Agentic Development
This project was designed and built from scratch using the **Devpost Learn Skill Pack** (`challengepost/learn-ai-basics`) through flipped interaction:
- 📋 [**Scope Document**](devpost/scope.md) — Problem definition, core loop, and POC boundary.
- 📐 [**Product Requirements (PRD)**](devpost/prd.md) — Core user journey, screen layouts, and acceptance criteria.
- 🛠️ [**Technical Specification**](devpost/spec.md) — System architecture, data contracts, and failure modes.
- ✅ [**Build Checklist**](devpost/checklist.md) — Ordered, mechanically verified implementation slices.
- 🗺️ [**Application Map**](devpost/app-map.html) — Visual code tour and architectural reference.

---

## 🏁 Quick Start (Run Locally)

### Prerequisites
- Node.js (v18 or v20+ recommended)
- Git

### Installation
```bash
# 1. Clone repository
git clone https://github.com/rupakkumar-76319/errorspeak.git
cd errorspeak

# 2. Install dependencies
npm install

# 3. Start development server
npm run dev
```

Open **`http://localhost:5173`** in your browser.

---

## 🧪 Verification & Tests

Run the built-in deterministic parser test suite:
```bash
npm test
```

---

## 📄 License
This project is licensed under the [MIT License](LICENSE).
