# Inweon HashRegistry Test

This repository contains a **HashRegistry smart contract** on Ethereum networks (local Hardhat node and Sepolia testnet). It allows you to store SHA256 hashes of JSON reports (with linked CSVs) on-chain and retrieve them for verification.

---

## Table of Contents
1. [Overview](#overview)
2. [Folder Structure](#folder-structure)
3. [Setup](#setup)
4. [Local Testing](#local-testing)
5. [Sepolia Deployment](#sepolia-deployment)
6. [Scripts Overview](#scripts-overview)
   - [storeReport.js](#storereportjs)
   - [verifyReport.js](#verifyreportjs)
   - [hashGenerator.js](#hashgeneratorjs)
7. [Smart Contract Details](#smart-contract-details)
8. [Sample Output](#sample-output)
9. [Notes](#notes)

---

## Overview

- **Contract:** `HashRegistry.sol`  
  Stores report hashes on-chain using SHA256.
- **Reports:** JSON files containing metadata and links to CSV files.
- **Hashing:** The report JSON + CSVs are combined and hashed using SHA256.
- **Verification:** Anyone can verify that a report hash matches the on-chain record.

---

## Folder Structure

```
inweon-HashRegistry-test/
│
├── contracts/
│   └── HashRegistry.sol
│
├── scripts/
│   ├── deploy.js
│   ├── storeReport.js
│   └── verifyReport.js
│
├── utils/
│   └── hashGenerator.js
│
├── test/
│   └── HashRegistry.test.js
│
├── report.json                 # Sample report for testing
├── hardhat.config.js
├── package.json
├── package-lock.json
├── .env                         # Environment variables (not committed)
├── .gitignore
└── README.md
```

---

## Setup

### 1. Clone the repository

```bash
git clone https://github.com/PrinceTitiya/hashRegistry-Inweon-test.git
cd inweon-HashRegistry-test
```

### 2. Install dependencies

```bash
npm install
```

### 3. Create a `.env` file

Create a `.env` file in the root directory with the following variables:

```env
PRIVATE_KEY=<YOUR_WALLET_PRIVATE_KEY>
SEPOLIA_RPC_URL=<YOUR_ALCHEMY_API_KEY>
ETHERSCAN_API_KEY=<YOUR_ETHERSCAN_KEY>
HashRegistry_Address=<deployed_contract_address_for_local_or_sepolia>
```

---

## Local Testing

### 1. Start a local Hardhat node

```bash
npx hardhat node
```

### 2. Deploy the contract locally

```bash
npx hardhat run scripts/deploy.js --network localhost
```

The script will:
- Deploy `HashRegistry.sol`
- Print the deployed contract address
- Save the address in `deployedAddresses.json` (for local reference)

### 3. Store a report

```bash
npx hardhat run scripts/storeReport.js --network localhost
```

The script will:
- Fetch CSVs from the JSON report
- Use `hashGenerator.js` utility to combine and SHA256 hash the JSON + CSVs
- Store hash and metadata on-chain
- Retrieve the report from the blockchain
- Display timestamp in IST (optional)

### 4. Verify a report (Integrity Test)

```bash
npx hardhat run scripts/verifyReport.js --network localhost
```

The script will:
- Rehash the JSON report and its CSVs using `hashGenerator.js`
- Fetch the on-chain hash using the job ID
- Compare both hashes to verify data integrity
- Display verification results

---

## Sepolia Deployment

### 1. Deploy to Sepolia

```bash
npx hardhat run scripts/deploy.js --network sepolia
```

The deploy script will:
- Deploy `HashRegistry.sol` with your wallet as the owner
- Print contract address
- Provide a command to verify the contract on Etherscan

### 2. Store reports on Sepolia

```bash
npx hardhat run scripts/storeReport.js --network sepolia
```

### 3. Verify reports on Sepolia

```bash
npx hardhat run scripts/verifyReport.js --network sepolia
```

---

## Scripts Overview

### storeReport.js

This script performs the following operations:

1. Reads a JSON report (`report.json`)
2. Imports the `hashGenerator` utility from `utils/hashGenerator.js`
3. Uses `hashGenerator` to fetch CSV files and create a combined SHA256 hash
4. Sends the hash and metadata to the deployed smart contract
5. Retrieves the report and prints it

**Important:** Hash stored on-chain is SHA256, not Keccak.

### verifyReport.js

This script performs integrity verification:

1. Reads a JSON report (`report.json`)
2. Imports the `hashGenerator` utility from `utils/hashGenerator.js`
3. Rehashes the report and its CSV files using the same algorithm
4. Fetches the on-chain hash from the smart contract using the job ID
5. Compares the newly generated hash with the on-chain hash
6. Displays verification results (✅ Match or ❌ Mismatch)

**Usage:**
```bash
# For local testing
npx hardhat run scripts/verifyReport.js --network localhost

# For Sepolia testnet
npx hardhat run scripts/verifyReport.js --network sepolia
```

### hashGenerator.js

A utility module located in `utils/hashGenerator.js` that provides hash generation functionality:

**Exported Function:**
- `generateHash(reportData)` - Takes report JSON data, fetches associated CSV files, combines all content, and returns a SHA256 hash

**Features:**
- Fetches CSV files from URLs specified in the report
- Combines JSON metadata with CSV content
- Generates consistent SHA256 hashes for integrity verification
- Used by both `storeReport.js` and `verifyReport.js`

---

## Smart Contract Details

### Contract: `HashRegistry.sol`

#### Struct: Report

```solidity
struct Report {
    bytes32 reportHash;
    string jobId;
    string productName;
    string username;
    uint256 timestamp;
    address uploadedBy;
}
```

#### Functions

- **`storeReport(string jobId, bytes32 reportHash, string productName, string username)`**  
  Stores a report hash with metadata on-chain.

- **`getReport(string jobId)`**  
  Retrieves a report by job ID.

- **`verifyReportHash(string jobId, bytes32 hash)`**  
  Verifies if a given hash matches the stored report hash.

#### Events

- **`event ReportStored(string indexed jobId,bytes32 indexed reportHash,string productName,string indexed username,uint256 timestamp,address uploadedBy)`**

#### Custom Errors

- `HashRegistry__EmptyJobId`
- `HashRegistry__EmptyHash`
- `HashRegistry__JobAlreadyExists`
- `HashRegistry___ReportNotFound`

---

## Sample Output

```
Combined SHA256 hash: 0x7bf6c70192cd36d40a420199a49e79cfcf9a4dff98f9c3ccb24992e3a7efbab7
Storing report for job: 649223be-d198-40f1-b5ab-ec200b43941b
Stored on-chain in tx: 0xa8dba2ce9a9a125cec875636c0a8bcb60bef4613f521b7b1d8836d04bd9be63c

📖 On-chain reports:
{
  hash: '0x7bf6c70192cd36d40a420199a49e79cfcf9a4dff98f9c3ccb24992e3a7efbab7',
  jobId: '649223be-d198-40f1-b5ab-ec200b43941b',
  productName: 'L10_GRAIN_ANALYSIS',
  username: 'gurveerl10',
  timestamp: '2025-10-07T14:34:13.000Z',
  uploadedBy: '0x6789fb087E2966ee52b707D7187dC4eD673D58C8'
}
```

---

## Notes

- Hardhat automatically provides local accounts with test ETH for local deployment.
- SHA256 hash ensures off-chain data integrity.
- Timestamp is stored as `uint256` on-chain; scripts convert it to human-readable format.
- For Sepolia deployment, ensure your wallet has Sepolia ETH to pay for gas.

---

## License

This project is licensed under the MIT License.
