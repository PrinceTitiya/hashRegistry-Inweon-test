// verifyReport.js
const { ethers } = require("hardhat");
const fs = require("fs");
require("dotenv").config();
const { generateHash } = require("../utils/hashGenerator"); 

async function main(){
const jsonPath = "./report.json";      // generated result path (JSON) from the scan (local file)
const json = JSON.parse(fs.readFileSync(jsonPath, "utf-8"));

  // Generating hash of the report
  const { hashHex } = await generateHash(jsonPath);
  console.log("SHA-256 hash of the report:", hashHex);
  const localHash = hashHex;

  const registryAddr = process.env.HashRegistry_Address;
  if (!registryAddr) throw new Error("HashRegistry_Address missing in environment variable");

  const registry = await ethers.getContractAt("HashRegistry", registryAddr);
  const [signer] = await ethers.getSigners();

  const jobId = json.jobId;
  const report = await registry.getReport(jobId);

  const onchainHash = report.reportHash;

  console.log("\n🧾 Verification Result:");
  console.log("-------------------------");

  console.log("jobId:",report.jobId);
  console.log("Local hash:   ", localHash);
  console.log("On-chain hash:", onchainHash);

  if (localHash.toLowerCase() === onchainHash.toLowerCase()) {
    console.log("\n✅Integrity Verified — The local file matches the on-chain record of jobId:",jobId);
  } else {
    console.error("\n☠️Mismatch Detected — The file may have been altered or corrupted.");
  }
}

main().catch((e) => {
    console.error("Error:", e);
    process.exit(1);
  });