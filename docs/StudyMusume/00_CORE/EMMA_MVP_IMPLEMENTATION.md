# Emma MVP Implementation

## 目的

- `高瀬エマ単独MVP` に寄せるための最小修正を、対象ファイルを絞って整理する
- 既存の Home 改善を壊さずに、`Tutorial -> Home -> 学習 -> 好感度 -> 次の約束` の一本線を通す
- まずは `大きく消す` より `MVP中に見せない / 固定化する` 方針で進める

## 今回の対象ファイル

1. [src/data/tutorialData.js](/C:/Users/Hide2/.gemini/study-musume/src/data/tutorialData.js)
2. [src/pages/Tutorial.jsx](/C:/Users/Hide2/.gemini/study-musume/src/pages/Tutorial.jsx)
3. [src/pages/TutorialHome.jsx](/C:/Users/Hide2/.gemini/study-musume/src/pages/TutorialHome.jsx)
4. [src/pages/Home.jsx](/C:/Users/Hide2/.gemini/study-musume/src/pages/Home.jsx)
5. [src/utils/gameLoopUtils.js](/C:/Users/Hide2/.gemini/study-musume/src/utils/gameLoopUtils.js)

## 変更の考え方

- `複数ヒロイン機能を完全削除` するのではなく、MVPでは `エマ固定` に見せる
- 既存保存値 `selectedHeroineId` などは、今は残してもよい
- まず直すのは `体験上の違和感`
- `あとで複数ヒロインに戻せる余地` は残してよい

## 1. tutorialData.js

### いまの問題

- `ノア / レン / ホタル` の3人前提
- 開幕セリフ、結果セリフ、イベントセリフがエマ案とずれている
- `英単語クイズ + ガチャ + イベント` の旧チュートリアル色が強い

### 最小修正

- `TUTORIAL_CHARACTERS` をエマ1人だけにする
- `TUTORIAL_OPENING_LINES` をエマの放課後導入に差し替える
- `TUTORIAL_HOME_LINE` をエマのホーム台詞に差し替える
- `TUTORIAL_EVENT_LINES` を `次も来る?` 系の小さな約束に差し替える
- `TUTORIAL_QUIZ_REWARDS.line` をエマの口調に寄せる

### まだ触らなくていいもの

- 画像がノアしかないなら、一時的に流用でもよい
- ガチャ結果データは、ガチャ導線を止めるなら残っていてよい

### 完了条件

- データ上で `複数ヒロイン選択` の前提が消える
- セリフがエマの空気に揃う

## 2. Tutorial.jsx

### いまの問題

- `CHARACTER` ステップで推し選択をしている
- クイズが `英単語クイズ` 前提
- `結果 -> 10連ガチャ -> ミニイベント` の流れがMVPの芯とずれている
- `favoriteCharacter` と `selectedHeroineId` をチュートリアルの中心で使っている

### 最小修正

- `CHARACTER` ステップを削除する
- `OPENING -> QUIZ -> RESULT -> EVENT` か、必要なら `OPENING -> QUIZ -> RESULT` の短い流れにする
- 見出しを `英単語クイズ` から `やさしい文法確認` か `最初の文法チェック` に変更する
- クイズは `エマ確認クイズ 1問` でもよい
- `RESULT` では `好感度アップ + 次の約束予告` を主役にする
- `GACHA` ステップは MVP では飛ばすか削る
- `favoriteCharacter / selectedHeroineId` の保存はエマ固定値に寄せるか、保存自体を薄くする
- `characterId: 'noah'` 固定がある箇所は、エマ用IDを使うか、少なくとも `チュートリアルの主役はエマ` と読めるように直す

### 具体的に残してよいもの

- `tutorialCompleted`
- `affection` 加算
- `diamonds` や軽い報酬処理
- 既存の画面遷移の枠組み

### 完了条件

- 初回が `推し選択` ではなく `エマと出会う` で始まる
- `文法確認 -> 好感度上昇 -> 次の約束` が見える
- ガチャを見せなくても体験が完結する

## 3. TutorialHome.jsx

### いまの問題

- `selectedHeroineId` から表示キャラを決めている
- `推し:` という見せ方が残っている

### 最小修正

- MVP中は表示キャラをエマ固定にする
- `推し:` をやめて、`放課後の相手` や `Emma` に寄せる
- セリフもエマの一言に差し替える
- ボタン導線は `学習` を主役にして、他は薄くする

### 完了条件

- チュートリアル後ホームが `エマが待っている` 画面に見える

## 4. Home.jsx

### いまの問題

- `Partner` 枠が `selectedHeroineId` 前提
- `変更` ボタンから `character-select` へ行ける
- ストーリー文言が `推し変更` 前提を少し残している

### 最小修正

- `selectedHeroineLabel` がエマになるよう MVP中は固定寄りにする
- `selectedHeroineHint` をエマ向け文言にする
- `変更` ボタンは非表示か無効化する
- `Partner` ラベルを `Emma`, `After School`, `Study Partner` などへ寄せる
- `featuredPromise` が空のときの文言をエマ前提の放課後トーンに寄せる
- 大ボタンは今すぐ全部変えなくてもよいが、`勉強` の主役感は強める

### 今は残してよいもの

- `storyProgressSummary`
- `review優先`
- `featuredPromise`
- `selectedHeroineId` 自体の保存構造

### 完了条件

- Home を開いた時に `複数ヒロイン作品` より `エマがいる作品` に見える
- `キャラ変更したくなるUI` が前面に出てこない

## 5. gameLoopUtils.js

### いまの問題

- `focusCharacterId` が `selectedHeroineId / favoriteCharacter / characterId` を順に見に行く
- `storyProgressSummary` の文言が複数ヒロイン設計の名残を少し持っている

### 最小修正

- MVP中は `focusCharacterId` の優先値をエマ寄りにする
- `characterLabel` が空でもエマ表示に寄せられるようにする
- `featuredPromise.title` や `todayMoodCopy` の文言を、必要なら `エマと続ける` トーンに少し寄せる

### 今は残してよいもの

- `promiseState`
- `review優先`
- `routeState`
- `featuredPromise.actionRoutePath`

### 完了条件

- Home に出る文言が `誰と勉強するか未定` ではなく `エマと続ける` 方向に寄る

## 実装順

1. `src/data/tutorialData.js`
2. `src/pages/Tutorial.jsx`
3. `src/pages/TutorialHome.jsx`
4. `src/pages/Home.jsx`
5. `src/utils/gameLoopUtils.js`

## 先に触らないもの

- `CharacterSelectPage`
- `characterData` 全体の再設計
- 複数ヒロイン用 docs の削除
- `selectedHeroineId` の完全撤去
- Live2D 構成のやり直し

## 動作確認ポイント

- `/tutorial` がエマ前提で始まる
- キャラ選択なしで最後まで流れる
- リザルトで `好感度上昇` が見える
- 最後に `また来たい` 理由が残る
- `/home` に戻ったとき、エマが中央にいて違和感が薄い

## 一言でまとめると

- まず `複数ヒロイン機能を消す` のではなく
- `見える体験だけエマ単独MVPに揃える`
- そのために `Tutorial -> TutorialHome -> Home` を先に直す
