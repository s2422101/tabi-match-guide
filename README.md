# TabiMatch Guide

浅草・上野周辺の飲食店を、希望条件とのマッチ率と英語翻訳付きで探し、ブラウザーごとのお気に入りへ保存できるReactアプリです。
ホットペッパーグルメAPI、DeepL API、Supabaseは、Honoバックエンドを経由して呼び出します。

以下のコマンドは、プロジェクト直下をカレントディレクトリにして実行してください。

```bash
cd /path/to/tabi-match-guide
```

## 構成

- フロントエンド: React、Vite、TypeScript（`http://localhost:5173`）
- バックエンド: Hono、Node.js、TypeScript（`http://localhost:3000`）
- `GET /api/restaurants?area=all|Asakusa|Ueno`
- `POST /api/translate`
- `GET /api/restaurants/:restaurantId/support`
- `PUT /api/restaurants/:restaurantId/support`
- `GET /api/auth/me`
- 管理者ログイン: `/admin/login`
- お気に入り一覧: `/favorites`

## セットアップ

Node.js 24を使用します（`.nvmrc`と`package.json`で指定）。

```bash
npm install
cp .env.example .env
```

`.env`にAPIキーを設定してください。

```env
HOTPEPPER_API_KEY=your_hotpepper_api_key_here
DEEPL_API_KEY=your_deepl_api_key_here
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here
ADMIN_EMAILS=admin@example.com
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
VITE_API_BASE_URL=http://localhost:3000
FRONTEND_ORIGINS=http://localhost:5173,https://your-app.vercel.app
API_TIMEOUT_MS=10000
```

Hot Pepper、DeepL、Service Roleの各キーには`VITE_`を付けないでください。これらはHonoサーバーのみが参照します。
DeepL API Freeのキーは末尾の`:fx`から自動判定されます。
SupabaseのService Roleキーは強い権限を持つため、フロントエンドへ公開せず、`VITE_`も付けないでください。
`VITE_SUPABASE_ANON_KEY`はブラウザー用のanon keyです。Service Roleキーとは異なり、公開されることを前提としたキーです。

`ADMIN_EMAILS`には、更新を許可するSupabase Authユーザーのメールアドレスをカンマ区切りで指定します。比較時は前後の空白と大文字小文字を無視します。未設定の場合、すべてのPUTが403になります。

## 管理者ユーザー

Supabase Dashboardの「Authentication」→「Users」から「Add user」を選び、メールアドレスと十分に強いパスワードを設定します。そのメールアドレスを`ADMIN_EMAILS`にも追加し、Honoサーバーを再起動してください。一般利用者向けのサインアップ画面は実装していません。

Supabase Dashboardの「Authentication」→「Sign In / Providers」でEmail providerが有効になっていることも確認してください。

## Supabaseテーブル

SupabaseのSQL Editorで次を実行してください。

```sql
create table if not exists public.restaurant_support (
  restaurant_id text primary key,
  name_en text,
  name_ja text,
  feature_statuses jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint restaurant_support_feature_statuses_is_object
    check (jsonb_typeof(feature_statuses) = 'object')
);

alter table public.restaurant_support enable row level security;
revoke all on table public.restaurant_support from anon, authenticated;
grant select, insert, update on table public.restaurant_support to service_role;
```

HonoがService Roleキーでアクセスするため、`anon`や`authenticated`向けのRLSポリシーは作成しません。PUTではHonoがSupabase Authのaccess tokenと`ADMIN_EMAILS`を検証します。本番公開時は、ログイン試行と更新APIへのレート制限、監査ログも追加してください。

## 起動

フロントエンドとバックエンドを同時に起動します。

```bash
npm run dev
```

個別に起動する場合は、別々のターミナルで実行してください。

```bash
npm run dev:server
npm run dev:client
```

バックエンドだけをwatchなしで起動する場合:

```bash
npm run server
```

## 品質確認

```bash
npm run lint
npm run build
```

## APIの確認例

```bash
curl "http://localhost:3000/api/restaurants?area=Asakusa"
```

```bash
curl -X POST "http://localhost:3000/api/translate" \
  -H "Content-Type: application/json" \
  -d '{"text":["浅草駅から徒歩5分です。"]}'
```

店舗独自情報の取得と保存:

```bash
curl "http://localhost:3000/api/restaurants/J001234567/support"

curl -X PUT "http://localhost:3000/api/restaurants/J001234567/support" \
  -H "Authorization: Bearer YOUR_SUPABASE_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name_en":"Example Restaurant","name_ja":"サンプル店舗","feature_statuses":{"credit_card":"supported","vegan":"unknown"}}'
```

GETは未登録の場合に`{"support":null}`を返します。PUTは管理者のBearer tokenが必要で、upsertしたレコードを`support`として返します。トークンなし・無効・期限切れは401、認証済みでも`ADMIN_EMAILS`に含まれない場合は403です。エラーは共通して`{"error":{"code":"...","message":"..."}}`形式です。

以前の`tabi-match-guide:restaurants` localStorageデータがある場合、管理者が編集画面を開いたときに全件をSupabaseへupsertします。全件成功後に旧データを削除し、失敗時は削除せず表示のフォールバックとして保持します。翻訳キャッシュとホットペッパー基本情報の画面遷移用キャッシュは引き続きlocalStorageを使用します。

APIキー未設定時、店舗一覧は既存のサンプルデータへフォールバックします。翻訳に失敗した場合は、localStorageのキャッシュまたは日本語原文を表示します。

## 本番環境について

推奨構成はVercel（フロントエンド）＋Render（Hono API）です。比較、環境変数、デプロイ手順、公開後の確認項目は[DEPLOYMENT.md](./DEPLOYMENT.md)を参照してください。開発時は`VITE_API_BASE_URL`を空にすればViteの`/api` proxyを使用でき、`http://localhost:3000`を指定すればHonoへ直接接続できます。`.env`はGitへコミットしないでください。
