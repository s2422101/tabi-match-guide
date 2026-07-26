import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { validator } from "hono/validator";
import { translateTexts } from "./deepl.js";
import { loadServerEnvironment, logEnvironmentStatus } from "./env.js";
import { ApiError, errorBody } from "./errors.js";
import { getRestaurants, type SearchArea } from "./hotpepper.js";

const environmentStatus = loadServerEnvironment();
const app = new Hono();
const port = 3000;
const validAreas: SearchArea[] = ["all", "Asakusa", "Ueno"];
const allowedOrigins = (process.env.CORS_ORIGIN || "http://localhost:5173")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  "/api/*",
  cors({
    origin: allowedOrigins,
    allowHeaders: ["Content-Type"],
    allowMethods: ["GET", "POST", "OPTIONS"],
    maxAge: 600,
  }),
);

app.get("/api/health", (c) => c.json({ status: "ok" }));

app.get(
  "/api/restaurants",
  validator("query", (query, c) => {
    const area = query.area || "all";

    if (!validAreas.includes(area as SearchArea)) {
      return c.json(
        errorBody(
          "INVALID_AREA",
          "area must be one of: all, Asakusa, Ueno.",
        ),
        400,
      );
    }

    return { area: area as SearchArea };
  }),
  async (c) => {
    const { area } = c.req.valid("query");
    const restaurants = await getRestaurants(area, c.req.raw.signal);
    return c.json({ restaurants });
  },
);

app.post(
  "/api/translate",
  validator("json", (body, c) => {
    const text = body.text;

    if (
      !Array.isArray(text) ||
      text.length === 0 ||
      text.length > 50 ||
      text.some((item) => typeof item !== "string" || !item.trim())
    ) {
      return c.json(
        errorBody(
          "INVALID_TRANSLATION_INPUT",
          "text must contain between 1 and 50 non-empty strings.",
        ),
        400,
      );
    }

    if (new TextEncoder().encode(JSON.stringify({ text })).byteLength > 128 * 1024) {
      return c.json(
        errorBody(
          "TRANSLATION_INPUT_TOO_LARGE",
          "The translation request must not exceed 128 KiB.",
        ),
        400,
      );
    }

    return { text: text as string[] };
  }),
  async (c) => {
    const { text } = c.req.valid("json");
    const result = await translateTexts(text, c.req.raw.signal);
    return c.json(result);
  },
);

app.notFound((c) =>
  c.json(errorBody("NOT_FOUND", "The requested API route was not found."), 404),
);

app.onError((error, c) => {
  if (error instanceof ApiError) {
    return c.json(errorBody(error.code, error.message), error.status);
  }

  console.error(error);
  return c.json(
    errorBody("INTERNAL_SERVER_ERROR", "An unexpected server error occurred."),
    500,
  );
});

const server = serve(
  {
    fetch: app.fetch,
    hostname: "localhost",
    port,
  },
  (info) => {
    logEnvironmentStatus(environmentStatus);
    console.log(`API server is running on http://localhost:${info.port}`);
  },
);

function shutdown() {
  server.close(() => process.exit(0));
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
