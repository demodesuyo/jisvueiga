# 自主映画ねっと — サイト一式

自主映画の監督と観客をつなぐプラットフォームのサイトです。
デザインテーマ: **ライト×きらめき（陽に照らされた海、波光ときらめき）

## ページ構成

```
index.html                  トップ（映写光ヒーロー・上映中の作品・投稿の流れ）
works/index.html            作品一覧（現在はサンプル6作品）
guide/index.html            投稿方法（3ステップ+FAQ）
contact/index.html          お問い合わせ・作品投稿フォーム
contact/thanks/index.html   送信完了（noindex済み・CV計測地点）
privacy/index.html          プライバシーポリシー
sitemap.xml / robots.txt    生成済み（本番URL: jisyueiga.net）
```

パスは**すべて相対パス**なので、GitHub Pagesのサブディレクトリ公開（`username.github.io/リポジトリ名/`）でもそのまま動きます。

## どこを触れば何が変わるか

| 変えたいもの | 触る場所 |
|---|---|
| 配色（星あかりの色など） | `assets/css/style.css` 冒頭の `:root` 変数。色は全てここ経由 |
| ヒーローの星の数・流れ星の頻度 | `assets/js/main.js` の `initDust()` 内 `COUNT` と流れ星の発生確率(0.004) |
| 文字点灯のタイミング | `style.css` の `charSheen` と `.hero__title .char` の delay |
| 作品カード | `index.html` と `works/index.html` の `.film-card`。ポスターは `assets/img/works/` |
| 光のちらつき | `style.css` の `beamFlicker`（不要なら animation 行を削除） |

## サンプルポスターの差し替え

`assets/img/works/film-01.svg` 〜 `film-06.svg` はサンプルです。
実作品のポスターに差し替える場合: **縦2:3（推奨 960×1440px以上）**のWebP/JPEGを同じ場所に置き、HTMLの `src` と `alt` を変更してください。表示サイズの2倍で書き出すと綺麗に出ます。

## フォームを本番で動かす（公開前に必須）

現在フォームは**デモモード**（送信せずサンクスページへ遷移）です。

1. [Formspree](https://formspree.io/)（無料枠あり）でアカウントを作り、フォームを作成してエンドポイントURLを取得
2. `contact/index.html` の `<form ...>` から `data-demo` と `data-thanks="thanks/"` を削除
3. `action="thanks/"` を `action="https://formspree.io/f/あなたのID"` に変更
4. Formspree側の設定でリダイレクト先を `https://jisyueiga.net/contact/thanks/` に指定
5. 公開後に**テスト送信を1通**行い、メールが届くことを確認

ハニーポット（`.form__hp`）はスパム対策なので削除しないでください。

## GitHub Pagesでの公開（iPhoneからの手順）

1. GitHub（アプリまたはSafari）でリポジトリを作成（例: `eigakantoku-site`）
2. このzipの中身をリポジトリのルートにアップロード
3. Settings → Pages → Branch を `main` / `(root)` にして Save
4. 数分後 `https://ユーザー名.github.io/eigakantoku-site/` で公開

独自ドメイン（jisyueiga.net）を使う場合は Pages 設定の Custom domain に入力し、DNSのCNAMEを設定してください。

## 公開前チェックリスト

- [ ] フォームを本番モードに切り替え、テスト送信（上記）
- [ ] 独自ドメイン以外で公開する場合、全HTMLの `og:url` / `canonical` と `sitemap.xml` のURLを公開URLに置換
- [ ] `assets/img/common/ogp.png` は自動生成の仮画像。SNSでの見え方が気になる場合はデザイン画像に差し替え
- [ ] アクセス解析を入れる場合はGA4のタグを各ページ `</head>` 直前に追加

## 技術メモ

- フォント（Zen Old明朝 / Zen角ゴシックNew / IBM Plex Mono）はGoogle Fonts CDNから読み込むため、**オフラインでは表示が変わります**
- アニメーションは transform / opacity のみ。OSで「視差効果を減らす」を設定している閲覧者には「アニメーションを停止する」ボタンが表示されます
- 検証環境の視覚QAで出る `403` エラーは検証サンドボックスの外部接続制限によるもので、本番環境では発生しません

## バージョン履歴

- v1.0 (2026-07-08): 星空版。映写機テーマ版と同構成・別テーマ
