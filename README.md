# ACTIVE14 (Astro)

## 目的
- 既存の静的HTMLをAstroへ移植し、Vercelで運用できる構成に整理。
- `assets/site.css` / `assets/site.js` / `status.json` の仕組みは維持。
- 活動記録はContent Collections + Markdownで管理。

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

## Vercel 設定
- Framework: Astro
- Build command: `npm run build`
- Output directory: `dist`
- Node version (推奨): `18` 以上

## 環境変数
- `AUTH_USER`: ログインID
- `AUTH_PASS`: ログインパスワード
- `AUTH_SECRET`: セッション署名用のランダム文字列
- `GH_OWNER`: GitHubオーナー名
- `GH_REPO`: GitHubリポジトリ名
- `GH_TOKEN`: GitHubアクセストークン（Contents API権限）
- `GH_BRANCH`: 書き込み先ブランチ（任意。未指定なら `main`）

## 投稿フロー
1. `/auth/` でログイン
2. 投稿フォームから送信 → GitHubにMarkdownがコミットされる
3. Vercelの自動デプロイで公開

## 編集者向けテンプレ
- 月次レポートの雛形: `docs/report-template.html`
  - 新しい月次記事を作る際のコピーベースとして利用。

## 動作確認の手順
1. `npm install` → `npm run dev` でローカル起動。
2. 以下のURLを開いてCSSが当たっていることを確認。
   - `/` `/join/` `/about/` `/contact/` `/report/` `/r/2601-1/`
3. ナビゲーションのリンク遷移が壊れていないことを確認。
4. `public/status.json` を `cancelled: true` にしてバナー表示を確認。
5. `data-next-date` が全ページで更新されることを確認。
6. `/auth/` から投稿 → `/r/<id>/` が生成されることを確認。
