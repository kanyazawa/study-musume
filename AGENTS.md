# AGENTS.md

Project-specific guidance for Codex and similar coding agents working in `study-musume`.

## このファイルの役割

- ここは `repo全体でAIに守ってほしい作業方針` を書く場所。
- `どう実装するか`, `どう提案するか`, `何を前提にするか` のような全体ルールを置く。
- UIの細かい見た目ルールや、デバッグ用の依頼テンプレはここではなく別ファイルに置く。
- 迷ったら:
  - repo全体のAI行動なら `AGENTS.md`
  - 編集やデバッグ時の個別ルールなら `docs/StudyMusume/00_CORE/AI_RULES.md`
  - コピペして使う依頼文なら `docs/StudyMusume/00_CORE/PROMPTS.md`
  - UI設計ルールなら `docs/StudyMusume/01_UI/ui-rules.md`

## Docs Update Policy

- 実装や設計整理で `区切りのよい完了` が出たら、AI はユーザーに言われなくても `docs/StudyMusume/00_CORE/PROJECT_STATUS.md` と `docs/StudyMusume/00_CORE/TODO.md` を更新する。
- 特に次のタイミングでは自動更新を優先する:
  - 画面1つの主要目的が完成したとき
  - 保存方針や状態設計など、後戻りしにくい決定をしたとき
  - TODO の項目が完了に移せるとき
  - 次にやることが前の状態から変わったとき
- 逆に、途中の小さな試行錯誤や一時的な調査だけでは無理に更新しない。
- ユーザーが毎回手で書く前提にしない。基本は AI 側で反映する。

## Preferred Multi-AI Flow

- 複数AIを使うときの既定フローは次の順番にする:
  - `Claude Code` に実装させる
  - `Codex` に差分レビューさせる
  - `Codex` の指摘を `Claude Code` に直させる
  - 最後に `Codex` で再チェックする
  - 問題なければ `Codex` で commit する
- つまり、`実装担当` と `レビュー / 統合 / commit 担当` を分ける。
- 最終判断と docs 更新は `Codex` 側に寄せる。

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
