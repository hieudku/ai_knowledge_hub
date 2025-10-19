/**
 * harvest_reddit_ai.js
 * Local Reddit scraper with full post body via Reddit JSON API.
 */

import axios from "axios";
import fs from "fs";
import path from "path";
import { execSync } from "child_process";

const SUBREDDITS = [
  "MachineLearning",
  "LocalLLaMA",
  "ArtificialIntelligence",
  "OpenAI",
  "LanguageTechnology",
];

const LOCAL_SAVE_PATH = "./outputs/RedditAI";
const DOCKER_SAVE_PATH = "/app/backend/data/uploads/reddit_ai";

if (!fs.existsSync(LOCAL_SAVE_PATH)) {
  fs.mkdirSync(LOCAL_SAVE_PATH, { recursive: true });
}

async function fetchPostDetails(permalink) {
  const url = `https://www.reddit.com${permalink}.json`;
  try {
    const { data } = await axios.get(url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; LocalScraper/1.0)" },
    });

    const post = data[0].data.children[0].data;
    const comments = data[1].data.children.slice(0, 3).map(
      (c) => `- ${c.data.author}: ${c.data.body?.replace(/\n+/g, " ").trim()}`
    );

    return {
      title: post.title,
      author: post.author,
      upvotes: post.ups,
      link: `https://www.reddit.com${post.permalink}`,
      body: post.selftext || "[No text content — link/image post]",
      comments: comments.join("\n") || "No comments",
    };
  } catch (err) {
    console.warn(`⚠️ Error fetching post details: ${url}`);
    return null;
  }
}

async function scrapeReddit(subreddit) {
  console.log(`🕸️ Fetching r/${subreddit}...`);
  const url = `https://www.reddit.com/r/${subreddit}/top.json?t=day&limit=5`;

  try {
    const { data } = await axios.get(url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; LocalScraper/1.0)" },
    });

    const posts = data.data.children.slice(0, 5);
    const details = [];

    for (const child of posts) {
      const p = child.data;
      const detail = await fetchPostDetails(p.permalink);
      if (detail) {
        details.push(
          `# ${detail.title}\nAuthor: ${detail.author}\nUpvotes: ${detail.upvotes}\nLink: ${detail.link}\n\nPost:\n${detail.body}\n\nTop Comments:\n${detail.comments}\n\n-----------------------------\n`
        );
      }
    }

    const date = new Date().toISOString().split("T")[0];
    const filename = `reddit_${subreddit}_${date}.txt`;
    const filePath = path.join(LOCAL_SAVE_PATH, filename);
    fs.writeFileSync(filePath, details.join("\n"), "utf8");
    console.log(`💾 Saved → ${filePath}`);

    try {
      execSync(`docker cp "${filePath}" openwebui:"${DOCKER_SAVE_PATH}/${filename}"`);
      console.log(`📦 Synced to OpenWebUI → ${DOCKER_SAVE_PATH}/${filename}`);
    } catch (err) {
      console.warn("⚠️ Docker copy skipped or failed:", err.message);
    }
  } catch (err) {
    console.error(`❌ Error scraping r/${subreddit}: ${err.message}`);
  }
}

async function main() {
  console.log("🚀 Starting full Reddit AI scraper...");
  for (const sub of SUBREDDITS) {
    await scrapeReddit(sub);
  }
  console.log("🎉 Completed Reddit scrape with full content!");
}

main();
