# AI Rules

`study-musume` で AI に作業を頼むときの共通ルール。
ここには `repo全体の作業制約` と `返し方` を書く。

## 役割

- AI にどこまで触ってよいかを伝える
- JSX / CSS / React の変更範囲を固定する
- 出力のしかたをそろえる

## 編集ルール

- 1回で複数ファイルを大きく触らない
- 指定されたファイルを優先して触る
- 既存 class 名は変えない
- JSX 構造はなるべく壊さない
- コメントは勝手に消さない

## React Rules

- functional component only
- hooks は既存構造を維持する
- import 順を崩しすぎない
- return 構造を大きく変えない

## CSS Rules

- kebab-case
- 既存 class 優先
- utility class の乱用禁止

## デバッグ時の扱い

- 原因分析だけしてほしい場合は `04_DEBUG/DEBUG_RULES.md` に寄せる
- 実装禁止のデバッグ依頼では、すぐ修正せず原因候補を先に出す

## docs 更新ルール

- `PROJECT_STATUS.md` と `TODO.md` は、ユーザーが毎回手で更新する前提にしない
- AI が実装を進めた結果、区切りのよい完了が出たら自動で更新する
- 例:
  - Home の主要目的が1つ完了した
  - `selectedHeroineId` のような保存方針が決まった
  - TODO の項目を完了へ移せる
  - 次にやるべきことが変わった
- ただし、調査途中や仮置き段階では無理に更新しない

## マルチAI運用

- 複数AIを使う場合は、まず `MULTI_AI_WORKFLOW.md` を参照する
- 役割別のコピペ用テンプレは `AI_ROLE_PROMPTS.md` を使う
- 同じファイルを同時に複数AIへ触らせすぎない
- 最後の統合判断は1つのAIに寄せる
- 標準フローは `Claude Code 実装 -> Codex レビュー -> Claude Code 修正 -> Codex 再チェック -> Codex commit`

## 出力ルール

- 変更理由を最初に説明する
- 最後に diff 要約を書く
- エラー原因を明示する
