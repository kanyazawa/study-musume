# iOS Sign in with Apple 実装計画

最終更新: 2026-05-08

このメモは、`study-musume` を `App Store` に出すために必要な `Sign in with Apple` を、現在のリポジトリ構成に合わせて実装する計画です。

## 1. 背景

現在のログイン実装は [src/firebase/auth.js](/C:/Users/Hide2/.gemini/study-musume/src/firebase/auth.js) を中心に、Firebase Web SDK の認証状態をアプリ全体で使っています。

すでに iOS では Google ログインを native bridge 経由に寄せ始めており、[src/native/nativeGoogleAuth.js](/C:/Users/Hide2/.gemini/study-musume/src/native/nativeGoogleAuth.js) と [src/hooks/useAuthSync.js](/C:/Users/Hide2/.gemini/study-musume/src/hooks/useAuthSync.js) にその前提があります。

App Store 審査では、Google などの第三者ログインを主ログインとして使う場合、同等の選択肢として `Sign in with Apple` を求められる可能性が高いです。

## 2. 採用方針

### 結論

iOS ネイティブアプリでは、`AuthenticationServices` で `Sign in with Apple` を行い、取得した `identityToken` と `rawNonce` を JavaScript 側へ返し、Firebase Web SDK の `signInWithCredential(...)` で既存セッションへ接続します。

### この方針を選ぶ理由

- 現在の認証状態監視は `subscribeToAuthState()` と `useAuthSync()` が中心
- セーブ同期、フレンド、ランキングが Firebase Web SDK の `currentUser` 前提で動いている
- iOS だけ native Firebase Auth へ全面移行すると影響範囲が大きい
- 既存の native Google Sign-In 方針と揃えられる

これは repo 構成からの推論ですが、`native でトークン取得 -> JS で Firebase credential 化` がいちばん小さい変更で済みます。

## 3. 公式要件メモ

- Apple の App Review Guidelines 4.8 では、第三者ログインを主ログインに使う場合、同等のログイン手段が必要です
- Apple の `Sign in with Apple` は iOS アプリに capability を追加して使います
- Firebase で Apple 認証を使う場合、Apple provider 設定、Team ID、Key ID、private key、Service ID などの構成が必要です
- Apple は `name` や `email` を初回サインイン時しか返さないことがあります
- `Hide My Email` により `privaterelay.appleid.com` のアドレスが返ることがあります

## 4. 推奨アーキテクチャ

### 4-1. JS から見た流れ

1. `Login.jsx` で `Appleでサインイン` ボタンを押す
2. `signInWithApple()` を呼ぶ
3. iOS native app なら `NativeAppleAuth` plugin を呼ぶ
4. native 側で `ASAuthorizationAppleIDProvider` を使って認証する
5. plugin から `idToken`, `rawNonce`, `userIdentifier`, `email`, `fullName` を返す
6. JS 側で `new OAuthProvider('apple.com').credential({ idToken, rawNonce })` を作る
7. `signInWithCredential(auth, credential)` で Firebase にログインする
8. 既存の `ensureUserDocument()`, `useAuthSync()`, `syncOnLogin()` がそのまま動く

### 4-2. なぜ Firebase Web SDK 側で完結させるか

これは repo 構成からの推論ですが、いまのアプリは `auth.currentUser` を前提にクラウド同期とフレンド機能がつながっています。

そのため、Apple だけ別の認証状態ストアを持たせるより、JS 側の Firebase セッションへ統一する方が安全です。

## 5. 実装スコープ

### 今回の実装対象

- iOS ネイティブアプリで `Sign in with Apple` できるようにする
- Firebase Web SDK の既存セッション管理へ接続する
- ログイン画面に Apple ボタンを追加する
- App Store 審査で `Googleログインのみ` と見なされない状態にする

### 今回は後回しにするもの

- Android 版の Apple ログイン
- Web 版の Sign in with Apple JS 対応
- Apple と Google の既存アカウント統合 UI
- 完全なアカウント削除フロー

## 6. Apple / Firebase 側の設定

### Apple Developer

1. iOS の App ID に `Sign in with Apple` capability を有効化する
2. Xcode の `Signing & Capabilities` に `Sign in with Apple` を追加する
3. 必要に応じて Services ID を作る
4. Sign in with Apple 用の private key を発行する
5. Team ID と Key ID を控える

### Firebase

1. Firebase Console で iOS アプリを追加する
2. 最終 `Bundle Identifier` を Firebase 側にも登録する
3. Authentication の `Sign-in method` で Apple provider を有効化する
4. Firebase の案内に沿って `Service ID`, `Team ID`, `Key ID`, `private key` を設定する
5. `GoogleService-Info.plist` を iOS プロジェクトへ追加する

## 7. ファイル別変更方針

### 新規: `src/native/nativeAppleAuth.js`

役割:

- `registerPlugin('NativeAppleAuth', ...)` を定義する
- `isNativeIOSApp()` を流用または共有する
- `nativeAppleSignIn()` を提供する
- 必要なら `getAppleCredentialState()` を提供する

戻り値の想定:

```js
{
  success: true,
  idToken,
  rawNonce,
  userIdentifier,
  email,
  fullName
}
```

### 変更: [src/firebase/auth.js](/C:/Users/Hide2/.gemini/study-musume/src/firebase/auth.js)

やること:

