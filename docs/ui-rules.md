# UI Rules

`study-musume` のゲームUIを新しく作るときの実装ベースのルール集。

このドキュメントはデザイン理論ではなく、既存の [`Home.css`](C:/Users/Hide2/.gemini/study-musume/src/pages/Home.css)、[`Home.jsx`](C:/Users/Hide2/.gemini/study-musume/src/pages/Home.jsx)、[`src/components/game-ui-design/app/globals.css`](C:/Users/Hide2/.gemini/study-musume/src/components/game-ui-design/app/globals.css)、[`src/components/game-ui-design/app/page.tsx`](C:/Users/Hide2/.gemini/study-musume/src/components/game-ui-design/app/page.tsx) から抜き出した実用ルールです。

## 0. 最重要

- 新しい画面を作るときは、まずホーム画面UIをいちばん強い参照元として使う。
- この repo で「このゲームっぽい見た目」の正解は、基本的に [`Home.css`](C:/Users/Hide2/.gemini/study-musume/src/pages/Home.css) と [`Home.jsx`](C:/Users/Hide2/.gemini/study-musume/src/pages/Home.jsx) にある。
- 迷ったら、新しい画面を独自デザインで作るのではなく、「ホーム画面の見た目を別画面用に変形する」発想で組む。
- 特に次はホーム画面寄せを優先する:
  - 大きいメニューボタン
  - 小さいサイドボタン
  - 背景の空気感
  - 情報量の絞り方
  - ソシャゲのメニュー画面としての見せ方

## 1. 全体方針

- 方向性は「学習アプリ」より「ソシャゲのホーム / メニュー画面」。
- 画面は情報一覧ではなく、まず「押したくなるメニュー」を見せる。
- 単純な白背景カード一覧にはしない。
- 文字だけで成立させず、背景レイヤー、発光、装飾、バナー感で世界観を出す。
- ただし情報量は増やしすぎない。目立つ要素は常に 1〜2 個に絞る。
- 新規UIを考えるときは「ホーム画面の兄弟画面に見えるか」で判断する。

## 2. 色ルール

基準色は [`globals.css`](C:/Users/Hide2/.gemini/study-musume/src/components/game-ui-design/app/globals.css) の変数を優先する。

- `--background`: `#1a103a`
- `--foreground`: `#f8f0ff`
- `--game-pink`: `#ff6ba6`
- `--game-blue`: `#4ecfff`
- `--game-gold`: `#ffd642`
- `--game-green`: `#42e695`
- `--game-deep`: `#231550`

使い分け:

- ベース背景は濃い紫系のグラデーション。
- 主役色は `pink / blue / gold` の3軸で回す。
- 成功 / 補助は `green`。
- 文字はほぼ白。補助文字は白の不透明度違いで処理する。
- 真っ黒や真っ白ベタは避け、少し色味を混ぜる。

## 3. 背景ルール

- 背景は単色禁止。最低でも `linear-gradient` 1枚と `radial-gradient` 1〜2枚を重ねる。
- 余白部分が寂しく見える場合は、星・粒・ドット・薄いパターンを足す。
- [`Home.css`](C:/Users/Hide2/.gemini/study-musume/src/pages/Home.css:14) のようなドットパターンか、[`page.tsx`](C:/Users/Hide2/.gemini/study-musume/src/components/game-ui-design/app/page.tsx:25) のような星粒レイヤーを基準にする。
- 背景装飾は常に `pointer-events: none` で、操作UIを邪魔しない。

## 4. パネルルール

- 情報の箱は「管理画面のカード」ではなく「ゲームのパネル」にする。
- 基本は角丸大きめ、半透明、うっすら白ハイライト、内側の細い枠。
- 1枚のパネルに対して:
  - 外枠
  - 薄いグラデーション
  - 斜めハイライト
  - 軽い影
  の4要素を持たせるとゲーム感が出やすい。
- 数字や進捗を見せる場合は、普通の表ではなく「バナー」か「小型ステータスパネル」に寄せる。

## 5. ボタンルール

### 最優先

- 重要ボタンは「ただの角丸ボタン」にしない。
- 可能なら画像ボタンを使う。
- 既存の正解は [`Home.css`](C:/Users/Hide2/.gemini/study-musume/src/pages/Home.css:2743) 以降のホーム用ボタン。
- まず「ホームのボタン画像アセットを流用できないか」を最初に検討する。

### 大ボタン

既存アセット:

- `home-btn-study-primary.png`
- `home-btn-resume-secondary.png`
- `home-btn-battle-accent.png`

ルール:

- ボタンは `background-size: 100% 100%` の画像ベースで見せる。
- `aspect-ratio` を固定して、縦横比を崩さない。
- 枠線は消し、背景画像を主役にする。
- ホバーは `translateY(-4px)` 程度。
- アクティブは少し沈ませる。
- テキストは太字、白、やや広めの字間。

