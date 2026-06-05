import { prisma } from "../../infrastructure/database/prisma";

export async function generateUniquePublicId(
  prefix: string = "MP",
): Promise<string> {
  let unique = false;
  let publicId = "";

  while (!unique) {
    const randomDigits = Math.floor(100000 + Math.random() * 900000);

    publicId = `${prefix}${randomDigits}`;

    const existing = await prisma.profile.findUnique({ where: { publicId } });

    if (!existing) {
      unique = true;
    }
  }

  return publicId;
}

export async function generateTransUniquePublicId(
  prefix: string = "TXR",
  digits: number = 5,
): Promise<string> {
  let unique = false;
  let transpublicId = "";

  while (!unique) {
    // 🔢 Génération dynamique du nombre selon "digits"
    const min = Math.pow(10, digits - 1);
    const max = Math.pow(10, digits) - 1;
    const randomDigits = Math.floor(min + Math.random() * (max - min + 1));

    transpublicId = `${prefix}${randomDigits}`;

    // 🔍 Vérifie si le code existe déjà en base
    const existing = await prisma.transaction.findFirst({
      where: { transpublicId },
    });

    if (!existing) {
      unique = true;
    }
  }

  return transpublicId;
}
