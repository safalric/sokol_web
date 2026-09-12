import { DatabaseSync } from "node:sqlite";
import { readFileSync } from "node:fs";

export function createD1() {
  const sqlite = new DatabaseSync(":memory:");
  for (const file of ["0000_registration_rate_limits.sql", "0001_registration_deliveries.sql"]) {
    sqlite.exec(readFileSync(new URL(`../../drizzle/${file}`, import.meta.url), "utf8"));
  }
  return {
    sqlite,
    prepare(sql) {
      const statement = sqlite.prepare(sql);
      function bound(values = []) {
        return {
          bind: (...parameters) => bound(parameters),
          async first() { return statement.get(...values) || null; },
          async all() { return { results: statement.all(...values), success: true }; },
          async run() { const result = statement.run(...values); return { success: true, meta: { changes: result.changes } }; },
        };
      }
      return bound();
    },
  };
}
