# ACTIVE14 (Astro)

## 目的
- 既存の静的HTMLをAstroへ移植し、Cloudflare Pagesで運用できる構成に整理。
- `assets/site.css` / `assets/site.js` / `status.json` の仕組みは維持。

## セットアップ
```bash
npm install
```

## 開発
```bash
npm run dev
```

## ビルド
```bash
npm run build
```

## プレビュー
```bash
npm run preview
```

## Cloudflare Pages 設定
- Build command: `npm run build`
- Build output directory: `dist`
- Node version (推奨): `18` 以上

`public/_headers` で `/status.json` に `Cache-Control: no-store` を付与しています。

## 編集者向けテンプレ
- 月次レポートの雛形: `docs/report-template.html`
  - 新しい月次記事を作る際のコピーベースとして利用。

## 動作確認の手順
1. `npm install` → `npm run dev` でローカル起動。
2. 以下のURLを開いてCSSが当たっていることを確認。
   - `/` `/join/` `/about/` `/contact/` `/report/` `/report/2026-01/`
3. ナビゲーションのリンク遷移が壊れていないことを確認。
4. `public/status.json` を `cancelled: true` にしてバナー表示を確認。
5. `data-next-date` が全ページで更新されることを確認。
