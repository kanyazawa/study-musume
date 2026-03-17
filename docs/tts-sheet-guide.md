# TTSシート運用ガイド

スマホ本番で自然な音声を使いたいときは、AivisSpeech で先に音声を書き出して `voice` 列で再生します。

## まず覚えるルール

- `text`: 読ませたいセリフを書く
- `tts_speaker`: だれの声で読むかを書く
- `voice`: 書き出した音声ファイルの場所を書く

アプリの再生順は次です。

1. `voice` があれば、その音声ファイルを再生
2. `voice` がなければ、TTS設定にしたがってAivisSpeechやVOICEVOXを試す
3. それもだめならブラウザTTS

つまり、スマホ本番で声を安定させたいなら `voice` を埋めるのが本命です。

## おすすめの列

```text
scene,id,speaker,text,emotion,next_id,background,voice,se,effect,graph,tts_speaker
```

最低限必要なのは次です。

- `scene`
- `id`
- `speaker`
- `text`

自然な音声運用までやるなら、次も使うのがおすすめです。

- `voice`
- `tts_speaker`

## tts_speaker の書き方

次のどれでも使えます。

- speaker ID
- 話者名
- 話者名 / スタイル名

例:

- `888753760`
- `まお`
- `まお / ノーマル`

迷ったら `話者名 / スタイル名` でそろえるのが安全です。

## voice の書き方

`voice` には `public/audio` から見た相対パスを書きます。

例:

- `tts-generated/chem_01/chem_01-3-まお-888753760.wav`
- `v_a_001`

`v_a_001` のように拡張子なしでも使えます。  
この場合は `/public/audio/v_a_001.mp3` を探します。

`.wav` や `.mp3` まで書いた場合は、そのファイルをそのまま再生します。

## いちばん簡単な運用

1. スプレッドシートでは `text` と `tts_speaker` まで入れる
2. PCで AivisSpeech Engine を起動する
3. 音声生成スクリプトを実行する
4. 出てきた `voice` つきCSVを確認する
5. 問題なければその `voice` をシートに反映する

## コマンド例

確認だけ:

```bash
npm run tts:aivis -- --input src/scenarios/chem_scenario.csv --dry-run
```

音声と `voice` つきCSVを作る:

```bash
npm run tts:aivis -- --input src/scenarios/chem_scenario.csv --write-csv tmp/chem_scenario.with-voice.csv
```

話者のデフォルトを決める:

```bash
npm run tts:aivis -- --input src/scenarios/chem_scenario.csv --fallback-speaker "まお / ノーマル"
```

## シート入力のおすすめ

- ノア用の行は `tts_speaker` を毎回同じ表記にそろえる
- 主人公や地の文は、必要な行だけ `tts_speaker` を入れる
- `Quiz` や `System` の行は音声化しない前提でOK

## サンプル

```csv
scene,id,speaker,text,emotion,next_id,background,voice,se,effect,graph,tts_speaker
chem_01,1,ノア,この平衡定数の計算、やってみよう！,happy,2,bg_lab,,se_correct,,,,まお / ノーマル
chem_01,2,主人公,うん、頑張るよ！,normal,3,,,,,,,,
chem_01,3,ノア,まずはこのグラフを見て。二次関数 y=x^2 よ。,normal,4,,,,,x^2,,,まお / ノーマル
chem_01,4,Quiz,平衡定数Kの式はどれ？,,5,,,,,,,生成物の濃度/反応物の濃度,反応物の濃度/生成物の濃度,,1
chem_01,5,ノア,正解！よくできたね！,happy,end,,,,se_correct,,,,まお / ノーマル
```
