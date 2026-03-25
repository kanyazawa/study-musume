# Study Musume Play 公開前チェックリスト

最終更新: 2026-03-16

このメモは、現在の `study-musume` リポジトリ構成を前提にした Google Play 公開準備用のチェックリストです。

## 1. いま出来ていること

- [x] Android プロジェクトがある
  `android/` 配下があり、Capacitor で Android 化されている
- [x] アプリ ID がある
  `com.studymusume.app`
- [x] Web アプリのビルド先が決まっている
  `capacitor.config.ts` の `webDir` は `dist`
- [x] Play の target API 要件は満たしやすい設定
  `targetSdkVersion = 36`
- [x] 初回リリース向けのバージョン名を設定済み
  `package.json` は `1.0.0`、Android の `versionName` も `1.0.0`
- [x] 最低限のアイコン素材はある
  `android/app/src/main/res/mipmap-*`
- [x] Firebase / Firestore を使う前提の実装はある
  Google ログイン、フレンド、ランキング、同期のコードが存在する
- [x] Android リリース手順を回すスクリプトがある
  `npm run android:release:prep`
  `npm run android:bundle:release`

## 2. いま未完了か、確認が必要なもの

### 最優先

- [ ] Android 実機で Google ログインが通る
  今の実装は `src/firebase/auth.js` で `signInWithPopup` を優先している。
  これはスマホブラウザでは有効だが、Play 配布後の Android WebView ではそのまま安定しない可能性がある。
- [ ] Play 用の署名鍵を作る
  リリース署名用 keystore の作成がまだ必要
- [ ] Play Console を開設する
  ストア掲載情報、審査情報、Data safety の入力先が必要
- [ ] プライバシーポリシー URL を用意する
  Google ログイン、Firestore、フレンド、ランキングを使うため、公開 URL が実質必須

### 高優先

- [ ] `versionCode` を公開運用ルールに合わせる
  初回リリースは `1` でよいが、次回以降は必ず増やす
- [ ] `google-services.json` が必要か方針を決める
  現在の Android ビルドにはファイルがなく、Google Services plugin も未適用
  Push 通知を使わないなら即ブロッカーではないが、今後追加するなら必要
- [ ] ストア用画像を用意する
  アプリアイコン、スクリーンショット、必要なら feature graphic
- [ ] 年齢層と対象ユーザーを決める
  子ども向け扱いにするなら Google Play Families ポリシーの確認が必要

## 3. Android 実機で最初に確認すること

このアプリはここが最重要です。先にここで詰まると、その後のストア申請作業が全部止まります。

### 必須確認

- [ ] Android 端末に debug build を入れて起動できる
- [ ] Google ログインが成功して `/home` まで遷移する
- [ ] ログイン後にアプリ再起動してもログイン状態が維持される
- [ ] フレンド申請、承認、ランキング反映が Android 実機でも動く
- [ ] 外部リンクや OAuth 復帰後に画面が壊れない

### 要注意メモ

- 現在の認証実装はブラウザ前提の Firebase Auth フローに寄っている
- Android アプリ化後に不安定なら、次のどちらかに切り替える可能性が高い
  1. Capacitor の Browser / Custom Tabs を使う構成に寄せる
  2. ネイティブ向けの Google Sign-In プラグインを導入する

## 4. リリースビルドの手順

### Web を Android に反映

1. `npm run build`
2. `npx cap sync android`

またはまとめて:

1. `npm run android:release:prep`

### Android Studio 側

1. `android/` を Android Studio で開く
2. 実機で debug 起動して動作確認する
3. `Generate Signed Bundle / APK` で `Android App Bundle (AAB)` を作る
4. Play App Signing を有効にする

コマンドで bundle 生成する場合:

1. `android/keystore.properties.example` を `android/keystore.properties` にコピーして値を埋める
2. `npm run android:bundle:release`

## 5. リポジトリ内で公開前に直したい設定

- [ ] `android/app/build.gradle` のバージョンを上げる
- [ ] リリース署名設定をローカル環境で整える
- [ ] `android/keystore.properties` を実値で作成する
- [ ] アプリ名を最終表記に合わせる
  現在は `Study Musume`
- [ ] アイコンとスプラッシュを公開版に差し替える
- [ ] Android 実機向けに Google ログイン方式を必要なら見直す

## 6. Play Console で入力する項目

- [ ] アプリ名
- [ ] 短い説明
- [ ] 詳細説明
- [ ] カテゴリ
- [ ] 連絡先メールアドレス
- [ ] プライバシーポリシー URL
- [ ] スクリーンショット
- [ ] アプリアイコン
- [ ] Data safety
- [ ] 広告の有無
- [ ] 対象年齢
- [ ] コンテンツ レーティング

## 7. Data safety で確認が必要なデータ

今のコードから見ると、少なくとも次は洗い出し対象です。

- [ ] Google アカウント由来のプロフィール情報
  `displayName`, `email`, `photoURL`
- [ ] 学習データ
  学習時間、進捗、ランキング反映用データ
- [ ] フレンド関連データ
  `friendCode`, フレンド関係、申請状態
- [ ] ユーザー識別子
  `uid`

審査前には「何を収集するか」ではなく、
「何を送信するか」
「何を保存するか」
「削除できるか」
まで説明できる状態にしておくのが安全です。

## 8. このアプリで次にやる順番

1. Android 実機に debug build を入れる
2. Google ログインが通るか確認する
3. 通らなければ認証方式を Android 向けに直す
4. リリース署名鍵を作る
5. AAB を作る
6. プライバシーポリシーを用意する
7. Play Console のストア情報を埋める
8. 内部テストで配布する
9. 問題がなければ本番公開する

## 9. いまの最大リスク

最大リスクは「Android アプリとして配布したときの Google ログイン」です。

ブラウザ版はすでに動いているが、Play 公開時は WebView / Custom Tab / OAuth 復帰の挙動が別物になりやすいです。
そのため、ストア文面や画像作成より先に Android 実機でログイン確認を済ませるのが最短です。
