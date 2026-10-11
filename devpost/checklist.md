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

- [ ] **2. Diagnostic Engine & One-Click Presets**
  Becomes usable: Clicking any of the 5 presets (Python KeyError, Node Module Not Found, Git Conflict, Docker OOM, CORS) immediately parses the error and populates the structured triage model.
  Why now: The unique kernel (the triage logic) comes early, not last.
  PRD ref: `prd.md > Deterministic & AI Triage Engine`, `prd.md > The Core Journey`
  Spec ref: `spec.md > Components > PresetRibbon.jsx`, `spec.md > Data Model`
  Build: Implement engine/presets.js and engine/parser.js with regex pattern extractors for Python, Node, Git, Docker, and CORS; wire up PresetRibbon.
  Verify (mechanical): Automated node test verifying all 5 presets parse into valid TriageReport objects with non-empty rootCause and fixCommand.
  Learner check: Click each preset chip in the browser and see the input update and detection badge change.
  Commit: `feat: implement triage parser engine and 5 developer presets`

- [ ] **3. Interactive Remediation Card with 1-Click Fix & Confetti**
  Becomes usable: Full 3-part triage card appears with plain-language explanation, pinpoint fault line, copyable terminal command with visual clipboard feedback and confetti celebration.
  Why now: Closes the core loop and delivers the working POC described in scope and PRD for demo video recording.
  PRD ref: `prd.md > Remediation Action Card`, `prd.md > States and Boundaries`
  Spec ref: `spec.md > Components > TriageCard.jsx`, `spec.md > Look and Feel`
  Build: Implement TriageCard.jsx with severity meter, plain English box, fault line highlight, copy-to-clipboard button with visual feedback, and canvas-confetti celebration.
  Verify (mechanical): Test build production bundle with npm run build, verify zero errors and clean output.
  Learner check: Click "Copy Fix Command" on a diagnosed error, observe the copied clipboard state and celebration effect.
  Commit: `feat: add remediation card, 1-click copy fix, and visual feedback`

## Hands-on Checkpoints

- [ ] Early usable behavior explored — Slice 2 preset triage verified in browser
- [ ] Final kick-the-tires exploration and feedback completed

## Final Review

- [ ] Final review complete — feedback resolved and learner confirms ready to ship

## Code Tour and App Map

- [ ] Learning activity complete — guided route, focused alternative, prior practice connected, or brief recap
- [ ] Optional edit and transfer reflection addressed — offered/declined/already covered/not applicable as appropriate
- [ ] `devpost/app-map.html` generated from finished code, checked, and shown, including a project-grounded practice to reuse

Activity and evidence: [to be filled upon completion]
Route and stops: [to be filled upon completion]
Edit outcome: [to be filled upon completion]
Reflection: [to be filled upon completion]
Activity mode: [to be filled upon completion]

## Revisions
