import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { validator } from "hono/validator";
import {
  isAdminEmail,
  requireAdminUser,
  requireAuthenticatedUser,
} from "./auth.js";
import { translateTexts } from "./deepl.js";
import { loadServerEnvironment, logEnvironmentStatus } from "./env.js";
import { ApiError, errorBody } from "./errors.js";
import { getRestaurants, type SearchArea } from "./hotpepper.js";
import {
  validateRestaurantId,
  validateRestaurantSupportInput,
} from "./restaurantSupport.js";
import {
  getRestaurantSupport,
  upsertRestaurantSupport,
} from "./supabase.js";

const environmentStatus = loadServerEnvironment();
const app = new Hono();
const configuredPort = Number(process.env.PORT);
const port =
  Number.isInteger(configuredPort) && configuredPort > 0 && configuredPort <= 65_535
    ? configuredPort
    : 3000;
const validAreas: SearchArea[] = ["all", "Asakusa", "Ueno"];
const defaultFrontendOrigin = "http://localhost:5173";
const configuredOrigins = (process.env.FRONTEND_ORIGINS || defaultFrontendOrigin)
  .split(",")
  .map((origin) => origin.trim().replace(/\/+$/, ""))
  .filter((origin) => {
    try {
      const url = new URL(origin);
      return (
        (url.protocol === "http:" || url.protocol === "https:") &&
        url.origin === origin
      );
    } catch {
      return false;
    }
  });
const allowedOrigins =
  configuredOrigins.length > 0 ? configuredOrigins : [defaultFrontendOrigin];

app.use(
  "/api/*",
  cors({
    origin: allowedOrigins,
    allowHeaders: ["Authorization", "Content-Type"],
    allowMethods: ["GET", "POST", "PUT", "OPTIONS"],
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

app.get("/api/restaurants/:restaurantId/support", async (c) => {
  const restaurantId = validateRestaurantId(c.req.param("restaurantId"));
  const support = await getRestaurantSupport(restaurantId);
  return c.json({ support });
});

app.get("/api/auth/me", async (c) => {
  const user = await requireAuthenticatedUser(c.req.header("Authorization"));
  return c.json({
    user: { email: user.email ?? null },
    is_admin: isAdminEmail(user.email),
  });
});

app.put("/api/restaurants/:restaurantId/support", async (c) => {
  await requireAdminUser(c.req.header("Authorization"));

  let body: unknown;

  try {
    body = await c.req.json();
  } catch {
    throw new ApiError(400, "INVALID_JSON", "A valid JSON body is required.");
  }

  const input = validateRestaurantSupportInput(
    c.req.param("restaurantId"),
    body,
  );
  const support = await upsertRestaurantSupport(input);
  return c.json({ support });
});

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
    hostname: "0.0.0.0",
    port,
  },
  (info) => {
    logEnvironmentStatus(environmentStatus);
    console.log(`API server is listening on port ${info.port}`);
  },
);

function shutdown() {
  server.close(() => process.exit(0));
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
