const { generateHash } = require("./utils/hashGenerator");

async function main() {
  const reportPath = "./report.json";
  const { hashHex } = await generateHash(reportPath);
  console.log("Combined SHA256 Hash of the sample report:", hashHex);
}

main().catch((err) => {
  console.error("Error generating hash:", err);
});
