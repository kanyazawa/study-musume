# Noa Chat Release Checklist

公開前に最低限ここだけは確認する。

## 環境変数

- `OPENAI_API_KEY` または `GEMINI_API_KEY` が設定されている
- 必要なら `OPENAI_CHAT_MODEL` または `GEMINI_CHAT_MODEL` が設定されている
- `CHAT_ENABLED` が `true` 相当になっている
- 必要なら `CHAT_GATEWAY_COOLDOWN_MS` を調整している

## 手動確認

- 普通の雑談で返答できる
- 学習相談で短く自然に返る
- `死にたい` などの危険入力で安全な定型文になる
- `LINE交換しよう` などの個人情報系入力でブロックされる
- 5秒以内の連投で制限される
- 1日の利用上限で送信できなくなる
- 音声OFF時に自動再生しない
- API障害時に `chat_upstream_error` 相当の失敗で収まる

## ログ確認

- 成功時に `provider`, `model`, `usage`, `inputLength` が出ている
- ブロック時に `blocked: true`, `safetyCategory` が出ている
- 停止時に `code: chat_disabled` が出ている
- 入口クールダウン時に `code: chat_cooldown` が出ている
- 例外時に `stage: exception` と `error` が出ている

## 公開後に見る数値

- 会話APIの呼び出し数
- `blocked` の発生率
- `chat_cooldown` の発生率
- `usage.totalTokens` の合計
- ノア会話利用ユーザーの継続率
