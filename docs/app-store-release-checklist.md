# Study Musume App Store 公開前チェックリスト

最終更新: 2026-05-08

このメモは、現在の `study-musume` リポジトリ構成を前提にした `App Store` 公開準備用のチェックリストです。

## 1. いま出来ていること

- [x] iOS 化の土台がある
  `@capacitor/ios` を前提にした `ios:prepare`, `ios:sync`, `ios:open` スクリプトがある
- [x] アプリ ID がある
  `capacitor.config.ts` の `appId` は `com.studymusume.app`
- [x] Web アプリのビルド先が決まっている
  `capacitor.config.ts` の `webDir` は `dist`
- [x] iOS 初回セットアップをまとめるスクリプトがある
  `npm run ios:prepare`
- [x] Firebase / Firestore を使う前提の実装はある
  Google ログイン、フレンド、ランキング、同期のコードが存在する
- [x] iOS native Google Sign-In の橋渡しコードが入り始めている
  `src/native/nativeGoogleAuth.js` と `src/firebase/auth.js` に iOS native 分岐がある

## 2. いま未完了か、確認が必要なもの

### 最優先

- [ ] `Mac` と `Xcode` を用意する
  App Store 提出は Windows だけでは進められない
- [ ] Apple Developer Program に加入する
  TestFlight 配布と App Store 公開に必要
- [ ] iOS プロジェクトを生成して Xcode で署名できる状態にする
  `npm run ios:prepare`
  `npm run ios:open`
- [ ] iOS 実機で Google ログインが通る
  このアプリは認証ありの体験が中心なので、ここで詰まると提出作業が止まる
- [ ] `Sign in with Apple` を追加するか、ログイン要件を見直す
  Google ログインを主ログインにするなら審査で必要になる可能性が高い
- [ ] プライバシーポリシー URL を用意する
  App Store Connect の入力に必要

### 高優先

- [ ] Firebase に iOS アプリを追加する
  最終 `Bundle Identifier` を登録して `GoogleService-Info.plist` を発行する
- [ ] App Store Connect にアプリレコードを作る
  アプリ名、SKU、Bundle ID を確定する
- [ ] App Store 用アイコンとスクリーンショットを用意する
- [ ] App Privacy の回答を埋める
  Firebase Auth、Firestore、Storage、ランキング、フレンド機能で扱うデータを整理する
- [ ] 年齢レーティングを決める
  学習アプリでもチャット、対戦、ガチャ表現があるので質問票を正確に埋める

## 3. iPhone 実機で最初に確認すること

このアプリはここが最重要です。先にここで詰まると、その後のストア申請作業が全部止まります。

### 必須確認

- [ ] iPhone 実機にアプリを入れて起動できる
- [ ] Google ログインが成功して `/home` まで遷移する
- [ ] ログイン後にアプリ再起動してもログイン状態が維持される
- [ ] フレンド、ランキング、学習データ同期が iPhone 実機でも動く
- [ ] 音声再生、画像表示、主要画面遷移が壊れていない
- [ ] ログインなしの `ひとりで始める` ルートでも最低限遊べる

### 要注意メモ

- 現在の Web 版 Google ログインは `popup / redirect` ベースで、iOS アプリ内ではそのまま安定しない
- この repo には iOS native Google Sign-In へ寄せる方針メモがある
- App Store 提出では、認証が不安定な状態のまま出すのは危険

## 4. リリースビルドまでの手順

### Mac で最初にやること

1. `npm install`
2. `npm run ios:prepare`
3. `npm run ios:open`

### Xcode 側

1. `App` ターゲットを開く
2. `Signing & Capabilities` で `Team` を設定する
3. `Bundle Identifier` を一意な値にする
4. 実機で `Run` して動作確認する
5. 問題なければ `Archive` する
6. `Distribute App` から `App Store Connect` へアップロードする

### App Store Connect 側

1. `New App` でアプリレコードを作る
2. バージョン情報、説明、キーワード、サポート URL を入力する
3. スクリーンショットをアップロードする
4. App Privacy を入力する
5. 年齢レーティングを設定する
6. アップロード済みビルドを選ぶ
7. `Submit for Review` する

## 5. リポジトリ内で公開前に直したい設定

- [ ] `ios/` ディレクトリを実際に生成する
  現在のリポジトリにはまだ入っていない想定
- [ ] iOS 用 `GoogleService-Info.plist` を追加する
- [ ] `Info.plist` の URL scheme と必要な説明文言を整える
- [ ] Google Sign-In の native plugin 実装を完成させる
- [ ] `Sign in with Apple` を実装するか、公開時の認証方式を再設計する
- [ ] アプリ名を最終表記に合わせる
  現在は `Study Musume`
- [ ] 公開版アイコンとスプラッシュを差し替える

## 6. App Store Connect で入力する項目

- [ ] アプリ名
- [ ] サブタイトル
- [ ] 説明文
- [ ] キーワード
- [ ] カテゴリ
- [ ] サポート URL
- [ ] プライバシーポリシー URL
- [ ] スクリーンショット
- [ ] アプリアイコン
- [ ] App Privacy
- [ ] 年齢レーティング
- [ ] 連絡先情報
- [ ] レビュー担当者向けメモ

## 7. App Privacy で確認が必要なデータ

今のコードから見ると、少なくとも次は洗い出し対象です。

- [ ] ユーザー識別子
  `uid`
- [ ] 連絡先情報
  `email`
- [ ] ユーザーコンテンツやプロフィール
  `displayName`, `photoURL`
- [ ] 学習データ
  学習進捗、統計、保存データ
- [ ] ソーシャル機能のデータ
  `friendCode`, フレンド関係、ランキング反映用データ
- [ ] 生成・会話系データ
  Noa Chat を有効にする場合は送信テキストや関連ログも確認対象

審査前には「何を収集するか」だけでなく、
「何をサーバーへ送るか」
「何を保存するか」
「削除や問い合わせをどう受けるか」
まで説明できる状態にしておくのが安全です。

## 8. このアプリで次にやる順番

1. Mac で `npm run ios:prepare` を実行する
2. Xcode で署名を通して iPhone 実機起動する
3. iPhone 実機で Google ログイン確認をする
4. 必要なら native Google Sign-In を完成させる
5. `Sign in with Apple` を追加する
6. Firebase の iOS 設定を確定する
7. App Store Connect のストア情報を埋める
8. TestFlight 内部テストで配布する
9. 問題がなければ App Review に出す

## 9. いまの最大リスク

最大リスクは「iOS アプリとして配布したときのログイン審査」です。

この repo はすでに iOS native Google Sign-In に寄せる準備を始めていますが、提出前に本当に必要なのは「審査端末で安定してログインできること」です。
そのため、ストア文面や画像作成より先に iPhone 実機でログイン確認を済ませるのが最短です。

## 10. 関連ドキュメント

- [iOS Quickstart](/C:/Users/Hide2/.gemini/study-musume/docs/ios-quickstart.md)
- [iOS Native Auth Plan](/C:/Users/Hide2/.gemini/study-musume/docs/ios-native-auth-plan.md)
- [iOS Sign in with Apple Plan](/C:/Users/Hide2/.gemini/study-musume/docs/ios-sign-in-with-apple-plan.md)
- [README](/C:/Users/Hide2/.gemini/study-musume/README.md)
