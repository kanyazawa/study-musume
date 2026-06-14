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

## Terminal-First AI Workflow

- この repo の正規作業場所は `C:\dev\study-musume` とする。
- `C:\Users\Hide2\.gemini\study-musume` などの退避コピーは、参照や保険としては残してよいが、ふだんの実装先として使わない。
- AI は作業開始時に、可能なら `cwd` が `C:\dev\study-musume` になっている前提で進める。
- 作業の節目では `git status --short --branch` を見て、意図しない差分や作業場所の取り違えを先に防ぐ。
- ターミナル操作は `1コマンドずつ実行` を基本にする。複数コマンドを1行に連結した提案は避ける。

### Recommended Session Flow

- 毎回の開始手順:
  - `cd C:\dev\study-musume`
  - `git status --short --branch`
- 実装担当AIは `コード変更 -> 必要なテスト or 起動確認 -> 変更内容の要約` までを担当する。
- レビュー担当AIは `git diff` や commit 差分を見て、`バグ / 回帰 / 足りないテスト / 命名や責務の崩れ` を優先して指摘する。
- 指摘修正後に、別AIまたは同じレビュー担当AIで再チェックする。
- 問題なければ `Codex` 側で `commit` と `push` を行う。

### Role Boundaries

- 実装AI:
  - 主に `src/`, `functions/`, `netlify/`, `docs/StudyMusume/` を触る
  - build, test, dev server の確認まで行ってよい
- レビューAI:
  - 原則として修正せず、差分レビューに集中する
  - 抽象論より `壊れる箇所`, `確認不足`, `行動レベルの修正提案` を優先する
- commit担当AI:
  - `git status` が意図通りか確認してから commit する
  - 退避コピーや無関係ファイルを巻き込まない

### Safety Rules

- `npm run dev` や長い diff 出力の最中に、次のコマンドを続けて貼らない。
- pager が開いたら、抜けてから次のコマンドを実行する。
- 変な未追跡ファイルや一時ファイルが出たら、いきなり消さずに中身を確認してから扱う。
- 退避コピーから救出するときは、まず branch や commit を作ってから取り込む。
- 迷ったら `場所を固定して、差分を見て、レビューしてから push` を優先する。

## Required Read Order

- AI は作業開始時に、まず次を確認する:
  - `AGENTS.md`
  - `docs/StudyMusume/00_CORE/AI_RULES.md`
  - `docs/StudyMusume/00_CORE/PROJECT_STATUS.md`
  - `docs/StudyMusume/00_CORE/TODO.md`
- UI を触るときは追加で `docs/StudyMusume/01_UI/UI_RULES.md` を確認する。
- デバッグや原因調査が主目的のときは追加で `docs/StudyMusume/04_DEBUG/DEBUG_RULES.md` を確認する。
- 複数AI運用の進め方や役割分担を使うときは `docs/StudyMusume/00_CORE/MULTI_AI_WORKFLOW.md` と `docs/StudyMusume/00_CORE/AI_ROLE_PROMPTS.md` も確認する。
- これらを読まずに広い範囲を変更しない。まず現在地と制約を合わせてから実装に入る。

## UI Generation Preferences

- The user often uses v0 only as a rough layout generator, then pastes the result into this repo.
- When helping with UI generation prompts, default to **simple wireframe output**, not polished design output.
- Default workflow is **layout first, visual polish second**. First decide placement and information hierarchy, then generate button/card styling with AI afterward.
- Prefer **single-file output** whenever possible.
- Avoid suggesting or generating project scaffolding such as Next.js app structure, `components/`, `hooks/`, `lib/`, `styles/`, or config files unless the user explicitly asks for them.
- Prefer **minimal code that is easy to copy and paste** over reusable abstractions.
- Prefer **layout and structure first**. Do not add decorative styling unless requested.
- Prefer **low-information-density UI**. Default to fewer labels, fewer helper sentences, and fewer explanatory blocks.
- Favor UI that feels **understandable at a glance**. Prefer recognition by placement, icon, grouping, and contrast instead of explaining everything with text.
- For new social-game-like pages, default to this fixed composition unless the user says otherwise:
  - **school classroom background**
  - **character face or upper body visible in the upper area**
  - **main UI controls collected in a lower panel / bottom sheet**
  - **mobile portrait layout first**
- In the first pass, treat buttons, cards, and badges as **plain placeholder blocks**. Do not over-design them before the layout is approved.
- If the user asks for a prompt for v0, bias toward:
  - one file only
  - no file splitting
  - no shadcn/ui
  - no external libraries
  - no state management unless required
  - no long explanations or file trees
  - classroom background frame
  - visible character area at the top
  - social-game-style bottom control area
  - placeholder visuals only for buttons and cards

## Preferred v0 Workflow

- For v0 prompt help, default to requesting:
  - simple HTML wireframes when the user only wants structure
  - minimal JSX only when the user wants something directly portable into this repo
