const fs = require("fs");
const crypto = require("crypto");
const fetch = (...args) => import("node-fetch").then(({ default: fetch }) => fetch(...args));

/**
 * Generates a SHA-256 hash from:
 *  - the raw text of report.json
 *  - plus the text of all CSVs linked in it
 * 
 * @param {string} filepath - Path to the report.json file
 * @returns {Promise<{hashHex: string, normalizedData: string}>}
 */
async function generateHash(filepath) {
  if (!fs.existsSync(filepath)) {
    throw new Error(`File not found: ${filepath}`);
  }

  // 1️⃣ Read raw JSON text exactly as stored
  const rawJsonText = fs.readFileSync(filepath, "utf-8").trim();

  // Parse JSON just to extract URLs
  let json;
  try {
    json = JSON.parse(rawJsonText);
  } catch (err) {
    throw new Error(`Invalid JSON in ${filepath}: ${err.message}`);
  }

  // Collect CSV URLs (if any)
  const csvUrls = [
    json.results?.cumulative_analysis_csv,
    json.results?.particle_distribution_csv,
    json.results?.rejection_analysis_display_csv,
  ].filter(Boolean);

  // Fetch and combine CSV contents
  let csvTextCombined = "";
  for (const url of csvUrls) {
    console.log(`Fetching CSV: ${url}`);
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.statusText}`);

    const csvText = (await res.text()).replace(/\r\n/g, "\n").trim();
    csvTextCombined += `\n\n# Source: ${url}\n${csvText}`;
  }

  //  Combine raw JSON + CSV text
  const combinedData = rawJsonText + csvTextCombined;

  //  Normalize and hash
  const normalizedData = combinedData.replace(/\r\n/g, "\n").trim();
  const hashHex = "0x" + crypto.createHash("sha256").update(normalizedData, "utf8").digest("hex");

  if (hashHex.length !== 66) {
    throw new Error(`Invalid hash length (${hashHex.length})`);
  }

  return { hashHex, normalizedData };
}

module.exports = { generateHash };
