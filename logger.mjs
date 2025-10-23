import { createWriteStream } from "fs";
import { format } from "util"; 

const logFile = createWriteStream("scraper.log", { flags: "a" }); 

export function log(level, msg, meta = "") {
  const ts = new Date().toISOString();
  const line = `[${ts}] ${level.toUpperCase()} ${msg} ${meta}`;
  console.log(line);
  logFile.write(line + "\n");
} 