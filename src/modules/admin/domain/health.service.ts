import axios from "axios";
import { prisma } from "../../../infrastructure/database/prisma";
import { mocashClient } from "../../../shared/utils/mocashClient";

// ─────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────

type ServiceStatus = "OK" | "KO";

interface ServiceCheck {
  name: string;
  status: ServiceStatus;
  responseTimeMs: number;
  error?: string;
}

interface HealthReport {
  status: ServiceStatus;
  checkedAt: string;
  services: ServiceCheck[];
}

// ─────────────────────────────────────────
// CHECKS
// ─────────────────────────────────────────

const checkDatabase = async (): Promise<ServiceCheck> => {
  const start = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    return {
      name: "Base de données",
      status: "OK",
      responseTimeMs: Date.now() - start,
    };
  } catch (error: any) {
    return {
      name: "Base de données",
      status: "KO",
      responseTimeMs: Date.now() - start,
      error: error.message,
    };
  }
};

const checkFeexpay = async (): Promise<ServiceCheck> => {
  const start = Date.now();
  try {
    await axios.get("https://api.feexpay.me/api", { timeout: 5000 });
    return {
      name: "FeexPay",
      status: "OK",
      responseTimeMs: Date.now() - start,
    };
  } catch (error: any) {
    // FeexPay peut retourner 401/404 mais être joignable — c'est OK
    const reachable = error.response?.status !== undefined;
    return {
      name: "FeexPay",
      status: reachable ? "OK" : "KO",
      responseTimeMs: Date.now() - start,
      error: reachable ? undefined : error.message,
    };
  }
};

const checkMocash = async (): Promise<ServiceCheck> => {
  const start = Date.now();
  try {
    await mocashClient.checkCashdeskBalance();
    return {
      name: "MoCash",
      status: "OK",
      responseTimeMs: Date.now() - start,
    };
  } catch (error: any) {
    return {
      name: "MoCash",
      status: "KO",
      responseTimeMs: Date.now() - start,
      error: error.message,
    };
  }
};

// ─────────────────────────────────────────
// HEALTH CHECK GLOBAL
// ─────────────────────────────────────────

export const getHealthReport = async (): Promise<HealthReport> => {
  const [database, feexpay, mocash] = await Promise.allSettled([
    checkDatabase(),
    checkFeexpay(),
    checkMocash(),
  ]);

  const services: ServiceCheck[] = [
    database.status === "fulfilled"
      ? database.value
      : {
          name: "Base de données",
          status: "KO",
          responseTimeMs: 0,
          error: "Check failed",
        },
    feexpay.status === "fulfilled"
      ? feexpay.value
      : {
          name: "FeexPay",
          status: "KO",
          responseTimeMs: 0,
          error: "Check failed",
        },
    mocash.status === "fulfilled"
      ? mocash.value
      : {
          name: "MoCash",
          status: "KO",
          responseTimeMs: 0,
          error: "Check failed",
        },
  ];

  const globalStatus: ServiceStatus = services.every((s) => s.status === "OK")
    ? "OK"
    : "KO";

  return {
    status: globalStatus,
    checkedAt: new Date().toISOString(),
    services,
  };
};
