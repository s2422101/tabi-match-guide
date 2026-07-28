# デプロイガイド

## 推奨構成

- フロントエンド: Vercel Hobby（Vite静的サイト）
- バックエンド: Render Free Web Service（Hono + Node.js）
- データベース・認証: 既存のSupabaseプロジェクト

現在のHono Nodeアダプターをそのまま使え、フロントだけを静的配信できるため、アプリ本体の変更が最小です。フロントとAPIは別オリジンになるため、API URLとCORSを環境変数で明示します。

## 候補比較

| 構成 | コード変更 | Honoとの相性 | 無料運用 | スリープ | CORS | 発表用途 |
| --- | --- | --- | --- | --- | --- | --- |
| Vercel + Render | 小 | 現在のNodeアダプターを維持 | 両方に無料枠あり | Render APIは15分無通信で停止 | 許可元の設定が必要 | 分離構成を説明しやすい |
| Vercelのみ | 中 | Functions用エントリポイントへの変更が必要 | Hobby枠あり | 常駐サーバーではなくscale-to-zero | 同一オリジン化しやすい | URLは簡潔だが実行モデルが変わる |
| Vercel + Railway | 小 | Nodeサーバーと好相性 | Freeは月$1クレジット | 利用量次第 | 許可元の設定が必要 | Renderより無料継続性の管理が必要 |
| Render単一Web Service | 中 | Nodeサーバーと好相性 | Web Service無料枠あり | UIを含むサービス全体が停止 | 同一オリジン | 初回表示が約1分遅れる可能性 |

Render Freeはポート待受型のHonoをほぼそのまま配置できます。ただし、15分無通信で停止し、復帰に約1分かかることがあります。発表直前に`/api/health`へアクセスして起動しておくか、スリープのない有料インスタンスを検討してください。

## ローカル開発

`VITE_API_BASE_URL`が空または未設定なら、Viteの`/api` proxyが`http://localhost:3000`へ転送します。次のように直接接続することもできます。

```env
VITE_API_BASE_URL=http://localhost:3000
FRONTEND_ORIGINS=http://localhost:5173
```

```bash
npm run dev
```

## ビルド・起動コマンド

フロントエンド:

```bash
npm ci
npm run build:client
```

出力先は`dist`です。`vercel.json`がReact Router用のSPAフォールバックを設定します。

バックエンド:

```bash
npm ci
npm run build:server
npm start
```

出力先は`dist-server`です。サーバーは`PORT`を使用し、`0.0.0.0`で待ち受けます。未設定時のポートは3000です。

## Renderに登録する環境変数

```text
HOTPEPPER_API_KEY
DEEPL_API_KEY
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
ADMIN_EMAILS
FRONTEND_ORIGINS
API_TIMEOUT_MS=10000
```

`FRONTEND_ORIGINS`は完全なオリジンをカンマ区切りで指定します。

```text
http://localhost:5173,https://your-app.vercel.app
```

未設定時は`http://localhost:5173`だけが許可され、全オリジン許可にはなりません。Renderが提供する`PORT`は手動設定不要です。

Render設定:

- Runtime: Node
- Plan: Free
- Build Command: `npm ci && npm run build:server`
- Start Command: `npm start`
- Health Check Path: `/api/health`

`render.yaml`からBlueprintとして作成することもできます。`sync: false`の変数はDashboardで実値を入力してください。

## Vercelに登録する環境変数

```text
VITE_API_BASE_URL=https://tabi-match-guide-api.onrender.com
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Vercel設定:

- Framework Preset: Vite
- Build Command: `npm run build:client`
- Output Directory: `dist`
- Node.js: 24.x

`SUPABASE_SERVICE_ROLE_KEY`、Hot Pepperキー、DeepLキー、`ADMIN_EMAILS`はVercelへ登録しません。

## デプロイ手順

1. `.env`がGit管理外であることを確認してGitHubへpushします。
2. RenderでリポジトリからWeb ServiceまたはBlueprintを作成します。
3. Renderへバックエンド環境変数を登録してAPIをデプロイします。
4. `https://<render-domain>/api/health`が200になることを確認します。
5. Vercelで同じリポジトリをImportし、フロント用の3変数を登録します。
6. Vercelをデプロイし、発行された本番URLを確認します。
7. Renderの`FRONTEND_ORIGINS`へVercel本番URLを追加して再起動します。
8. 必要ならVercelを再デプロイし、一覧・詳細・ログイン・保存を確認します。

Vercel PreviewからAPIも確認する場合は、その時点のPreviewオリジンを`FRONTEND_ORIGINS`へ明示的に追加してください。ワイルドカードや`*`は使用しません。

## Supabase Auth設定

Supabase Dashboardの「Authentication」→「URL Configuration」で設定します。

- Site URL: `https://your-app.vercel.app`
- Redirect URLs:
  - `http://localhost:5173/**`
  - `https://your-app.vercel.app/**`

Preview URLを使う場合だけ、必要なPreviewパターンまたはURLを追加します。本番URLは完全なURLを登録してください。Email providerと管理者ユーザー、Renderの`ADMIN_EMAILS`も確認します。

## 公開後の確認

1. `/api/health`が200を返す。
2. 浅草・上野・全エリアの店舗が取得できる。
3. 翻訳失敗時も日本語原文が表示される。
4. 正式なHot Pepper IDの詳細URLを直接開いても404にならない。
5. 未ログインでは編集ボタンがなく、編集URLはログインへ移動する。
6. 管理者ログイン、再読み込み後のセッション復元、ログアウトが動く。
7. PUTにBearer tokenが付き、未認証は401、非管理者は403、管理者は200になる。
8. Supabaseへ保存した内容が別ブラウザーでも表示される。
9. Vercel以外のOriginからのブラウザーAPI呼び出しがCORSで許可されない。

## セキュリティと運用上の注意

- `.env`、Service Roleキー、Hot Pepperキー、DeepLキーをGitやVercelへ登録しません。
- Viteの`VITE_`変数は公開情報としてJavaScriptへ含まれます。秘密値を設定しないでください。
- 管理者PUTの認証・認可はHono側でも検証します。
- 本番ではログインと更新APIへのレート制限、監査ログ、管理者MFAを検討してください。
- Render Freeのファイルシステムは永続化されません。本アプリの永続データはSupabaseにあるため影響しません。
- Preview URLを広いワイルドカードでCORS許可しないでください。
