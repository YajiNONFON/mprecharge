/**
 * SEED v2 — seed.ts
 * ─────────────────────────────────────────────────────────────────
 * Seed minimal pour MP RECHARGE v2
 * Conserve uniquement le service 1xBet
 * Le modèle Service reste extensible (apiBaseUrl, isActive)
 * ─────────────────────────────────────────────────────────────────
 */
import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "../generated/prisma/client";
const connectionString = process.env.DATABASE_URL!;

const adapter = new PrismaPg({ connectionString });

const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱  Seed MP RECHARGE v2...\n");

  // Service 1xBet — seul service actif pour le moment
  const service = await prisma.service.upsert({
    where: { id: "seed-1xbet" },
    update: {
      displayName: "1xBet",
      description: "Service de recharge de compte 1xBet",
      isActive: true,
    },
    create: {
      id: "seed-1xbet",
      name: "1xBet",
      displayName: "1xBet",
      description: "Service de recharge de compte 1xBet",
      apiBaseUrl: null, // À renseigner quand l'API 1xBet est configurée
      isActive: true,
    },
  });

  console.log(`✅  Service créé/mis à jour : ${service.name} (${service.id})`);
  console.log("\n🌱  Seed terminé.\n");
}

main()
  .catch((e) => {
    console.error("❌  Erreur seed :", e);
    //process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
