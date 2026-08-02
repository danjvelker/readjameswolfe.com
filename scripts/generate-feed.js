#!/usr/bin/env node
// Regenerates feed.xml from content/site-content.json.
// Run manually with: node scripts/generate-feed.js
// (RSS feeds must be static XML — they can't be rendered live by
// browser JS the way the rest of the site is, so this needs to be
// re-run after adding new articles if you want the feed to reflect them.)

const fs = require("fs");
const path = require("path");

const SITE_URL = "https://readjameswolfe.com"; // update once the real domain is live
const contentPath = path.join(__dirname, "..", "content", "site-content.json");
const outPath = path.join(__dirname, "..", "feed.xml");

const content = JSON.parse(fs.readFileSync(contentPath, "utf8"));

function escapeXml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function rfc822(dateStr) {
  return new Date(dateStr + "T12:00:00Z").toUTCString();
}

const articles = [...content.articles].sort((a, b) => new Date(b.date) - new Date(a.date));

const items = articles
  .map(
    (a) => `
    <item>
      <title>${escapeXml(a.title)}</title>
      <link>${SITE_URL}/article-template.html?slug=${a.slug}</link>
      <guid>${SITE_URL}/article-template.html?slug=${a.slug}</guid>
      <pubDate>${rfc822(a.date)}</pubDate>
      <description>${escapeXml(a.excerpt)}</description>
    </item>`
  )
  .join("");

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Read James Wolfe</title>
    <link>${SITE_URL}</link>
    <description>Helping weary Christians find comfort and confidence in Christ.</description>
    <language>en-us</language>${items}
  </channel>
</rss>
`;

fs.writeFileSync(outPath, xml, "utf8");
console.log(`Wrote ${outPath} with ${articles.length} articles.`);