- `OAuthProvider` を import する
- `signInWithApple()` を追加する
- iOS native app では `nativeAppleSignIn()` を呼ぶ
- `provider.credential({ idToken, rawNonce })` を生成する
- `signInWithCredential(...)` で Firebase ログインする
- 初回サインインで取れた `email` と `fullName` を `ensureUserDocument()` 反映方針に合わせて保存する
- `signOut()` は Firebase 側の sign out を維持する

補足:

- Apple は `photoURL` を返さない前提で扱う
- `displayName` は初回しか来ない可能性があるので、ユーザードキュメント作成時に取りこぼさないようにする

### 変更: [src/pages/Login.jsx](/C:/Users/Hide2/.gemini/study-musume/src/pages/Login.jsx)

やること:

- iOS native app 時だけ `Appleでサインイン` ボタンを表示する
- Google ボタンと同じレベルで並べる
- Apple ボタン押下時の loading / error を Google と共通管理する
- 審査向けに、ログインの価値がわかる既存説明文は維持する

### 変更: [src/hooks/useAuthSync.js](/C:/Users/Hide2/.gemini/study-musume/src/hooks/useAuthSync.js)

やること:

- 基本はそのままでよい
- 必要なら iOS 起動時に Apple credential state を確認して、認可取り消し時の扱いを後で追加できるようにする

### 新規: `ios/App/App/plugins/NativeAppleAuth/NativeAppleAuth.swift`

役割:

- `AuthenticationServices` を使って Apple 認証の実処理を持つ
- `nonce` 生成と `sha256` 化を行う
- `ASAuthorizationAppleIDRequest` に `requestedScopes = [.fullName, .email]` を入れる
- 成功時に `identityToken`, `rawNonce`, `user`, `email`, `fullName` を plugin へ返す

### 新規: `ios/App/App/plugins/NativeAppleAuth/NativeAppleAuthPlugin.swift`

役割:

- Capacitor plugin の公開メソッドを持つ
- `signIn`
- 必要なら `getCredentialState`

### 変更: `ios/App/App/Info.plist`

やること:

- 追加 capability に必要な構成を確認する
- Apple 認証用の追加説明文言は通常不要だが、他の認証や通知と混ざる設定差分を確認する

## 8. 実装のポイント

### 8-1. nonce を native 側で扱う

Apple + Firebase では `rawNonce` と、その SHA-256 ハッシュを使ったリクエストが重要です。

推奨:

1. native 側でランダムな `rawNonce` を作る
2. SHA-256 した値を Apple request に入れる
3. 生の `rawNonce` を JS 側へ返す
4. JS 側で `provider.credential({ idToken, rawNonce })` を作る

### 8-2. 初回だけ返る name / email を保存する

Apple は `fullName` と `email` を初回サインイン時しか返さないことがあります。

そのため、初回ログイン成功時には:

- `displayName`
- `email`
- `appleUserIdentifier`

をユーザードキュメントへ保存しておく方が安全です。

### 8-3. 既存の Google アカウントとの統合はすぐにはやらない

まずは App Review を通すために、Apple ログインで単独アカウントが作れる状態を優先します。

Apple は他アカウントとのリンクに明示同意を求めるため、最初から自動統合までは狙わない方が安全です。

## 9. 受け入れ条件

- iOS ネイティブアプリのログイン画面に `Appleでサインイン` ボタンがある
- Apple ボタンから認証できる
- ログイン成功後に `/home` へ進める
- アプリ再起動後も Firebase のログイン状態が維持される
- `Friends`, `Ranking`, `MultiplayerMatch` などで `getCurrentUser()` が使える
- Google ログインと Apple ログインのどちらでも最低限同じ主要機能に入れる

## 10. リスク

- `name` と `email` を初回で保存し損ねると後で復元しづらい
- `privaterelay.appleid.com` のメールを通常メールと同じ前提で扱うと運用で困る
- Apple と Google の重複アカウントが発生する可能性がある
- `nonce` 実装を誤ると Firebase 側で `missing-or-invalid-nonce` が出る
- 将来アカウント削除機能を付けるなら、Apple token の再取得と revoke フローも必要になる

## 11. 実装順

1. Apple Developer / Firebase 側の設定を作る
2. `ios/` プロジェクトを生成して capability を有効化する
3. `NativeAppleAuth` plugin を作る
4. `src/native/nativeAppleAuth.js` を追加する
5. `src/firebase/auth.js` に `signInWithApple()` を追加する
6. `Login.jsx` に Apple ボタンを追加する
7. iPhone 実機でログイン確認する
8. TestFlight 内部テストで審査相当の確認をする

## 12. この repo に合わせた実装判断

この計画は、`study-musume` の現在の設計に合わせて次を優先しています。

- 認証状態は Firebase Web SDK に寄せる
- iOS 固有処理は Capacitor plugin に閉じ込める
- Android や Web の既存ログイン導線は崩さない
- App Store 審査のブロッカーを先に外す

そのため、最初のゴールは「完璧なアカウント統合」ではなく、
「iOS 実機で Apple ログインが通り、既存の同期機能につながること」です。

## 13. 関連ドキュメント

- [iOS Quickstart](/C:/Users/Hide2/.gemini/study-musume/docs/ios-quickstart.md)
- [iOS Native Auth Plan](/C:/Users/Hide2/.gemini/study-musume/docs/ios-native-auth-plan.md)
- [App Store Release Checklist](/C:/Users/Hide2/.gemini/study-musume/docs/app-store-release-checklist.md)
