# iOS Quickstart

最終更新: 2026-03-22

このメモは、`study-musume` を借りた Mac 上でできるだけ短時間で iPhone 実機起動するための手順です。

## 1. 先に知っておくこと

- `Mac` と `Xcode` が必要です
- 無料の Apple ID でも自分の iPhone 実機で起動確認まではできます
- 無料の Personal Team で署名したアプリは長期運用向けではありません
- App Store 公開や TestFlight 配布には Apple Developer Program が必要です
- このリポジトリはまだ `ios/` ディレクトリを持っていないので、初回に Capacitor iOS プロジェクトを生成します
- いまの Google ログイン実装は Web 向けです。iOS ネイティブアプリで安定運用するには、後で native Google Sign-In へ置き換える必要があります

## 2. 借りた Mac で最初にやること

1. Xcode をインストールする
2. ターミナルで `xcode-select --install`
3. Node.js を入れる
4. このリポジトリを Mac に置く

## 3. 最短セットアップ

プロジェクトルートで次を実行します。

```bash
bash ./scripts/prepare-ios.sh
```

このスクリプトは次をまとめて行います。

- `node`, `npm`, `xcodebuild` の存在確認
- `node_modules` がなければ `npm install`
- `@capacitor/ios` がなければ追加
- `ios/` がなければ `npx cap add ios`
- `npm run build`
- `npx cap sync ios`

## 4. Xcode で実機起動

1. `npx cap open ios`
2. Xcode で `App` ターゲットを選ぶ
3. `Signing & Capabilities` を開く
4. `Team` に自分の Apple ID の `Personal Team` または所属チームを設定する
5. `Bundle Identifier` を一意な値にする

例:

```text
com.<your-name>.studymusume
```

6. iPhone を USB 接続する
7. iPhone 側で `Developer Mode` を有効にする
8. Xcode の実行先にその iPhone を選ぶ
9. `Run` を押す

## 5. ここまでで確認できること

- アプリシェルが iPhone 実機で起動する
- 画面遷移と基本 UI が壊れていない
- Firebase 設定が読み込まれる

## 6. まだ残る iOS 固有タスク

- Google ログインを Web popup/redirect から native iOS 向け実装に切り替える
- App Store に出すなら `Sign in with Apple` も追加する
- iOS 用アイコン、スプラッシュ、権限文言を整える

## 7. よく使うコマンド

```bash
bash ./scripts/prepare-ios.sh
npx cap open ios
npx cap sync ios
npm run build
```

## 8. つまずきやすい点

- Windows ではこの iOS セットアップは進められません
- `Team` 未設定のままだと Xcode で署名エラーになります
- 無料アカウントでは配布用途に向きません
- Web 版で動く Google ログインが、そのまま iOS ネイティブで安定するとは限りません
