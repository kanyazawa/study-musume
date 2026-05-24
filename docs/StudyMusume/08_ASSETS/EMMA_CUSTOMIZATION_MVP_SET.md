# Emma Customization MVP Set

## 目的

- `高瀬エマ` の看板感を崩さずに、最初の `見た目ごほうび` を成立させる
- MVPで先に用意する `3衣装 / 3背景 / 3アクセ` を固定する
- 実装時に迷わないよう、`見た目の意図`, `ID`, `解放条件` をまとめておく

## 先に決めること

- ベースの通常制服は `default` 扱いのまま使う
- このドキュメントで言う `3衣装` は `追加で解放される3着` を指す
- 追加報酬は `好感度`, `ガチャ`, `イベント` に分散して、どの導線でもうれしさが出るようにする

## MVPの見せ方

- 学習を続けると `エマの放課後が少しずつ増える`
- ごほうびは `派手な変身` ではなく `距離が近づいた実感`
- 服も背景も `上品`, `やわらかい`, `日常寄り` を崩さない

## 衣装セット

### 1. 放課後カーデ私服

- 表示名: `放課後カーデ私服`
- itemId: `skin_emma_casual_cardigan`
- レア度目安: `SR`
- 解放方法: `好感度 Lv5`
- 役割:
  - `制服以外も見せてくれる関係` に入ったことを分かりやすく出す
  - Home での変化が大きく、報酬感が強い
- 見た目:
  - 白〜生成りのインナー
  - 淡いベージュ or グレージュの薄手カーディガン
  - 濃紺スカート or 落ち着いたボトム
  - 制服より少し力の抜けた放課後感
- NG:
  - 地雷系, ストリート寄り, 露出多め
  - 年齢感が急に上がる大人っぽすぎる私服

### 2. 夏制服

- 表示名: `夏制服`
- itemId: `skin_emma_summer_uniform`
- レア度目安: `SR`
- 解放方法: `ガチャSR` または `季節イベント前半`
- 役割:
  - 制服ベースで変化を出せるので、別人化せず実装しやすい
  - Tutorial / Home / Study どこに置いても違和感が少ない
- 見た目:
  - 半袖シャツ
  - 薄いサマーカーデ or なし差分
  - 青みのある涼しい配色
  - 清潔感と知的さを優先
- NG:
  - 強いスポーティー感
  - コスプレ感のある夏衣装

### 3. 休日ニット私服

- 表示名: `休日ニット私服`
- itemId: `skin_emma_weekend_knit`
- レア度目安: `SSR`
- 解放方法: `ガチャSSR` または `放課後イベント後半`
- 役割:
  - `特別な一枚` としての目玉衣装
  - 親密度が上がったあとに映える、少しだけ恋愛寄りの空気を出す
- 見た目:
  - やわらかいハイゲージニット
  - くすみブルー or ミルクティー系の上品色
  - シンプルで清潔な休日服
  - `見せすぎない特別感`
- NG:
  - 派手なフリル
  - ラグジュアリーすぎるデート服

## 背景セット

### 1. 図書室の夕方

- 表示名: `図書室の夕方`
- itemId: `bg_emma_library_evening`
- レア度目安: `SR`
- 解放方法: `好感度 Lv3`
- 役割:
  - `放課後に一緒に勉強している` 体験を一番自然に強める
  - 早い段階で景色が変わるので継続報酬として気持ちいい
- 見た目:
  - 本棚と机
  - 斜めに差す夕方の光
  - コントラスト控えめ
  - 会話UIの可読性優先

### 2. 夕焼けの教室

- 表示名: `夕焼けの教室`
- itemId: `bg_emma_sunset_classroom`
- レア度目安: `SSR`
- 解放方法: `好感度 Lv9`
- 役割:
  - 高好感度帯の象徴背景
  - Home の空気を一気に `恋愛ゲームのごほうび` に寄せられる
- 見た目:
  - 教室の窓から強すぎない橙の光
  - 机や椅子は簡略化
  - 少しだけドラマ感を足す
