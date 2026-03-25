# iOS Native Auth Plan

最終更新: 2026-03-22

このメモは、`study-musume` を iOS ネイティブアプリとして動かす時に、現在の Web 向け Google ログインを iOS ネイティブ対応へ置き換えるための実装計画です。

## 1. 背景

現在の Google ログインは [src/firebase/auth.js](/C:/Users/Hide2/.gemini/study-musume/src/firebase/auth.js) で `signInWithPopup` / `signInWithRedirect` を使っています。

この方式は Safari 直開きでは動いても、iPhone のホーム画面追加 PWA や iOS アプリ表示では安定しません。

そのため、iOS ネイティブアプリでは Web の popup / redirect をやめて、ネイティブの Google Sign-In SDK を使う方針に切り替えます。

## 2. 採用方針

### 結論

iOS ネイティブアプリでは、Google サインイン自体はネイティブ SDK で行い、取得した `idToken` / `accessToken` を JavaScript 側へ返して、既存の Firebase Web SDK に `signInWithCredential` させます。

### この方針を選ぶ理由

- 現在のアプリ状態管理は JavaScript 側の Firebase Auth に寄っている
- `useAuthSync` や `getCurrentUser()` は Web SDK の認証状態を前提にしている
- 先に native Firebase Auth へ全面移行すると、認証状態の参照箇所を大きく作り直す必要がある
- まずは「iOS で安定して Google ログインできる」ことを最短で達成したい

### この判断は repo 構成からの推論

[src/firebase/auth.js](/C:/Users/Hide2/.gemini/study-musume/src/firebase/auth.js) と [src/hooks/useAuthSync.js](/C:/Users/Hide2/.gemini/study-musume/src/hooks/useAuthSync.js) を見る限り、現状は JavaScript 側の Firebase Auth 状態を中心に全体が組まれています。そのため、iOS だけ native Firebase Auth に寄せるより、ネイティブで取得した Google トークンを Web SDK に渡して既存フローへ接続する方が影響範囲が小さいと判断しています。

## 3. 公式根拠

- Firebase Apple platforms の Google サインイン手順では、Google Sign-In SDK を追加し、`clientID` と URL scheme を設定して、得られた Google トークンから Firebase credential を作る流れになっています  
  https://firebase.google.com/docs/auth/ios/google-signin
- Google の iOS SDK 公式でも、`Info.plist` に `GIDClientID` と reversed client ID の URL scheme、必要なら `GIDServerClientID` を設定するよう案内されています  
  https://developers.google.com/identity/sign-in/ios/start-integrating
- Firebase Web SDK では、手動で取得した Google ID token から `GoogleAuthProvider.credential(...)` を作って `signInWithCredential(...)` できます  
  https://firebase.google.com/docs/auth/web/google-signin
- Apple の App Review Guideline 4.8 により、Google ログインを主アカウントとして使うなら `Sign in with Apple` も別途必要になる可能性が高いです  
  https://developer.apple.com/app-store/review/guidelines/

## 4. 実装スコープ

### 今回の実装対象

- iOS ネイティブアプリ内で Google ログインできるようにする
- 既存の `useAuthSync` とセーブ同期フローをなるべく壊さない
- iOS でだけ native Google Sign-In を使う

### 今回は後回しにするもの

- Android の native Google Sign-In 置き換え
- native Firebase Auth への全面移行
- Sign in with Apple の本実装
- TestFlight / App Store 提出作業

## 5. 変更方針

### JavaScript 側

対象ファイル:

- [src/firebase/auth.js](/C:/Users/Hide2/.gemini/study-musume/src/firebase/auth.js)
- [src/hooks/useAuthSync.js](/C:/Users/Hide2/.gemini/study-musume/src/hooks/useAuthSync.js)
- [src/pages/Login.jsx](/C:/Users/Hide2/.gemini/study-musume/src/pages/Login.jsx)
- 新規: `src/native/nativeGoogleAuth.js`

やること:

- `signInWithCredential` を追加して、iOS ネイティブアプリだけ native bridge を呼ぶ
- bridge が返した `idToken` / `accessToken` から `GoogleAuthProvider.credential(...)` を組み立てる
- その credential で Firebase Web SDK に `signInWithCredential(...)` する
- `signOut()` 時にネイティブ側の Google セッションも明示的に切る
- `handleRedirectResult()` は iOS ネイティブでは実質使わないように分岐する
- ログイン画面の文言を「iOS ネイティブアプリでは使える」に更新する

### iOS ネイティブ側

対象ファイル:

- `ios/App/App/AppDelegate.swift`
- 新規: `ios/App/App/plugins/NativeGoogleAuth/NativeGoogleAuth.swift`
- 新規: `ios/App/App/plugins/NativeGoogleAuth/NativeGoogleAuthPlugin.swift`
- `ios/App/App/Info.plist`
- Xcode project settings

やること:

- GoogleSignIn SDK を Swift Package Manager で追加する
- `GoogleService-Info.plist` を iOS プロジェクトへ入れる
- `REVERSED_CLIENT_ID` を URL scheme として `Info.plist` に設定する
- `AppDelegate.swift` で Google Sign-In の URL callback をハンドルする
- Capacitor custom plugin を作り、JS から `signIn`, `restorePreviousSignIn`, `signOut` を呼べるようにする
- plugin 内では `GIDSignIn` を使って `idToken`, `accessToken`, `email`, `displayName`, `photoURL` を返す

## 6. 推奨アーキテクチャ

### 6-1. JS から見た流れ

