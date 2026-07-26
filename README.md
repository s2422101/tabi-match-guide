# TabiMatch Guide

浅草・上野周辺の飲食店を、希望条件とのマッチ率と英語翻訳付きで探せるReactアプリです。
ホットペッパーグルメAPIとDeepL APIは、Honoバックエンドを経由して呼び出します。

以下のコマンドは、プロジェクト直下をカレントディレクトリにして実行してください。

```bash
cd /path/to/tabi-match-guide
```

## 構成

- フロントエンド: React、Vite、TypeScript（`http://localhost:5173`）
- バックエンド: Hono、Node.js、TypeScript（`http://localhost:3000`）
- `GET /api/restaurants?area=all|Asakusa|Ueno`
- `POST /api/translate`

## セットアップ

Node.js 20以降を推奨します。

```bash
npm install
cp .env.example .env
```

`.env`にAPIキーを設定してください。

```env
HOTPEPPER_API_KEY=your_hotpepper_api_key_here
DEEPL_API_KEY=your_deepl_api_key_here
CORS_ORIGIN=http://localhost:5173
API_TIMEOUT_MS=10000
```

環境変数に`VITE_`を付けないでください。APIキーはHonoサーバーのみが参照します。
DeepL API Freeのキーは末尾の`:fx`から自動判定されます。

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

APIキー未設定時、店舗一覧は既存のサンプルデータへフォールバックします。翻訳に失敗した場合は、localStorageのキャッシュまたは日本語原文を表示します。

## 本番環境について

Viteの`/api` proxyは開発用です。本番ではリバースプロキシやホスティング設定で、フロントエンドの`/api`をHonoバックエンドへ転送してください。`.env`はGitへコミットしないでください。
