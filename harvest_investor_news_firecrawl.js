/**
 * harvest_investor_news_firecrawl.js
 * -----------------------------------------------------
 * Uses Firecrawl MCP server to scrape and summarize
 * daily finance & market news from Investors.com.
 * Saves results locally and copies into OpenWebUI container.
 */

import fs from "fs";
import path from "path";
import { execSync } from "child_process";
import OpenAI from "openai";
import dotenv from "dotenv";
dotenv.config();

// === 🔧 Configuration ===
const FIRECRAWL_API_KEY = process.env.FIRECRAWL_API_KEY;
const client = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1",
});

// List of sections to scrape
const FIRECRAWL_SOURCES = [
  "https://www.investors.com/news/",
  "https://www.investors.com/market-trend/stock-market-today/",
  "https://www.investors.com/etfs-and-funds/",
  "https://www.investors.com/category/news/technology/",
  "https://www.investors.com/category/news/business/",
];

// Local output folder
const OUTPUT_DIR = "./outputs/InvestorNewsFirecrawl";
if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

// === 🧠 Firecrawl scraping helper ===
async function scrapeWithFirecrawl(url) {
  console.log(`🕸️ Scraping ${url} via Firecrawl MCP...`);
  try {
    const response = await client.responses.create({
      model: "openai/gpt-oss-120b",
      input: [
        {
          role: "user",
          content: `Scrape the full article text from ${url}, including headlines, body paragraphs, and key points for each story. Keep it in readable plain text.`,
        },
      ],
      tools: [
        {
          type: "mcp",
          server_label: "firecrawl",
          server_description: "Web scraping and content extraction",
          server_url: `https://mcp.firecrawl.dev/${FIRECRAWL_API_KEY}/v2/mcp`,
          require_approval: "never",
          tool_choice: {
            name: "firecrawl_scrape",
            parameters: {
              url,
              formats: [{ html: true, summary: true }],
              includeSubpages: true,
              depth: 1,
              maxArticles: 10,      // limit number of articles
              dateRange: "24h"      // optional (past 24 hours)
            },
          },
        },
      ],
    });

    const content = response.output_text?.trim();
    if (!content) {
      console.warn(`⚠️ No content returned for ${url}`);
      return `⚠️ No content found for ${url}`;
    }
    console.log(`✅ Scraped successfully: ${url}`);
    return content;
  } catch (err) {
    console.error(`❌ Error scraping ${url}:`, err.message);
    return `❌ Error scraping ${url}: ${err.message}`;
  }
}

// === 🗂️ Main function ===
async function harvestInvestorNews() {
  console.log("🚀 Starting Firecrawl-based Investor.com scraper...");

  const date = new Date().toISOString().split("T")[0];
  const outputFile = path.join(OUTPUT_DIR, `investor_firecrawl_${date}.txt`);

  let combinedContent = "";
  for (const url of FIRECRAWL_SOURCES) {
    const sectionContent = await scrapeWithFirecrawl(url);
    combinedContent += `\n\n🌐 ${url}\n${sectionContent}\n\n------------------------\n`;
  }

  fs.writeFileSync(outputFile, combinedContent, "utf8");
  console.log(`💾 Saved combined investor news → ${outputFile}`);

  // === 📦 Copy into Docker container ===
  const containerName = "openwebui";
  const dockerPath = "/app/backend/data/uploads/finance_news";

  try {
    execSync(`docker exec ${containerName} mkdir -p ${dockerPath}`, { stdio: "ignore" });
    execSync(
      `docker cp "${outputFile.replace(/\\/g, "/")}" ${containerName}:"${dockerPath}/"`,
      { stdio: "inherit" }
    );
    console.log(`✅ Copied file into Docker container → ${dockerPath}`);
  } catch (err) {
    console.error("⚠️ Docker copy failed:", err.message);
  }

  console.log("🎉 Investor Firecrawl news scraping complete!");
}

harvestInvestorNews();
