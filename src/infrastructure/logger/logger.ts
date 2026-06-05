import winston from "winston";

const { combine, timestamp, json, colorize, simple } = winston.format;

// ============================================
// LOGGER — Winston structuré
// Niveaux : error / warn / info / debug
// Format JSON en production, lisible en dev
// ============================================

const isProduction = process.env.NODE_ENV === "production";

export const logger = winston.createLogger({
  level: isProduction ? "info" : "debug",

  format: isProduction
    ? combine(timestamp(), json()) // JSON structuré en production
    : combine(colorize(), timestamp({ format: "HH:mm:ss" }), simple()), // Lisible en dev

  transports: [
    new winston.transports.Console(),

    // En production : fichier d'erreurs persisté
    ...(isProduction
      ? [
          new winston.transports.File({
            filename: "logs/error.log",
            level: "error",
          }),
        ]
      : []),
  ],
});