- For page generation, prefer a **2-step workflow**:
  - Step 1: layout-only wireframe with placeholder panels and buttons
  - Step 2: AI-assisted pass for button, card, and decorative styling
- If v0 output is too large or too fragmented, help the user reduce it to a single copy-pasteable block.
- If the user shares HTML from v0, prefer converting it into a minimal React/Vite-friendly component for this repo.
- Point the user to `docs/v0-ui-prompt-template.md` for the default prompt wording when relevant.

## study-musume Implementation Bias

- This repo is a React + Vite app, not a Next.js app.
- Do not assume App Router, shadcn/ui, or multi-file component architecture unless the user explicitly wants that.
- For prototype pages such as `MissionsPageV0.jsx`, prefer a **single-file, easy-to-read JSX implementation**.
- Inline styles are acceptable for quick wireframe/prototype pages when that keeps the output simple.
- For brand-new wireframe pages, prefer starting from `src/pages/_PageV0Template.jsx`.
- When generating a rough prototype, preserve obvious slots for:
  - classroom background
  - character face / bust shot
  - page title
  - tab or filter row
  - main content list / cards
  - bottom action buttons

## Mobile Scene UI Notes

- For smartphone-first scene pages, prioritize **a stable composition**:
  - background scene
  - character layer
  - speech bubble / hero panel
  - bottom control sheet
- For scene pages with a visible character face, treat the face area as a **default safe zone**. UI should avoid overlapping the face unless the user explicitly wants intentional overlap.
- Keep the **entire screen light**. If the same context is already clear from tabs, footer nav, icons, grouping, or the scene itself, remove redundant titles, stat summaries, helper labels, and explanatory text instead of stacking more UI.
- When unsure, choose **less text**. One short label is better than a title plus subtitle plus helper sentence.
- Avoid screens that explain the UI in prose. The first impression should be understandable mostly from layout and affordances.
- Avoid adding a top-left back button when the same navigation is already available in a persistent footer or tab bar.
- If a footer already contains the same destination or action, do not repeat that button in the upper area. Avoid duplicate navigation/actions across top and bottom regions.
- Do not add white fog, white haze, or heavy wash overlays over the classroom background unless the user explicitly asks for them.
- For speech bubbles on mobile, prefer **narrower width and taller height** over wide banners.
- The character should visually sit **above the background and behind the speech bubble**, and in-frame details like hats or hair ornaments should not look awkwardly cropped.
- Prefer moving the UI away from the face before moving the character. Keep character composition stable and solve collisions with panel/speech placement first.
- Avoid page-level scrolling when possible, but do not freeze the whole screen so hard that the main content becomes unscrollable. Prefer **fixed outer frame + internal scroll only in the lower workspace**.

## Live2D Positioning Notes

- When adjusting Live2D placement, keep the overall layout fixed and change **only the character position** unless the user asks for a larger composition change.
- Across this repo, a common problem is that the **Live2D drawing area is too short on scene pages**, so lower body / legs can get cropped even when the model scale itself is fine.
- When the Live2D model looks cut off, **check the character layer height and viewport first before changing model scale**. Prefer expanding the visible drawing region over shrinking the character.
- For this project, if the request is "show more of the body without making the character smaller", prefer:
  - increasing the page-level Live2D container height
  - reducing or removing page-specific bottom gap clipping
  - extending the Live2D viewport upward first so the bottom anchor stays visually stable
  - keeping the model's perceived size and pose composition as unchanged as possible
- For quick nudges, prefer changing `--live2d-viewer-transform` in the page CSS first.
- If the Live2D model appears visually "stuck", also check `src/components/character/Live2DViewer.jsx` and `src/utils/live2dModelRegistry.js`:
  - `Live2DViewer.jsx` must not hard-code `transform: none` if page-level positioning is expected.
  - `live2dModelRegistry.js` `stage` / `stageOverrides` can override the apparent position and scale even when CSS changes exist.
- If one screen has cropped Live2D, do **not** assume it is isolated to that page. Compare the character-layer CSS with other scene pages such as `Home`, `Dialogue`, `StudySelect`, `ReviewQuiz`, and `MultiplayerMatch`, because this repo tends to repeat the same narrow drawing-box pattern.
- Keep static-image fallback positioning in sync with Live2D adjustments so both renderers produce roughly the same composition.
- During character-position iteration, make **one-axis or one-ratio changes at a time**. Small directional requests like "right a bit" or "right:down = 1:3" should be handled as minimal deltas, not full re-layouts.
- When building new scene pages, assume a reusable **face safe zone overlay/constraint** may be needed so speech bubbles and upper UI can stay clear of the character face across all scenes.

## Communication Preferences

- Keep prompt suggestions short, practical, and copy-pasteable.
- When the user asks for “the best” prompt, provide one strong default instead of many variants.
- Favor simplicity over flexibility unless the user asks for options.
