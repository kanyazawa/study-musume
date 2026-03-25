# Live2D Setup

このプロジェクトでは、`CharacterStage` が `image / live2d` の描画方式を切り替えます。  
`stats.characterRenderer` が `auto` のときは既存の画像表示を使い、`live2d` を明示的に選んだときだけ Live2D を優先します。

## いま入っている土台

- 共通描画入口: `src/components/character/CharacterStage.jsx`
- Live2D 受け皿: `src/components/character/Live2DViewer.jsx`
- モデル設定: `src/utils/live2dModelRegistry.js`
- レンダラー自動選択: `src/utils/characterRenderer.js`

現時点では Cubism SDK 本体は未同梱です。  
そのため、モデル設定がなければ自動で既存画像表示へ戻ります。

## 推奨配置

公式の `Cubism SDK for Web` とモデル書き出しデータは、次のように置く前提で進めるのが管理しやすいです。

```text
public/
  live2d/
    sdk/
      ... Cubism SDK for Web runtime files ...
    models/
      noah/
        noah.model3.json
        noah.moc3
        textures/
        motions/
        expressions/
      ren/
        ren.model3.json
        ren.moc3
        textures/
        motions/
        expressions/
```

## モデル登録

`src/utils/live2dModelRegistry.js` にモデル設定を追加します。

例:

```js
const LIVE2D_MODEL_REGISTRY = {
    noah: {
        default: {
            modelId: 'noah-base',
            modelJson: '/live2d/models/noah/noah.model3.json',
        },
    },
    ren: {
        default: {
            modelId: 'ren-base',
            modelJson: '/live2d/models/ren/ren.model3.json',
        },
    },
};
```

この設定を入れると、`characterRenderer: 'live2d'` を選んだ時に Live2D を使えるようになります。

## 今後の接続ポイント

`Live2DViewer.jsx` には次の接続ポイントを残しています。

- `modelConfig.modelJson`
- `pose.expression`
- `pose.speaking`
- `pose.text`

次の実装ではここに Cubism の初期化、モデルロード、表情切替、口パク、モーション再生を入れます。

## 導入時の確認項目

- `noah.model3.json` と関連ファイルが `public/live2d/models/...` にある
- `src/utils/live2dModelRegistry.js` に正しいパスが入っている
- `stats.characterRenderer` が `auto` または `live2d`
- `npm run build` が通る

## 次にやること

1. 公式 SDK ファイルを `public/live2d/sdk/` に配置
2. ノアの `.model3.json` を登録
3. `Live2DViewer.jsx` に Cubism 初期化を実装
4. `pose.expression` を Live2D パラメータに対応付け
5. `pose.speaking` と `text` から口パクを連動
