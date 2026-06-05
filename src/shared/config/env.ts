import "dotenv/config";

const requiredEnvVars = [
  "DATABASE_URL",
  "JWT",
  "RESEND_API_KEY",
  /*"JWT_REFRESH_SECRET",
  "GOOGLE_CLIENT_ID",
  "GOOGLE_CLIENT_SECRET",
  "FACEBOOK_APP_ID",
  "FACEBOOK_APP_SECRET",
  "CLOUDINARY_CLOUD_NAME",
  "CLOUDINARY_API_KEY",
  "CLOUDINARY_API_SECRET",
  "SENTRY_DSN",
  "RENDER_EXTERNAL_URL",
  "FRONTEND_URL",*/
  "BACKEND_URL",
] as const;

//const requiredEnvVars = ["DATABASE_URL"] as const;

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`❌ Missing required environment variable: ${envVar}`);
  }
}

export const env = {
  port: process.env.PORT || 5000,
  databaseUrl: process.env.DATABASE_URL!,
  nodeEnv: process.env.NODE_ENV || "development",
  jwtSecret: process.env.JWT!,
  resendApiKey: process.env.RESEND_API_KEY!,

  /*jwtRefreshSecret: process.env.JWT_REFRESH_SECRET!,
  googleClientId: process.env.GOOGLE_CLIENT_ID!,
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET!,
  facebookAppId: process.env.FACEBOOK_APP_ID!,
  facebookAppSecret: process.env.FACEBOOK_APP_SECRET!,
  cloudinary_cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  cloudinary_api_key: process.env.CLOUDINARY_API_KEY!,
  cloudinary_api_secret: process.env.CLOUDINARY_API_SECRET!,
  sentry_dns: process.env.SENTRY_DSN!,
  render_external_url: process.env.RENDER_EXTERNAL_URL!,*/
  frontend_url: process.env.FRONTEND_URL,
  backendUrl: process.env.BACKEND_URL || "http://localhost:5000",
};
