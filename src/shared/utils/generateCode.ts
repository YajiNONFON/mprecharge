import bcrypt from "bcryptjs";

export async function generateAndHashResetCode() {
  const code = Math.floor(10000 + Math.random() * 90000).toString();
  const hashed = await bcrypt.hash(code, 10);
  return { code, hashed };
}
