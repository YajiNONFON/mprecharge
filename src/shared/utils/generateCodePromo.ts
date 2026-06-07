import { prisma } from "../../infrastructure/database/prisma";

const CHARSET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
const CODE_LENGTH = 6;

function generateRandomCode(length: number): string {
  let code = "";
  for (let i = 0; i < length; i++) {
    code += CHARSET[Math.floor(Math.random() * CHARSET.length)];
  }
  return code;
}

export async function generateUniqueReferralCode(
  prefix: string = "MPAY",
): Promise<string> {
  let unique = false;
  let referralCode = "";

  while (!unique) {
    const randomCode = generateRandomCode(CODE_LENGTH);
    referralCode = `${prefix}-${randomCode}`;

    const existing = await prisma.user.findUnique({
      where: { referralCode },
    });

    if (!existing) {
      unique = true;
    }
  }

  return referralCode;
}
