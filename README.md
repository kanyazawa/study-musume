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

## 次の改善候補

- `App.jsx` の責務分割
- Firebase 設定の `.env` 化
- 不要ファイルと試作コードの整理
- Vitest による `utils` テスト追加
