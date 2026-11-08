#!/usr/bin/env node
import { fileURLToPath } from "node:url";
import { readHandbook } from "./lib/handbook.mjs";

try {
  const { pages, navigation } = readHandbook(fileURLToPath(new URL("../", import.meta.url)));
  console.log(`Validated ${pages.length} pages: metadata, local links, and ${navigation.length} navigation sections`);
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
