# Noa Chat Ops Guide

ノア会話AIを公開前後に確認するときの最小運用メモです。

## 1. 必要な環境変数

最低限どちらか片方を設定します。

```bash
OPENAI_API_KEY=...
OPENAI_CHAT_MODEL=gpt-5-nano
```

```bash
GEMINI_API_KEY=...
GEMINI_CHAT_MODEL=gemini-2.5-flash-lite
```

会話制御用:

```bash
CHAT_ENABLED=true
CHAT_GATEWAY_COOLDOWN_MS=2500
```

補足:

- `CHAT_ENABLED=false` で会話機能を一括停止できます
- `CHAT_GATEWAY_COOLDOWN_MS` は API入口の最小クールダウンです

## 2. ローカル開発での確認先

- Vite 開発時の会話API: `http://localhost:5173/api/chat`
- Cloudflare Worker 側の本番URLを使うなら `https://<your-worker>.workers.dev/api/chat`
- Netlify なら `https://<your-site>.netlify.app/.netlify/functions/chat`

## 3. PowerShell での手動確認

変数を先に置く:

```powershell
$chatUrl = "http://localhost:5173/api/chat"
$anonId = "manual-checker"
```

まずはスモークチェックを 1 コマンドで回しても大丈夫です。

```bash
npm run chat:check
```

ローカルだけで動作確認したいとき:

```bash
npm run chat:check -- --local-worker
```

これは `worker/index.js` を直接叩くので、開発サーバーや実APIキーなしでも
入口制御、危険入力ブロック、クールダウンの確認に使えます。

本番URLを直接見るとき:

```bash
npm run chat:check -- --url https://<your-worker>.workers.dev/api/chat
```

停止確認だけしたいとき:

```bash
npm run chat:check -- --expect-disabled --url https://<your-worker>.workers.dev/api/chat
```

通常会話:

```powershell
Invoke-RestMethod -Method Post -Uri $chatUrl -ContentType "application/json" -Body (@{
  message = "今日はちょっと疲れた"
  anonymousId = $anonId
  recentMessages = @()
} | ConvertTo-Json)
```

危険入力ブロック:

```powershell
Invoke-RestMethod -Method Post -Uri $chatUrl -ContentType "application/json" -Body (@{
  message = "死にたい"
  anonymousId = "$anonId-blocked"
} | ConvertTo-Json)
```

個人情報系ブロック:

```powershell
Invoke-RestMethod -Method Post -Uri $chatUrl -ContentType "application/json" -Body (@{
  message = "LINE交換しよう"
  anonymousId = "$anonId-pii"
} | ConvertTo-Json)
```

入口クールダウン確認:

```powershell
$body = @{
  message = "こんにちは"
  anonymousId = "$anonId-cooldown"
} | ConvertTo-Json

Invoke-RestMethod -Method Post -Uri $chatUrl -ContentType "application/json" -Body $body
Invoke-RestMethod -Method Post -Uri $chatUrl -ContentType "application/json" -Body $body
```

期待:

- 1回目は成功
- 2回目は `chat_cooldown` を含むエラー

## 4. 停止確認

デプロイ先で `CHAT_ENABLED=false` にして再デプロイ後、次を確認します。

```powershell
Invoke-RestMethod -Method Post -Uri $chatUrl -ContentType "application/json" -Body (@{
  message = "こんにちは"
  anonymousId = "$anonId-disabled"
} | ConvertTo-Json)
```

期待:

- `503`
- `code: chat_disabled`

`Invoke-RestMethod` だと 4xx / 5xx は例外扱いになるので、必要なら `Invoke-WebRequest` で `StatusCode` も見ます。

```powershell
$response = Invoke-WebRequest -Method Post -Uri $chatUrl -ContentType "application/json" -Body (@{
  message = "こんにちは"
  anonymousId = "$anonId-disabled"
} | ConvertTo-Json) -SkipHttpErrorCheck

$response.StatusCode
$response.Content
```

## 5. ログで見る項目

会話APIは `[NoaChat]` で JSON ログを出します。

見る項目:

- `transport`
- `stage`
- `inputLength`
- `blocked`
- `safetyCategory`
- `provider`
- `model`
- `usage.totalTokens`
- `error`
- `code`
- `statusCode`

代表例:

- 停止時: `code = chat_disabled`
- 入口クールダウン: `code = chat_cooldown`
- 安全ブロック: `blocked = true`
- 例外: `stage = exception`

## 6. 公開前の最低確認

- 普通の雑談で返る
- 危険入力で安全返答になる
- 個人情報系でブロックされる
- 入口クールダウンが効く
- 1日の利用上限がフロントで効く
- 音声OFF時に自動再生しない
- 停止フラグが効く

詳細チェックは [noa-chat-release-checklist.md](/C:/Users/Hide2/.gemini/study-musume/docs/noa-chat-release-checklist.md) を使ってください。
