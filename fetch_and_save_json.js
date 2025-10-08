const fs = require("fs");
const fetch = (...args) => import("node-fetch").then(({ default: fetch }) => fetch(...args));

async function fetchCsv(url) {
  console.log(`Fetching CSV: ${url}`);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch: ${url} (${res.statusText})`);
  return await res.text();
}

async function main() {
  const inputPath = "./report.json";
  const outputPath = "./report_with_csv_data.json";

  // 1️⃣ Read base report
  const json = JSON.parse(fs.readFileSync(inputPath, "utf-8"));

  // 2️⃣ Extract CSV URLs
  const csvUrls = {
    cumulative_analysis_csv: json.results?.cumulative_analysis_csv,
    particle_distribution_csv: json.results?.particle_distribution_csv,
    rejection_analysis_display_csv: json.results?.rejection_analysis_display_csv,
  };

  // 3️⃣ Fetch and store CSVs
  const fetched_csv_data = {};
  for (const [key, url] of Object.entries(csvUrls)) {
    if (!url) continue;
    try {
      const csvText = await fetchCsv(url);
      const fileName = url.split("/").pop(); // extract file name
      fetched_csv_data[fileName] = csvText; // store as raw text
    } catch (err) {
      console.error(`❌ Failed to fetch ${key}:`, err.message);
    }
  }

  // 4️⃣ Add fetched CSV content into the JSON
  json.fetched_csv_data = fetched_csv_data;

  // 5️⃣ Save new JSON with pretty formatting
  fs.writeFileSync(outputPath, JSON.stringify(json, null, 2), "utf-8");

  console.log(`✅ New JSON with embedded CSV data saved to: ${outputPath}`);
}

main().catch((err) => {
  console.error("❌ Error:", err);
  process.exit(1);
});
