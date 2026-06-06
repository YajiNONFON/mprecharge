import express from "express";
import cors from "cors";
import swaggerUi from "swagger-ui-express";
import helmet from "helmet";
import cookieParser from "cookie-parser";
//import * as Sentry from "@sentry/node";
import { errorMiddleware } from "./shared/middlewares/error.middleware";
import { swaggerSpec } from "../docs/swagger";
import { sanitizeMiddleware } from "./shared/middlewares/sanitize.middleware";

export const app = express();

// ─── Import strategies ────────────────────────────

import router from "./routes";
//import { healthCheck } from "./infrastructure/monitoring/health";
//import { rateLimitMiddleware } from "./shared/middlewares/rate-limit.middleware";

// ─── Security ────────────────────────────────────────────────────────────────
app.use(helmet());
//app.use(rateLimitMiddleware);
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
  }),
);

// ─── Body Parsing ────────────────────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ─── Sanitize ────────────────────────────────────────────────────────────────
app.use(sanitizeMiddleware);

app.set("json replacer", (key: string, value: unknown) => {
  if (
    value !== null &&
    typeof value === "object" &&
    value.constructor?.name === "Decimal"
  ) {
    return Number(value);
  }
  return value;
});

// ─── Swagger UI ───────────────────────────────────────────────────────────────
app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// ─── Routes ──────────────────────────────────────────────────────────────────
app.use("/api/v1", router);

// ─── Health Check ────────────────────────────────────────────────────────────
//app.get("/health", healthCheck);

// ─── Sentry Error Handler ────────────────────────────
//Sentry.setupExpressErrorHandler(app);

// ─── Error Handler ─────────────────────────────────────
app.use(errorMiddleware);
