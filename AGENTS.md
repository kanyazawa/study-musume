# AGENTS.md

Project-specific guidance for Codex and similar coding agents working in `study-musume`.

## UI Generation Preferences

- The user often uses v0 only as a rough layout generator, then pastes the result into this repo.
- When helping with UI generation prompts, default to **simple wireframe output**, not polished design output.
- Prefer **single-file output** whenever possible.
- Avoid suggesting or generating project scaffolding such as Next.js app structure, `components/`, `hooks/`, `lib/`, `styles/`, or config files unless the user explicitly asks for them.
- Prefer **minimal code that is easy to copy and paste** over reusable abstractions.
- Prefer **layout and structure first**. Do not add decorative styling unless requested.
- If the user asks for a prompt for v0, bias toward:
  - one file only
  - no file splitting
  - no shadcn/ui
  - no external libraries
  - no state management unless required
  - no long explanations or file trees

## Preferred v0 Workflow

- For v0 prompt help, default to requesting:
  - simple HTML wireframes when the user only wants structure
  - minimal JSX only when the user wants something directly portable into this repo
- If v0 output is too large or too fragmented, help the user reduce it to a single copy-pasteable block.
- If the user shares HTML from v0, prefer converting it into a minimal React/Vite-friendly component for this repo.

## study-musume Implementation Bias

- This repo is a React + Vite app, not a Next.js app.
- Do not assume App Router, shadcn/ui, or multi-file component architecture unless the user explicitly wants that.
- For prototype pages such as `MissionsPageV0.jsx`, prefer a **single-file, easy-to-read JSX implementation**.
- Inline styles are acceptable for quick wireframe/prototype pages when that keeps the output simple.

## Communication Preferences

- Keep prompt suggestions short, practical, and copy-pasteable.
- When the user asks for “the best” prompt, provide one strong default instead of many variants.
- Favor simplicity over flexibility unless the user asks for options.
