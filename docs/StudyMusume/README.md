# StudyMusume Docs

`study-musume` 専用の仕様・進行メモの入口。
まずは `00_CORE` を見て、必要に応じて UI / SYSTEMS / CHARACTERS へ降りる。

## まず見る場所

- `00_CORE/PROJECT_STATUS.md`
  - 今どこを作っているか
- `00_CORE/TODO.md`
  - 直近で何をやるか
- `00_CORE/ROADMAP.md`
  - 中期の流れ
- `00_CORE/MULTI_AI_WORKFLOW.md`
  - 複数AIで進めるときの基本運用
- `01_UI/UI_RULES.md`
  - UI の基本方針
- `02_SYSTEMS/GAME_SYSTEMS.md`
  - システムの総論

## フォルダマップ

### 00_CORE

- `AI_RULES.md`
- `AI_ROLE_PROMPTS.md`
- `EMMA_MVP_IMPLEMENTATION.md`
- `MULTI_AI_WORKFLOW.md`
- `PROJECT_STATUS.md`
- `ROADMAP.md`
- `TODO.md`

### 01_UI

- `UI_RULES.md`
- `UI_PROMPTS.md`
- `MOBILE_LAYOUTS.md`

### 02_SYSTEMS

- `GAME_SYSTEMS.md`
- `ENGLISH_SYSTEM.md`
- `RELATIONSHIP_SYSTEM.md`
- `GACHA_SYSTEM.md`
- `TUTORIAL_SYSTEM.md`
- `TUTORIAL_SCRIPT_EMMA.md`

### 03_CHARACTERS

- `TAKASE_EMMA.md`

### 04_DEBUG

- `DEBUG_RULES.md`
- `KNOWN_BUGS.md`
- `ERROR_LOG.md`
- `FIX_HISTORY.md`

### 05_SNS

- `SNS_STRATEGY.md`
- `X_POSTS.md`
- `TIKTOK_IDEAS.md`
- `CONTENT_PLAN.md`

### 06_WORLD

- `WORLD_RULES.md`
- `STORY_STRUCTURE.md`
- `EVENTS.md`
- `ENDINGS.md`

### 07_MARKETING

- `TARGET_USERS.md`
- `MONETIZATION.md`
- `KPI.md`
- `RELEASE_PLAN.md`

### 08_ASSETS

- `ART_STYLE.md`
- `LIVE2D_RULES.md`
- `UI_ASSETS.md`
- `AUDIO.md`

### 98_DAILY_LOG

- `DAILY_LOG_2026_05.md`
- `DEVELOPMENT_NOTES.md`

### 99_ARCHIVE

- `OLD_MEMOS.md`
- `UNUSED_IDEAS.md`
- `LEGACY_SYSTEMS.md`

## Vault 外の参照資料

この Vault は `docs/StudyMusume` 配下を中心に整理している。
下の資料は repo 全体の `docs/` にあり、必要なときに参照する。

- `docs/amagami-direction.md`
- `docs/v0-ui-prompt-template.md`
- `docs/grammar-lesson-rules.md`
- `docs/tts-sheet-guide.md`
- `docs/noa-chat-ops.md`
- `docs/noa-chat-release-checklist.md`
- `docs/app-store-release-checklist.md`
- `docs/play-release-checklist.md`
- `docs/cloudflare-pages-deploy.md`
- `docs/ios-quickstart.md`
- `docs/ios-native-auth-plan.md`
- `docs/ios-sign-in-with-apple-plan.md`
- `docs/live2d-setup.md`
- `docs/live2d-guide-psd-workflow.md`

## 運用メモ

- AI の repo 全体ルールはルートの `AGENTS.md`
- `StudyMusume` 内では、区切りのよい完了が出たら AI が `PROJECT_STATUS` と `TODO` を自動更新する
- 複数AIを使うときの既定フローは `Claude Code 実装 -> Codex レビュー -> Claude Code 修正 -> Codex 再チェック -> Codex commit`
- ユーザーが毎回手で書く前提にはしない
- 古いメモ名との対応は `99_ARCHIVE/OLD_MEMOS.md` を見る
