# Live2D Guide Sheet PSD Workflow

このワークフローは、`Live2D用のパーツ分けガイド画像` から

- パーツPNGの仮抽出
- レイヤー構成manifestの生成
- グループ付きPSDの自動書き出し

までをまとめて進めるためのものです。

## 追加したスクリプト

- `scripts/extract-live2d-guide-sheet.mjs`
  - ガイド画像をゾーン分けして、白背景から大きめの部品を抽出します。
  - 抽出したPNGを `output/live2d-guide/.../parts/` に保存します。
  - 同時に PSD 用 manifest JSON を作ります。
- `scripts/build-live2d-psd-from-manifest.mjs`
  - manifest JSON を読んで、レイヤーグループ付き PSD を作ります。
  - あわせて確認用 preview PNG も出します。
- `scripts/presets/live2d-guide-sheet-default.json`
  - 今回のような「顔 / 髪 / 体 / 腕 / 下半身 / エフェクト」に分かれたガイド画像向けの初期ゾーン設定です。

## まずやること

この会話の画像をローカルに置いてから、次を実行します。

```powershell
node scripts/extract-live2d-guide-sheet.mjs .\your-guide-image.png
```

生成されるもの:

- `output/live2d-guide/<画像名>/<画像名>-manifest.json`
- `output/live2d-guide/<画像名>/<画像名>.psd`
- `output/live2d-guide/<画像名>/<画像名>-preview.png`
- `output/live2d-guide/<画像名>/parts/...`

## manifest だけ作りたい場合

```powershell
node scripts/extract-live2d-guide-sheet.mjs .\your-guide-image.png --no-psd
```

そのあと manifest を少し直してから PSD 化できます。

```powershell
node scripts/build-live2d-psd-from-manifest.mjs .\output\live2d-guide\your-guide-image\your-guide-image-manifest.json
```

抽出後に名前整理もまとめて進めたい場合は、`curate-live2d-guide-manifest` が使えます。

```powershell
node scripts/curate-live2d-guide-manifest.mjs .\output\live2d-guide\your-guide-image\your-guide-image-manifest.json
```

今回の制服キャラ向けに寄せたい場合は、`school-girl` プロファイルを付けます。

```powershell
node scripts/curate-live2d-guide-manifest.mjs .\output\live2d-guide\your-guide-image\your-guide-image-manifest.json --profile school-girl
```

## 注意点

- これは「完成PSD」ではなく「仮パーツPSD」を作る自動化です。
- 白背景上の大きめのパーツ検出に寄せているため、文字や見出しが混ざることがあります。
- 特に `口`, `小さな目パーツ`, `頬赤`, `細い髪束` は手調整が入りやすいです。
- 髪の裏側、顔の隠れた輪郭、口内などの見えない部分は自動生成しません。

## 調整ポイント

ゾーンや閾値は `scripts/presets/live2d-guide-sheet-default.json` で調整できます。

- `rect`
  - 0〜1 の正規化座標です。
- `excludeTopRatio`
  - 見出しやラベルを避けるため、ゾーン上部を無視する比率です。
- `whiteThreshold`
  - 白背景判定のしきい値です。
- `minPixels`, `minWidth`, `minHeight`
  - 小さすぎる文字やゴミを落とすための条件です。

## 実務向けのおすすめ

1. まず `--no-psd` で manifest と PNG 抽出だけ確認する
2. 余計なレイヤーや足りないレイヤーを manifest で整理する
3. `build-live2d-psd-from-manifest` で PSD を再生成する
4. Photoshop / Clip Studio で描き足しを入れる
5. その後に Live2D Cubism へ持っていく

## この立ち絵向けの最小レイヤー構成

今回のような `正面寄り / 全身 / 制服 + パーカー` の立ち絵は、
最初からフル可動を狙うよりも、次のような軽量構成で始めると安全です。

- `01_face`
  - `face_base`
  - `face_shadow`
  - `neck`
  - `brow_L`, `brow_R`
  - `eye_white_L`, `eye_white_R`
  - `eye_iris_L`, `eye_iris_R`
  - `eye_highlight_L`, `eye_highlight_R`
  - `eyelid_upper_L`, `eyelid_upper_R`
  - `eyelid_lower_L`, `eyelid_lower_R`
  - `mouth_base`
  - `mouth_open`
  - `mouth_inner`
  - `blush`
- `02_hair`
  - `hair_back`
  - `hair_back_L`, `hair_back_R`
  - `hair_side_L`, `hair_side_R`
  - `hair_front_center`
  - `hair_front_L`, `hair_front_R`
  - `hair_tip_L`, `hair_tip_R`
  - `ahoge`
- `03_body`
  - `torso_base`
  - `shirt_collar_L`, `shirt_collar_R`
  - `ribbon_center`, `ribbon_L`, `ribbon_R`
  - `cardigan_inner`
  - `hoodie_body`
  - `hoodie_hem`
  - `hoodie_zipper_L`, `hoodie_zipper_R`
  - `hoodie_string_L`, `hoodie_string_R`
  - `hoodie_hood`
