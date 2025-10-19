/**
 * harvest_ai_models.js
 * Automated AI model trending fetcher using Firecrawl SDK (stable) + Groq summary.
 * Saves results locally and injects them into OpenWebUI's knowledge uploads folder.
 */

import fs from "fs";
import path from "path";
import { execSync } from "child_process";
import Firecrawl from "@mendable/firecrawl-js";
import OpenAI from "openai";

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const FIRECRAWL_API_KEY = process.env.FIRECRAWL_API_KEY;

// ✅ Create API clients
const firecrawl = new Firecrawl({ apiKey: FIRECRAWL_API_KEY });
const client = new OpenAI({
  apiKey: GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1",
});

const LOCAL_SAVE_PATH = "./outputs";
if (!fs.existsSync(LOCAL_SAVE_PATH)) fs.mkdirSync(LOCAL_SAVE_PATH, { recursive: true });

const SAVE_PATH_DOCKER = "/app/backend/data/uploads/ai_model_news";

async function scrapeAndSave() {
  console.log("🕸️ Fetching trending AI models from Hugging Face via Firecrawl...");

  // Step 1 — Scrape
  let scrapedText = "";
  try {
    const result = await firecrawl.scrapeUrl("https://huggingface.co/models");
    scrapedText = result.data?.content || JSON.stringify(result, null, 2);
    console.log("✅ Successfully scraped Hugging Face models.");
  } catch (err) {
    console.error("❌ Firecrawl scrape failed:", err.message);
    return;
  }

  // Step 2 — Summarize with Groq
  console.log("🧠 Summarizing scraped content using Groq (GPT-OSS-120B)...");
  let summary = "";
  try {
    const response = await client.responses.create({
      model: "openai/gpt-oss-120b",
      input: `Summarize the most recently trending AI models from the following scraped content:\n${scrapedText.substring(0, 5000)}`
    });
    summary = response.output_text || JSON.stringify(response, null, 2);
    console.log("✅ Summary generated successfully.");
  } catch (err) {
    console.error("❌ Groq summarization failed:", err.message);
    summary = scrapedText; // fallback to raw text
  }

  // Step 3 — Save locally
  const date = new Date().toISOString().split("T")[0];
  const filename = `trending_models_${date}.txt`;
  const filepath = path.join(LOCAL_SAVE_PATH, filename);
  fs.writeFileSync(filepath, summary, "utf8");
  console.log(`💾 Saved locally → ${filepath}`);

  // Step 4 — Copy into Docker container
  try {
    execSync(`docker cp "${filepath}" openwebui:"${SAVE_PATH_DOCKER}/${filename}"`);
    console.log("📦 Copied to OpenWebUI container uploads folder.");
  } catch (e) {
    console.error("⚠️ Docker copy failed:", e.message);
  }

  console.log("🎉 Completed knowledge update!");
}

scrapeAndSave().catch(console.error);
execSync(`curl -X POST http://localhost:8080/api/knowledge/rebuild`);
console.log("🔄 Reindex request sent to OpenWebUI API.");