- NG:
  - 紫に寄りすぎる夕焼け
  - 画面全体が暗くなりすぎる見た目

### 3. 自習スペース

- 表示名: `校内自習スペース`
- itemId: `bg_emma_study_lounge`
- レア度目安: `SR`
- 解放方法: `ガチャSR` または `イベント報酬`
- 役割:
  - 教室と図書室の中間の景色として使いやすい
  - 日常バリエーションを増やせる
- 見た目:
  - 白木机
  - ガラス越しのやわらかい光
  - 落ち着いた校内ラウンジ風

## アクセサリーセット

### 1. 星のヘアピン

- 表示名: `星のヘアピン`
- itemId: `accessory_emma_star_hairpin`
- レア度目安: `R`
- 解放方法: `序盤イベント報酬`
- 役割:
  - 一番早く手に入る `自分のエマ感`
  - 小さな変化でも愛着が出る導入アクセ
- 見た目:
  - 小さめ
  - 金 or 真鍮寄りの落ち着いた色
  - 片側だけに付く

### 2. 丸眼鏡

- 表示名: `勉強用の丸眼鏡`
- itemId: `accessory_emma_round_glasses`
- レア度目安: `SR`
- 解放方法: `ガチャSR`
- 役割:
  - `知的`, `観察的`, `放課後の勉強相手` というエマの印象と相性がいい
  - Live2Dや差分実装にも流用しやすい
- 見た目:
  - 細フレーム
  - 黒よりブラウン or アンティークゴールド
  - 主張しすぎない丸型

### 3. ミニリボン

- 表示名: `ミニリボン`
- itemId: `accessory_emma_mini_ribbon`
- レア度目安: `SR`
- 解放方法: `好感度 Lv7` または `節目イベント報酬`
- 役割:
  - `少しだけやわらかくなったエマ` を見せる
  - 恋愛寄りの空気は出すが、甘くしすぎない
- 見た目:
  - 紺, くすみ青, えんじのいずれか
  - 小さめ
  - 制服にも私服にも合う

## 解放導線まとめ

### 好感度報酬

- Lv3: `bg_emma_library_evening`
- Lv5: `skin_emma_casual_cardigan`
- Lv7: `accessory_emma_mini_ribbon`
- Lv9: `bg_emma_sunset_classroom`

### ガチャ報酬

- SR: `skin_emma_summer_uniform`
- SR: `bg_emma_study_lounge`
- SR: `accessory_emma_round_glasses`
- SSR: `skin_emma_weekend_knit`

### イベント報酬

- 序盤イベント: `accessory_emma_star_hairpin`
- 季節イベント前半: `skin_emma_summer_uniform` の代替解放も可
- 節目イベント: `accessory_emma_mini_ribbon` の代替解放も可

## 実装用の報酬ID整理

- 現在の好感度データでは、報酬名が `抽象ID` になっている
- そのままでもよいが、inventory反映時には `itemId` への対応表が必要

### 対応表

- `background_library` -> `bg_emma_library_evening`
- `costume_casual` -> `skin_emma_casual_cardigan`
- `background_sunset` -> `bg_emma_sunset_classroom`

## 既存実装との接続メモ

- `equippedSkin / equippedBackground / equippedAccessories` はそのまま使う
- `CharacterInteraction` と `Inventory` の装備導線も流用できる
- 先に docs で決めた itemId を `itemData.js` に追加し、あとから画像差し替えしてもよい
- 既存の Noah 前提文言は、Emma 実装時に順次差し替える

## 優先順位

### 最優先

- `bg_emma_library_evening`
- `skin_emma_casual_cardigan`
- `accessory_emma_star_hairpin`

### 次点

- `skin_emma_summer_uniform`
- `accessory_emma_round_glasses`

### ごほうびの山場

- `skin_emma_weekend_knit`
- `bg_emma_sunset_classroom`
- `accessory_emma_mini_ribbon`

## 判断基準

- `かわいいか` だけでなく `高瀬エマらしいか`
- `数を増やせるか` より `最初の数点で愛着が出るか`
- `映えるか` より `Homeに置いたとき毎日見たくなるか`
