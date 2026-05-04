# Grammar Lesson Rules

`study-musume` の文法授業を増やすときの共通ルール。

## Goal

- 1授業 = 1テーマに絞る
- 説明を長くしすぎず、例文と確認問題で理解させる
- `Dialogue` でそのまま再生できるデータ形式にそろえる

## Default Structure

1. 導入 `1〜2行`
2. 解説 `2〜4行`
3. `choice` 問題 `1問`
4. 解説 `2〜4行`
5. `choice` 問題 `1問`
6. `reorder` 問題 `2〜3問`
7. まとめ `1〜2行`

目安:

- `talk`: `8〜10行`
- `choice`: `2問`
- `reorder`: `2〜3問`
- 全体: `12〜17行`

## Allowed Kinds

- `talk`: 通常の授業会話
- `choice`: 3択問題
- `reorder`: 並び替え問題
- `fill_blank`: 穴埋め問題
- `error_fix`: 誤文訂正問題

新しい種類を増やすときは、先に `Dialogue.jsx` 側の対応を入れてから使う。

## Writing Style

- ノアの説明は短めにする
- 1行で1つのことだけ言う
- 日本語で説明して、英語例文は短く保つ
- 最初から細かい例外を入れすぎない
- まず基本を固めてから応用へ進む
- 断定しすぎず、やさしく教える

## Lesson Scope

- 1授業で扱う文法ポイントは1つ
- 近い文法との差は最後に軽く触れる程度
- 応用や例外は別授業に分けてよい

例:

- `5.1 基本3用法`
- `5.2 応用表現`
- `6.1 基本用法`

## Choice Rules

- 選択肢は常に3つ
- 正解は `answer: '1' | '2' | '3'`
- ひっかけだけで難しくしない
- 習っていない論点を混ぜない
- `explanation` は短く、正誤の理由がすぐ分かる内容にする

## Fill Blank Rules

- 空欄は1つだけにする
- 初期は3択で出す
- 語彙ではなく文法判断が中心になるようにする
- 文全体を見れば根拠が分かる問題にする

## Error Fix Rules

- まちがいは1か所だけにする
- 正解候補は自然な英文にする
- 不自然すぎるダミーを増やしすぎない
- 今回学んだ文法の典型ミスを狙う

## Reorder Rules

- 1問 `4〜8トークン` を基本にする
- 長すぎる文は避ける
- 今回学んだ文法が答えの中心になるようにする
- `tokens` は配列で持つ
- 句読点は必要ならトークン側に含める
- `answer_text` は表示したい正解文そのものを書く

例:

```js
{
  kind: 'reorder',
  text: '「私は本を読むことが好きです」を英語に並び替えよう。',
  answer_text: 'I like to read books.',
  tokens: ['I', 'like', 'to', 'read', 'books.'],
  explanation: 'to read books が like の目的語になっているので名詞的用法だよ。'
}
```

## Data Rules

- 授業データは `src/data/grammarLessons.js` に置く
- キーは `topic` 名と一致させる
- 各行は `scene`, `order`, `kind`, `speaker`, `text` を基本に持つ
- `background` は省略しない
- `next` は必ず次の `order` か `end`

## Naming Rules

- `scene`: 授業名そのもの
- `order`: `'1'`, `'2'` のように文字列
- `speaker`: 通常は `ノア`、問題は `Quiz`
- `background`: 基本は `bg_classroom`

## Expression Rules

- 表情は `emotion` を基本に使う
- 推奨値は `normal`, `happy`, `smile`, `serious`, `angry`, `surprised`, `relaxed`, `shy`
- 解説モードは `emotion: 'explain'` と書いてよく、実行時に落ち着いた説明表情へ寄せる
- `expression` を別で持たせたいときは上書きしてよい
- `tts: 'off'` を入れた行は自動読み上げしない

## Quality Check

授業を追加するときは最低限これを確認する。

- 途中で論点が増えすぎていないか
- `choice` が知識確認になっているか
- `reorder` が語彙テストではなく文法確認になっているか
- `explanation` を読めば間違いの理由が分かるか
- 最後のまとめが授業全体を回収しているか

## Recommended Workflow

1. 授業テーマを1つ決める
2. 先に構成だけ並べる
3. `talk` を埋める
4. `choice` を2問入れる
5. `reorder` を2〜3問入れる
6. 最後にまとめを書く
7. アプリで実際に通して、長さと難度を確認する
