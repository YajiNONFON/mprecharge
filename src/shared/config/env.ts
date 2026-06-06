import "dotenv/config";

const requiredEnvVars = [
  "DATABASE_URL",
  "JWT",
  "RESEND_API_KEY",
  "FEEXPAY_SHOP_ID",
  "FEEXPAY_API_KEY",
  "FEEXPAY_WEBHOOK_SECRET",
  "TELEGRAM_BOT_TOKEN",
  "TELEGRAM_WEBHOOK_BOT_TOKEN",
  "TELEGRAM_WITHDRAWAL_BOT_TOKEN",
  "TELEGRAM_AUDIT_BOT_TOKEN",
  "SUPER_ADMIN_EMAIL",
  "ADMIN_DEV_EMAIL",
  "MOCASH_API_URL",
  "MOCASH_HASH",
  "MOCASH_CASHDESK_ID",
  "MOCASH_CASHIER_PASS",
  "BACKEND_URL",
] as const;

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`❌ Missing required environment variable: ${envVar}`);
  }
}

export const env = {
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || "development",
  databaseUrl: process.env.DATABASE_URL!,
  jwtSecret: process.env.JWT!,
  resendApiKey: process.env.RESEND_API_KEY!,
  frontendUrl: process.env.FRONTEND_URL,
  backendUrl: process.env.BACKEND_URL!,

  feexpay: {
    shopId: process.env.FEEXPAY_SHOP_ID!,
    apiKey: process.env.FEEXPAY_API_KEY!,
    webhookSecret: process.env.FEEXPAY_WEBHOOK_SECRET!,
  },

  mocash: {
    apiUrl: process.env.MOCASH_API_URL!,
    hash: process.env.MOCASH_HASH!,
    cashDeskId: process.env.MOCASH_CASHDESK_ID!,
    cashierPass: process.env.MOCASH_CASHIER_PASS!,
  },

  telegram: {
    botToken: process.env.TELEGRAM_BOT_TOKEN!,
    webhookBotToken: process.env.TELEGRAM_WEBHOOK_BOT_TOKEN!,
    withdrawalBotToken: process.env.TELEGRAM_WITHDRAWAL_BOT_TOKEN!,
    auditBotToken: process.env.TELEGRAM_AUDIT_BOT_TOKEN!,
  },

  admin: {
    superAdminEmail: process.env.SUPER_ADMIN_EMAIL!,
    devEmail: process.env.ADMIN_DEV_EMAIL!,
  },
} as const;
