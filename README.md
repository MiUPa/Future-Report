# NeedsCatcher - 需要予測アプリケーション

このアプリケーションは、販売データを基に中長期的な需要予測を行うためのWebアプリケーションです。

## 主な機能

- 複数カテゴリーの管理
- 販売データの入力と管理
- 中長期（1ヶ月以上）の需要予測
- グラフによる視覚化

## 技術スタック

- React
- Material-UI
- Chart.js
- Simple Exponential Smoothing（予測アルゴリズム）

## 使い方

1. カテゴリーを作成
2. 過去の販売データを入力
3. 予測期間を選択
4. 予測結果の確認

## 開発環境のセットアップ

```bash
# 依存関係のインストール
npm install

# 開発サーバーの起動
npm start

# ビルド
npm run build

# GitHub Pagesへのデプロイ
npm run deploy
```

## ライセンス

MIT 