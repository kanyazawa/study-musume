# Study Musume

学習記録、ストーリー、キャラクター交流、ガチャ、レビュー機能をまとめた React + Vite ベースの学習アプリです。Web アプリを中心にしつつ、Capacitor 経由で Android アプリとしても扱える構成になっています。

## 技術スタック

- React 19
- Vite 7
- React Router
- Firebase Authentication / Firestore
- Three.js / React Three Fiber / VRM
- Tailwind CSS 関連ユーティリティ
- Capacitor Android

## 開発環境の起動

前提:

- Node.js 20 以上を推奨
- npm

依存関係のインストール:

```bash
npm install
```

開発サーバー起動:

```bash
npm run dev
```

本番ビルド:

```bash
npm run build
```

Lint:

```bash
npm run lint
```

プレビュー:

```bash
npm run preview
```

## 主要ディレクトリ

```text
study-musume/
├─ src/                    アプリ本体
│  ├─ assets/              画像・音声・動画
│  ├─ components/          再利用コンポーネント
│  ├─ contexts/            React Context
│  ├─ data/                実績、ミッション、ストーリーなどの静的データ
│  ├─ firebase/            認証、同期、ランキング、友達機能
│  ├─ pages/               画面単位のコンポーネント
│  ├─ scenarios/           CSV シナリオ
│  ├─ utils/               保存、回復、通知などのロジック
│  ├─ App.jsx              ルーティングとアプリ全体の制御
│  └─ main.jsx             エントリーポイント
├─ public/                 配信用の静的ファイル
├─ android/                Capacitor Android プロジェクト
├─ dist/                   Vite ビルド成果物
├─ docs/                   補助スクリプトや資料
├─ novel-prototype/        旧プロトタイプ
└─ *.py                    画像処理用の補助スクリプト
```

## アプリの主要機能

- 学習画面と会話シーン
- キャラクター選択と交流
- ストーリー閲覧
- ガチャ、所持アイテム、ミッション
- カレンダーと統計表示
- Firebase ログインとセーブ同期
- VRM モデル表示

## Firebase 設定

Firebase 設定は [src/firebase/config.js](/C:/Users/Hide2/.gemini/study-musume/src/firebase/config.js) から `import.meta.env` を参照します。ローカル開発では `.env` を作成し、ひな形として [.env.example](/C:/Users/Hide2/.gemini/study-musume/.env.example) を使ってください。

想定する環境変数例:

```bash
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

`.env.example` をコピーして `.env` を作成:

```bash
Copy-Item .env.example .env
```

## Android アプリとして使う場合

Capacitor 設定は [capacitor.config.ts](/C:/Users/Hide2/.gemini/study-musume/capacitor.config.ts) にあります。Web 側をビルドしてから Android 側へ同期します。

ビルド:

```bash
npm run build
```

Android プロジェクトへ反映:

```bash
npx cap sync android
```

Android Studio で開く:

```bash
npx cap open android
```

## デプロイ

Netlify 用の SPA リダイレクト設定が [netlify.toml](/C:/Users/Hide2/.gemini/study-musume/netlify.toml) にあります。`/* -> /index.html` へリダイレクトする構成です。

## 現状の注意点

- `src/components/game-ui-design/` は現行本体とは別の UI 試作コードが含まれています。
- `novel-prototype/` は本体と別系統のプロトタイプです。
- 画像処理用の Python スクリプトはフロントエンド本体の実行には不要です。
- テスト基盤はまだ未整備です。

## スプレッドシート授業データと読み上げ

`Dialogue` 画面では Google スプレッドシートの CSV を読み込み、通常行は自動で読み上げます。授業データ側では最低限 `scene`, `id`, `speaker`, `text` があれば動きます。

追加で使える列:

- `tts`: `off`, `false`, `0` を入れるとその行だけ自動読み上げを止めます
- `tts_speaker`: speaker ID、`話者名`、`話者名 / スタイル名` を指定できます
- `tts_pitch`: ブラウザTTSのピッチを数値で上書きします
- `tts_rate`: ブラウザTTSの速度を数値で上書きします

`voice` 列はこれまで通り `public/audio` 配下の音声ファイル再生に使われます。`text` にカンマや改行を含む場合も、CSV のクオート付きセルでそのまま扱えます。

### AivisSpeech を事前音声化してスマホで使う

スマホ本番ではブラウザTTSより、AivisSpeech で先に音声ファイルを書き出して `voice` 列で再生する方が自然で安定します。

前提:

- AivisSpeech Engine を起動して `http://127.0.0.1:10101` で待ち受ける
- CSV に `text` 列がある
- できれば `voice` 列と `tts_speaker` 列も用意する

`tts_speaker` には次のどちらでも書けます。

- `話者名`
- `話者名 / スタイル名`

例:

- `まお`
- `まお / ノーマル`

音声生成プレビュー:

```bash
npm run tts:aivis -- --input src/scenarios/chem_scenario.csv --dry-run
```

音声生成して `voice` 列つき CSV も出力:

```bash
npm run tts:aivis -- --input src/scenarios/chem_scenario.csv --write-csv tmp/chem_scenario.with-voice.csv
```

特定シーンだけ生成:

```bash
npm run tts:aivis -- --input src/scenarios/chem_scenario.csv --sheet be_sentence_01
```

補足:

- 音声は `public/audio/tts-generated/...` に `.wav` で出力されます
- `voice` 列には `tts-generated/...` の相対パスが入ります
- `voice` 列が埋まった行は `Dialogue` でTTSより先に再生されるため、スマホでも同じ声を使えます
- `--overwrite` を付けると既存の `voice` 列があっても再生成します
- `--fallback-speaker "まお / ノーマル"` で `tts_speaker` が空欄の行の既定話者を変えられます

シート記入ルールの簡易ガイドは [docs/tts-sheet-guide.md](/C:/Users/Hide2/.gemini/study-musume/docs/tts-sheet-guide.md) にまとめています。

ホーム右上メニューの `設定` から `TTSエンジン設定` を開くと、以下を切り替えられます。

- `AivisSpeech`
- `VOICEVOX`
- `ブラウザTTS`
- `自動判定`

接続先URL、優先話者、ブラウザTTSのピッチと速度も保存されます。AivisSpeech を使う場合は通常 `http://127.0.0.1:10101` を指定します。

## 次の改善候補

- `App.jsx` の責務分割
- Firebase 設定の `.env` 化
- 不要ファイルと試作コードの整理
- Vitest による `utils` テスト追加
