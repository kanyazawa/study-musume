# Push Preflight Checklist

公開反映まわりで詰まりやすかった点だけを、最短で確認できる形にまとめたメモです。

## 使いどころ

- GitHub に push して Netlify / Pages に反映したいとき
- `localhost` では動くのに本番デプロイでだけ落ちるのを防ぎたいとき
- `C:\Dev\study-musume` と `.gemini\study-musume` の見分けで迷いたくないとき

## 先に見ること

1. 公開元の作業場所が合っているか確認する  
   GitHub に出したい変更は、基本的に `C:\Dev\study-musume` 側で commit / push する
2. いま見ているローカル URL が合っているか確認する  
   ポート違いで古いサーバーを見ていないかを先に見る
3. 未追跡ファイルが残っていないか確認する  
   `??` があるまま push すると、ローカルでは動くのに本番だけ壊れやすい

## Push 前チェック

1. 作業場所を確認する

```powershell
pwd
git branch --show-current
git remote -v
```

2. 差分と未追跡ファイルを確認する

```powershell
git status --short
```

見るポイント:

- `??` があれば、必要なファイルを add し忘れていないか確認する
- 触る予定のないファイルが混ざっていたら、commit 対象を絞る

3. 本番ビルドが通るか確認する

```powershell
npm run build
```

4. import の大文字小文字を確認する

```powershell
rg -n "components/layout|components/Layout" src
```

見るポイント:

- Windows では動いても、Netlify の Linux では `Layout` と `layout` の違いで落ちる
- ファイル名と import パスの大文字小文字をそろえる

5. commit 対象だけを add する

```powershell
git add <必要なファイルだけ>
git status --short
```

見るポイント:

- `git add .` より、必要ファイルだけを明示した方が安全
- 他の作業中ファイルを巻き込まない

6. commit と push を実行する

```powershell
git commit -m "fix: ..."
git push origin main
```

## Push 後チェック

1. GitHub の commit が想定どおりか確認する
2. Netlify / Pages の最新 deploy がその commit を拾っているか確認する
3. `Published` になるまで待ってから本番 URL を再読み込みする

## よくある事故

### ローカルでは動くのに本番でだけ落ちる

原因になりやすいもの:

- `git status` の `??` を残したまま push した
- import の大文字小文字がずれている
- いま見ているローカルサーバーが別クローンのものだった

### 何も変わっていないように見える

先に確認すること:

- push した先の branch が合っているか
- deploy が失敗していないか
- 本番 URL ではなく古い `localhost` を見ていないか

## このプロジェクト用の覚え書き

- `.gemini\study-musume` は作業検証用として使うことがある
- `C:\Dev\study-musume` は GitHub / 公開反映の基準にしやすい
- 開発サーバーのポート違いで混線しやすいので、URL も毎回確認する

迷ったら最低でも次の3つだけ見ればかなり防げます。

```powershell
git status --short
npm run build
git push origin main
```
