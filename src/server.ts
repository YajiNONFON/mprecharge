import { env } from "./shared/config/env";
import { app } from "./app";
import { prisma } from "./infrastructure/database/prisma";
import { logger } from "./infrastructure/logger/logger";

async function startServer() {
  try {
    await prisma.$connect();
    logger.info("✅ PostgreSQL connected successfully");

    const server = app.listen(env.port, () => {
      logger.info(`🚀 Server running on http://localhost:${env.port}`);

      //startKeepAliveCron();
    });

    // Graceful shutdown
    process.on("SIGTERM", async () => {
      logger.info("SIGTERM received — shutting down gracefully");
      await prisma.$disconnect();
      server.close(() => process.exit(0));
    });
  } catch (error) {
    logger.error("Failed to connect to PostgreSQL:", error);
    process.exit(1);
  }
}

startServer();
