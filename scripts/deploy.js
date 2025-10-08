const fs = require("fs");
const path = require("path");
const { ethers } = require("hardhat");
require("dotenv").config();

async function main() {
  console.log("Deploying HashRegistry contract...");

  const [deployer] = await ethers.getSigners();
  const network = await ethers.provider.getNetwork();

  console.log(`🌐 Network: ${network.name}`);
  console.log(`👤 Deployer: ${deployer.address}`);

  // Deploy contract
  const HashRegistry = await ethers.getContractFactory("HashRegistry");
  const registry = await HashRegistry.deploy(deployer.address);
  await registry.waitForDeployment();

  const contractAddress = await registry.getAddress();
  console.log(`HashRegistry deployed to: ${contractAddress}`);

  // Path to deployment info file
  const filePath = path.join(__dirname, "../deployedAddresses.json");

  // Load existing data (if present)
  let deployedData = {};
  if (fs.existsSync(filePath)) {
    deployedData = JSON.parse(fs.readFileSync(filePath, "utf-8"));
  }

  // Update or insert entry for the current network
  deployedData[network.name] = {
    hash_registry_address: contractAddress,
    deployer: deployer.address,
    chainId: Number(network.chainId), 
    timestamp: new Date().toISOString(),
  };

  // Save the updated file
  fs.writeFileSync(filePath, JSON.stringify(deployedData, null, 2));
  console.log(`📝 Deployment info saved to ${filePath}`);

  // verifcation info for Sepolia
  if (network.name === "sepolia") {
    console.log("\n🔍 To verify on Etherscan, run:");
    console.log(
      `npx hardhat verify --network sepolia ${contractAddress} "${deployer.address}"`
    );
  }
}

main().catch((err) => {
  console.error("Deployment failed:", err);
  process.exitCode = 1;
});