- `04_arms_hands`
  - `arm_upper_L`, `arm_upper_R`
  - `sleeve_L`, `sleeve_R`
  - `cuff_L`, `cuff_R`
  - `hand_L`, `hand_R`
- `05_lower_body`
  - `skirt_base`
  - `skirt_front_L`, `skirt_front_C`, `skirt_front_R`
  - `leg_L`, `leg_R`
  - `sock_L`, `sock_R`
  - `shoe_L`, `shoe_R`
- `06_expressions`
  - `exp_eye_smile_L`, `exp_eye_smile_R`
  - `exp_eye_closed_L`, `exp_eye_closed_R`
  - `exp_brow_angry_L`, `exp_brow_angry_R`
  - `exp_brow_sad_L`, `exp_brow_sad_R`
  - `exp_mouth_smile`
  - `exp_mouth_open_small`
  - `exp_mouth_open_wide`
  - `exp_mouth_sad`
  - `exp_blush_soft`
  - `exp_blush_shy`

この構成なら、`まばたき / 視線 / 口パク / 呼吸 / 髪揺れ / 袖の遅れ` までは十分に対応しやすいです。

## manifest 整理の考え方

抽出直後の manifest は、ゾーン単位で `..._01`, `..._02` のような仮名になりやすいです。
そのまま PSD にするより、次の順番で整理すると Live2D 化しやすくなります。

1. まず `01_face` などのグループに寄せる
2. 次に「何の部位か」が分かる名前へ変える
3. 可動に使わないゴミパーツや文字を落とす
4. 足りない部分は後から手描きレイヤーで足す

よくある置き換えの目安:

| 抽出後の仮名 | 整理後の候補 |
| --- | --- |
| `face_base_01` | `face_base` |
| `eye_left_01` | `eye_white_L` |
| `eye_left_02` | `eye_iris_L` |
| `eye_right_01` | `eye_white_R` |
| `eye_right_02` | `eye_iris_R` |
| `mouth_01` | `mouth_base` |
| `mouth_02` | `mouth_open` |
| `hair_front_01` | `hair_front_center` |
| `hair_front_02` | `hair_front_L` |
| `hair_front_03` | `hair_front_R` |
| `hair_side_01` | `hair_side_L` |
| `hair_side_02` | `hair_side_R` |
| `body_clothes_01` | `torso_base` |
| `body_clothes_02` | `hoodie_body` |
| `arms_hands_01` | `sleeve_L` |
| `arms_hands_02` | `sleeve_R` |
| `arms_hands_03` | `hand_L` |
| `arms_hands_04` | `hand_R` |
| `lower_body_01` | `skirt_base` |
| `lower_body_02` | `leg_L` |
| `lower_body_03` | `leg_R` |

## manifest の最小サンプル

`build-live2d-psd-from-manifest.mjs` が読む最小形は次のようなものです。
実際には `source` と `left`, `top` を抽出結果に合わせて埋めます。

すぐ使える雛形は `scripts/presets/live2d-school-girl-curated-manifest-template.json` に置いてあります。
これは `00_reference`, `output`, `metadata` まで含めた整理用テンプレートです。

既存の抽出 manifest から始めるなら、まず `--profile school-girl` で自動リネームした上で、
足りないレイヤーだけこのテンプレートの命名へ寄せていくと作業しやすいです。

```json
{
  "name": "school-girl-guide-curated",
  "canvas": { "width": 1536, "height": 3072 },
  "children": [
    {
      "name": "01_face",
      "children": [
        { "name": "face_base", "source": "parts/face/face_base.png", "left": 420, "top": 110 },
        { "name": "eye_white_L", "source": "parts/face/eye_white_L.png", "left": 503, "top": 182 },
        { "name": "eye_iris_L", "source": "parts/face/eye_iris_L.png", "left": 516, "top": 190 },
        { "name": "mouth_base", "source": "parts/face/mouth_base.png", "left": 560, "top": 278 }
      ]
    },
    {
      "name": "02_hair",
      "children": [
        { "name": "hair_back", "source": "parts/hair/hair_back.png", "left": 370, "top": 54 },
        { "name": "hair_front_center", "source": "parts/hair/hair_front_center.png", "left": 498, "top": 68 }
      ]
    }
  ]
}
```

## この立ち絵で描き足し前提の場所

抽出だけでは足りないので、少なくとも次は手で補う前提にしておくと安心です。

- 前髪の下に隠れている額
- 髪で隠れている顔輪郭
- 口を開けたときの口内
- パーカーの下に隠れている制服の続き
- スカートの下に隠れている太もも上部
- 髪の裏面

ここを補っておくと、`顔の左右振り`, `呼吸`, `軽い体傾き` の破綻がかなり減ります。