1. `Login.jsx` のボタン押下
2. `signInWithGoogle()` 実行
3. `Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'ios'` なら native plugin を呼ぶ
4. plugin から `idToken` / `accessToken` を受け取る
5. `GoogleAuthProvider.credential(idToken, accessToken)` を作る
6. `signInWithCredential(auth, credential)` を呼ぶ
7. 既存の `subscribeToAuthState()` と `useAuthSync()` がそのまま動く

### 6-2. なぜ native FirebaseAuth で完結させないか

これは repo 構成からの推論ですが、現状のアプリは Web SDK の `currentUser` を前提にしているため、native FirebaseAuth にだけサインインすると [src/pages/Friends.jsx](/C:/Users/Hide2/.gemini/study-musume/src/pages/Friends.jsx) や [src/pages/Ranking.jsx](/C:/Users/Hide2/.gemini/study-musume/src/pages/Ranking.jsx) の `getCurrentUser()` 連携がずれます。

まずは JS 側の Firebase セッションを維持する設計にした方が、安全に差し替えできます。

## 7. 実装手順

### Phase 1: iOS native shell を作る

1. Mac で `npm run ios:prepare`
2. `npx cap open ios`
3. 署名設定と Bundle ID を確定する

### Phase 2: Google コンソール / Firebase 設定

1. Firebase コンソールで iOS アプリを追加する
2. iOS Bundle ID を登録する
3. `GoogleService-Info.plist` を取得する
4. Firebase Authentication で Google provider を有効にする
5. 必要なら iOS 用 OAuth client / server client ID を確認する

### Phase 3: iOS ネイティブ plugin 作成

1. `ios/App/App/plugins/NativeGoogleAuth/` を作る
2. `NativeGoogleAuthPlugin.swift` を追加する
3. `NativeGoogleAuth.swift` を追加する
4. `signIn`, `restorePreviousSignIn`, `signOut` を実装する
5. bridge registration を行う

参考テンプレート:

- [NativeGoogleAuth.swift](/C:/Users/Hide2/.gemini/study-musume/docs/ios-native-plugin-template/NativeGoogleAuth.swift)
- [NativeGoogleAuthPlugin.swift](/C:/Users/Hide2/.gemini/study-musume/docs/ios-native-plugin-template/NativeGoogleAuthPlugin.swift)
- [AppDelegate.google-signin.swift.snippet](/C:/Users/Hide2/.gemini/study-musume/docs/ios-native-plugin-template/AppDelegate.google-signin.swift.snippet)
- [Info.plist.google-signin.snippet.xml](/C:/Users/Hide2/.gemini/study-musume/docs/ios-native-plugin-template/Info.plist.google-signin.snippet.xml)

### Phase 4: JS bridge 作成

1. `src/native/nativeGoogleAuth.js` を追加する
2. plugin 呼び出しを Promise ベースで包む
3. 戻り値の型を固定する

### Phase 5: 既存 auth.js へ接続

1. iOS native app 判定を追加
2. native plugin の `signIn()` を呼ぶ
3. `GoogleAuthProvider.credential(...)` で Firebase credential を生成
4. `signInWithCredential(...)` へつなぐ
5. 既存の `ensureUserDocument()` をそのまま通す

### Phase 6: サインアウトと再起動復元

1. `signOut()` で Web SDK のサインアウト
2. plugin 側の Google セッションも破棄
3. 起動時に `restorePreviousSignIn()` の要否を判断

## 8. 具体的なファイル別 TODO

### [src/firebase/auth.js](/C:/Users/Hide2/.gemini/study-musume/src/firebase/auth.js)

- `signInWithCredential` を import
- `isNativeIOSApp()` を追加
- `signInWithGoogle()` の先頭で iOS native 分岐を追加
- native token を Firebase credential へ変換
- `signOut()` で native plugin signOut を呼ぶ

### [src/hooks/useAuthSync.js](/C:/Users/Hide2/.gemini/study-musume/src/hooks/useAuthSync.js)

- iOS native では `handleRedirectResult()` をスキップまたは no-op 扱いにする
- 現在の auth state 同期はそのまま使う

### `src/native/nativeGoogleAuth.js`

- `registerPlugin` で NativeGoogleAuth を定義
- `signIn()`
- `restorePreviousSignIn()`
- `signOut()`

### `ios/App/App/AppDelegate.swift`

- `FirebaseApp.configure()`
- Google Sign-In の URL callback を処理

### `ios/App/App/Info.plist`

- `GoogleService-Info.plist` を追加
- `REVERSED_CLIENT_ID` の URL scheme を登録
- 必要なら `GIDServerClientID` も設定

## 9. 受け入れ条件

- iOS ネイティブアプリで Google ログインボタンを押すと、ネイティブ Google Sign-In が開く
- ログイン成功後に `/home` へ進める
- アプリ再起動後も Firebase のログイン状態が維持される
- `Friends`, `Ranking`, `MultiplayerMatch` で `getCurrentUser()` が使える
- サインアウト後に再度サインインできる

## 10. リスク

- iOS ネイティブ側の Google セッションと Web SDK の Firebase セッションがずれる可能性がある
- `GoogleService-Info.plist` や Bundle ID がずれると認証が通らない
- App Store 提出時には `Sign in with Apple` が別途必要になる可能性が高い

## 11. 次に着手する順番

1. iOS native plugin の土台を作る
2. `auth.js` に iOS native 分岐を足す
3. 実機でログイン成功まで通す
4. その後に `Sign in with Apple` を追加する
