import { PrismaClient } from "../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import dotenv from "dotenv";

dotenv.config();

const connectionString = process.env.DATABASE_URL!;
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱  Seed MP RECHARGE v2...\n");

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
      apiBaseUrl: null,
      isActive: true,
    },
  });

  console.log(`✅  Service créé/mis à jour : ${service.name} (${service.id})`);
  console.log("\n🌱  Seed terminé.\n");
}

main()
  .catch((e) => {
    console.error("❌  Erreur seed :", e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
