# Pre1 Clean-Room Workflow

## Goal

公開向けに、外部サイト由来の疑いがある準1級語彙を、自作データへ段階的に置き換える。

## Rule

- 外部サイトの一覧を見ながら、そのまま転記しない
- 単語の採用基準は自分で決める
- 意味は自分の言葉で書く
- 可能なら例文も自作する
- 置換理由を短く残す

## Safe Process

1. 既存の `VOCAB_GRADE_PRE1` から見直したい語を選ぶ
2. その語を残すか、別語へ置き換えるか決める
3. 意味を自分で書く
4. `src/data/customPre1Vocab.js` に追加する
5. 必要なら `CUSTOM_PRE1_REVIEW_NOTES` に理由を残す

## Add Example

```js
export const CUSTOM_VOCAB_GRADE_PRE1 = [
  { word: 'cohesive', meaning: 'まとまりのある、一体感のある' },
];

export const CUSTOM_PRE1_REVIEW_NOTES = [
  {
    replace: 'abdicate',
    replacement: 'cohesive',
    reason: '既存データを使わず、自作語彙へ差し替え'
  }
];
```

## Review Checklist

- 単語選定は自分基準になっているか
- 意味文が自分の表現になっているか
- 並び順を外部一覧に寄せていないか
- 同じ語数・同じ並びを再現していないか
- コメントに置換理由を残したか