参照:

- [`Home.css`](C:/Users/Hide2/.gemini/study-musume/src/pages/Home.css:2743)
- [`Home.css`](C:/Users/Hide2/.gemini/study-musume/src/pages/Home.css:3045)

### 小ボタン

既存アセット:

- `home-btn-friend-small.png`
- `home-btn-ranking-small.png`
- `home-btn-mission-small.png`
- `home-btn-event-small.png`

ルール:

- サイド配置の小ボタンは、正方形寄りではなく縦長寄り。
- テキスト量は最小限。
- 1ボタン1機能で、説明文は基本なし。

参照:

- [`Home.css`](C:/Users/Hide2/.gemini/study-musume/src/pages/Home.css:3022)
- [`Home.css`](C:/Users/Hide2/.gemini/study-musume/src/pages/Home.css:3183)

## 6. レイアウトルール

- モバイル前提で考える。
- まず「1画面で何を見せるか」を決めてから要素を増やす。
- 重要アクションは上半分に置く。
- ホーム系画面は:
  - 上部にステータス
  - 中央にキャラ or メインバナー
  - 下寄りに主要アクション
  - 補助導線は端に逃がす
  の構成が基準。
- 画面を縦に長くして読ませるより、折りたたんだメニュー画面の発想で作る。

## 7. 文字ルール

- 文字数は少なめ。
- 見出しは短く、力強く。
- 補助文は1行で済む長さにする。
- 1つのボタンに複数の説明を詰め込まない。
- 英単語ラベルは有効。
  - `START`
  - `BATTLE`
  - `STORY`
  - `CHECK`
  - `EVENT`
- ただし英語ラベルは飾りで、意味の本体は日本語タイトル側に持たせる。

## 8. 情報量ルール

- スマホ画面では数値を並べすぎない。
- 同格の小情報を3個以上並べると一気に管理画面になる。
- `連続日数` `直近学習時間` `正答率` のようなメタ情報は、必要な画面だけに出す。
- メニュー画面では「遊び先」が主役。統計は主役にしない。

## 9. アニメーションルール

- 常時アニメーションは最小限。
- 使うなら:
  - 小さな星の点滅
  - シマー
  - ホバー時の軽い浮き
  - 進捗バーの発光
  程度に留める。
- 画面全体がずっと動く演出はやりすぎになりやすい。
- 共通シマーの参照は [`globals.css`](C:/Users/Hide2/.gemini/study-musume/src/components/game-ui-design/app/globals.css:116)。

## 10. 学習画面へ適用するときの判断基準

- `study` のような画面でも、一覧UIに寄せすぎない。
- まず「どのモードに入るか」を決めるメニュー画面として扱う。
- 各教科・各導線は、普通のカード一覧ではなく「ゲームのメニュータイル」にする。
- バナー1枚 + メインボタン群 + 戻る導線、くらいまで削ると世界観が崩れにくい。
- 可能ならホーム画面の `大ボタン3枚構成` や `サイドの補助ボタン構成` を簡略化して持ち込む。

## 11. やってはいけないこと

- 白背景に薄グレー罫線の一般的なSaaSカードをそのまま使う。
- ボタンを全部同じ色・同じ形・同じ情報量で並べる。
- 説明文を2行3行と足して、読むUIにしてしまう。
- 余白が怖くて数値やラベルを足し続ける。
- PCサイトっぽいナビゲーションバーをそのまま上に置く。
- 既存ホームの画像ボタン文化を無視して、全部プレーンなCSSボタンに戻す。

## 12. 実装時の優先参照順

1. [`Home.css`](C:/Users/Hide2/.gemini/study-musume/src/pages/Home.css)
2. [`Home.jsx`](C:/Users/Hide2/.gemini/study-musume/src/pages/Home.jsx)
3. [`src/components/game-ui-design/app/globals.css`](C:/Users/Hide2/.gemini/study-musume/src/components/game-ui-design/app/globals.css)
4. [`src/components/game-ui-design/app/page.tsx`](C:/Users/Hide2/.gemini/study-musume/src/components/game-ui-design/app/page.tsx)
5. [`AGENTS.md`](C:/Users/Hide2/.gemini/study-musume/AGENTS.md)

補足:

- 参照順1位と2位が圧倒的に重要。
- 新規ページのUI提案では、まずホーム画面のどの部品を借りるかを決めてから書く。
- `ホームを参考にする` は比喩ではなく、実際に `Home.css` を正解サンプルとして読む意味。

## 13. 一言でまとめると

`study-musume` のUIは「学習情報を読む画面」ではなく、「ホーム画面UIを基準にしたキャラ付きソシャゲのメニュー画面」として組む。
