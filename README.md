# YouTubeLiveClock Firefox移植版

Firefox 142以降向け。配信終了済みYouTubeアーカイブの再生時間の末尾に、` (2020-07-12 15:23:34)` の形式で配信時刻を追加します。タイムゾーンは端末の現地時刻です。

本家の他の機能は実装していません。

## 導入

1. Firefoxで `about:debugging#/runtime/this-firefox` を開く。
2. 「一時的なアドオンを読み込む」から、このフォルダーの `extension/manifest.json` を選ぶ。
3. YouTubeを開く。すでに開いていたタブは再読み込みする。

一時アドオンはFirefoxの再起動で解除されます。

## 動作

- デスクトップ版 `https://www.youtube.com/watch?v=...` が対象です。
- 現在の動画ID、ライブ由来のフラグ、配信中ではないこと、有効な開始・終了日時を確認できる場合だけ表示します。
- 配信中、配信予定、通常動画、メタデータ不足、広告中には追加表示しません。
- 配信開始日時に再生位置を加算します。配信後のカット編集、欠落区間などによるずれは自動補正しません。
- 再生イベントと250ミリ秒間隔の確認で、シーク、動画遷移、プレイヤー再生成に対応します。
- 外部APIへの通信、データ収集、設定保存は行いません。YouTubeのページ内部仕様の変更により表示できなくなる可能性があります。その場合は元の時間表示を維持します。

## テスト

Node.js 18以降で実行できます。拡張の実行にNode.jsは不要です。

```powershell
node --test test/clock.test.cjs
web-ext lint --source-dir extension
web-ext build --source-dir extension
```
