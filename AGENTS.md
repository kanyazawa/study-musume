# AGENTS.md

Project-specific guidance for Codex and similar coding agents working in `study-musume`.

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
