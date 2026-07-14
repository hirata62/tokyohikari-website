# 株式会社東京ひかり不動産 コーポレートサイト

静的HTML/CSS/JSで構築したコーポレートサイト一式です。ビルドツールは不要で、そのまま公開できます。

## ファイル構成

```
website/
├── index.html        … ホーム
├── services.html     … 業務内容
├── strengths.html    … 3つの強み
├── company.html      … 会社概要
├── access.html       … アクセス
├── contact.html      … お問い合わせ
├── privacy.html      … プライバシーポリシー
├── robots.txt
├── sitemap.xml
├── css/style.css
├── js/main.js
└── images/           … 画像を配置（images/README.txt 参照）
```

## 公開前に差し替える項目（各HTML内に「TODO」コメントあり）

1. **ceo.jpg** … 代表写真を `images/` に配置（hero.jpg・ogp.jpg・ロゴ・ファビコンは配置済み。images/README.txt 参照）
2. ~~**strengths.html** … 「3つの強み」の本文を正式な文言に差し替え~~ → 差し替え済み
3. **company.html** … 代表挨拶文・代表写真を差し替え
4. ~~**access.html** … 営業時間を正式なものに修正~~ → 10:00〜19:00で確定済み
5. **contact.html** … GoogleフォームのURLを埋め込み用URLに差し替え
6. **privacy.html** … 現サイトの原文がある場合は差し替え・制定日を記載

## ローカルでの確認方法

このフォルダで簡易サーバーを起動して確認できます。

```bash
# Python がある場合
python -m http.server 8000
# → ブラウザで http://localhost:8000 を開く
```

## 公開方法（Google Sites からの移行）

Google Sites には HTML をアップロードできないため、静的ホスティングへ移行します。

### 推奨：Cloudflare Pages（無料・独自ドメイン可）
1. https://pages.cloudflare.com/ で「Direct Upload」を選択
2. この `website` フォルダの中身をドラッグ&ドロップ
3. 公開後、`tokyohikari.jp` の DNS を Cloudflare 側に向けてカスタムドメイン接続

### 代替：GitHub Pages
1. リポジトリを作成し `website` の中身を push
2. Settings → Pages で公開ブランチを指定
3. カスタムドメイン `tokyohikari.jp` を設定

> DNS を切り替えるまでは現行の Google Sites が表示され続けるため、
> 新サイト完成後に切り替えれば公開の空白期間は発生しません。
