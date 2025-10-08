const fs = require("fs");
const crypto = require("crypto");
const fetch = (...args) => import("node-fetch").then(({ default: fetch }) => fetch(...args));
const { ethers } = require("hardhat");
require("dotenv").config();

async function fetchAndHashData(filepath){
    const json = JSON.parse(fs.readFileSync(filepath,"utf-8"));
    let combinedData = JSON.stringify(json);

    const csvUrls = [
        json.results.cumulative_analysis_csv,
        json.results.particle_distribution_csv,
        json.results.rejection_analysis_display_csv,
    ];

    for (const url of csvUrls) {
        console.log(`Fetching CSV: ${url}`);
        const res = await fetch(url);
        if(!res.ok) throw new Error(`Failed to fetch: ${url}: ${res.statusText}`);
        const csvText = await res.text();
        combinedData += csvText + "\n";
    }
    const hash = crypto.createHash("sha256").update(combinedData).digest();
    return hash;
}

async function main(){
    const jsonPath = "./report.json";
    const json = JSON.parse(fs.readFileSync(jsonPath, "utf-8")); 

    const hashBuffer = await fetchAndHashData(jsonPath);
    const fileHashHex = "0x" + hashBuffer.toString("hex");

    if (fileHashHex.length !== 66)
        throw new Error(`Invalid hash length: ${fileHashHex.length}`);
    
    console.log("✅ Combined SHA256 hash:", fileHashHex);

      // 2️⃣ Connect to deployed contract
  const registryAddr = process.env.HashRegistry_Address;
  if (!registryAddr) throw new Error("HashRegistry_Address missing in .env");

  const registry = await ethers.getContractAt("HashRegistry", registryAddr);
  const [signer] = await ethers.getSigners();

  // 3️⃣ Prepare metadata
  const jobId = json.jobId; // ✅ correct
  const productName = json.productName || json.product_name || "UnknownProduct";
  const userName = json.username || "scanner_operator";
//   const location = json.results?.location || "Unknown";

  console.log(`📦 Storing report for job: ${jobId}`);

  //Store onchain
  const tx = await registry.connect(signer).storeReport(jobId, fileHashHex , productName, userName);
  await tx.wait();

  console.log("✅ Stored on-chain in tx:", tx.hash);

  // 5️⃣ Verify retrieval
  const report = await registry.getReport(jobId);
  const IST_OFFSET = 5.5 * 60 * 60 * 1000

  console.log({
    hash: report.reportHash,
    jobId: report.jobId,
    productName: report.productName,
    username: report.username,
    timestamp: new Date(Number(report.timestamp) * 1000 + IST_OFFSET),
    uploadedBy: report.uploadedBy
  });
}

main().catch((e) => {
    console.error("❌ Error:", e);
    process.exit(1);
  });
