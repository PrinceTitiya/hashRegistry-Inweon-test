// storeReport.js
const { ethers } = require("hardhat");
require("dotenv").config();
const fs = require("fs");
const { generateHash } = require("../utils/hashGenerator");

async function main() {
  const jsonPath = "./report.json";      // generated result path (JSON) format
  const json = JSON.parse(fs.readFileSync(jsonPath, "utf-8"));

  // Generating hash of the report
  const { hashHex } = await generateHash(jsonPath);
  console.log("SHA-256 hash of the report:", hashHex);

  const registryAddr = process.env.HashRegistry_Address;
  if (!registryAddr) throw new Error("HashRegistry_Address missing in environment variable");

  const registry = await ethers.getContractAt("HashRegistry", registryAddr);
  const [signer] = await ethers.getSigners();

  const jobId = json.jobId;
  const productName = json.productName || json.product_name || "UnknownProduct";
  const userName = json.username || "";

  console.log(` Storing report for job_Id: ${jobId}`);

  const tx = await registry.connect(signer).storeReport(jobId, hashHex, productName, userName);
  await tx.wait();
  console.log("Stored on-chain in tx:", tx.hash);

  const report = await registry.getReport(jobId);     // fetching the  on-chain stored detail of jobId
  const IST_OFFSET = 5.5 * 60 * 60 * 1000;     // time conversion helper
  console.log({
    hash: report.reportHash,
    jobId: report.jobId,
    productName: report.productName,
    username: report.username,
    timestamp: new Date(Number(report.timestamp) * 1000 + IST_OFFSET), 
    uploadedBy: report.uploadedBy,
  });
}

main().catch((e) => {
  console.error("Error:", e);
  process.exit(1);
});