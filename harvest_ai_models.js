import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import FirecrawlApp from "@mendable/firecrawl-js";

dotenv.config();

const cfg = {
  sources: [
    "https://huggingface.co/models",
    "https://ollama.ai/library",
    "https://openrouter.ai/models",
  ],
  outDir: "outputs/ai_models",
};

const client = new FirecrawlApp({ apiKey: process.env.FIRECRAWL_API_KEY });

if (!fs.existsSync(cfg.outDir)) {
  fs.mkdirSync(cfg.outDir, { recursive: true });
}

async function harvestModels() {
  console.log("🌐 Starting model harvest...");
  const timestamp = new Date().toISOString().split("T")[0];

  for (const url of cfg.sources) {
    try {
      console.log(`🔎 Scraping ${url}...`);
      const result = await client.scrapeUrl(url);

      const cleanName = url.replace(/https?:\/\/|[^\w.-]/g, "_");
      const outFile = path.join(cfg.outDir, `${cleanName}_${timestamp}.txt`);

      fs.writeFileSync(outFile, result.text || result.content || "", "utf8");
      console.log(`✅ Saved: ${outFile}`);
    } catch (err) {
      console.error(`❌ Error scraping ${url}:`, err.message);
    }
  }

  console.log("✅ All model sources scraped successfully.");
}

harvestModels();
