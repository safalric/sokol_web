import { readFile } from "node:fs/promises";
import { validateSiteContent } from "./content-model.mjs";

const content = JSON.parse(await readFile(new URL("../src/data/site-content.json", import.meta.url), "utf8"));
const errors = validateSiteContent(content);

if (errors.length > 0) {
  process.stderr.write(`Veřejný obsah obsahuje ${errors.length} chyb:\n- ${errors.join("\n- ")}\n`);
  process.exitCode = 1;
} else {
  process.stdout.write(`Veřejný obsah je platný (${content.contentVersion}).\n`);
}
