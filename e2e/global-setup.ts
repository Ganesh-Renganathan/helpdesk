import { execSync } from "child_process";
import * as dotenv from "dotenv";
import * as path from "path";
import * as fs from "fs";

export default async function globalSetup() {
  const envTestPath = path.resolve(__dirname, "../server/.env.test");

  if (!fs.existsSync(envTestPath)) {
    throw new Error(
      `Test environment file not found: ${envTestPath}\n` +
        `Copy server/.env.test.example to server/.env.test and fill in test values.`
    );
  }

  dotenv.config({ path: envTestPath, override: true });

  console.log("\n[global-setup] Loaded server/.env.test");
  console.log(`[global-setup] DATABASE_URL → ${process.env.DATABASE_URL}`);

  const serverDir = path.resolve(__dirname, "../server");
  const env = { ...process.env };

  console.log("[global-setup] Running Prisma migrations on test database...");
  execSync("bunx prisma migrate deploy --schema=prisma/schema.prisma", {
    cwd: serverDir,
    stdio: "inherit",
    env,
  });
  console.log("[global-setup] Migrations complete.");

  console.log("[global-setup] Seeding test user...");
  execSync("bun run seed", {
    cwd: serverDir,
    stdio: "inherit",
    env,
  });
  console.log("[global-setup] Seed complete.");
}
