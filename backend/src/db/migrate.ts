import { query, closePool } from "./connection";
import * as fs from "fs";
import * as path from "path";

async function migrate() {
  console.log("Running database migrations...");

  // __dirname is <project>/backend/src/db (dev) or /app/dist/db (Docker)
  // db/init is at <project>/db/init or /app/db/init
  const migrationsDir = path.join(__dirname, "..", "..", "..", "db", "init");
  const files = fs.readdirSync(migrationsDir).sort();

  for (const file of files) {
    if (file.endsWith(".sql")) {
      console.log(`  Applying: ${file}`);
      const sql = fs.readFileSync(path.join(migrationsDir, file), "utf-8");
      await query(sql);
      console.log(`  ✓ ${file} applied`);
    }
  }

  console.log("Migrations complete.");
  await closePool();
}

migrate().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
