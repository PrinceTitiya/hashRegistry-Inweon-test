const { expect } = require("chai")
const { ethers } = require("hardhat");
const crypto = require("crypto");

describe("HashRegistry", function(){
    let HashRegistry, registry, owner, user;
    const jobId = "JOB123"
    const productName = "GRAIN_ANALYSIS"
    const username = "operator01"
    const dataToHash = "sample_report_data"
    const reportHash = "0x" + crypto.createHash("sha256").update(dataToHash).digest("hex");

    beforeEach(async()=>{
        [owner,user] = await ethers.getSigners();

        HashRegistry = await ethers.getContractFactory("HashRegistry");
        registry  = await HashRegistry.deploy(owner.address);
        await registry.waitForDeployment();
    });

    it("should set the correct owner",async function(){
        expect(await registry.owner()).to.equal(owner.address);
    })

    it("should store a report successfully", async function(){
        await registry.connect(owner).storeReport(jobId, reportHash, productName, username);

        const stored = await registry.getReport(jobId);
        expect(stored.reportHash).to.equal(reportHash);
        expect(stored.jobId).to.equal(jobId);
        expect(stored.productName).to.equal(productName);
        expect(stored.username).to.equal(username);
        expect(stored.uploadedBy).to.equal(owner.address);
    });

    it("should revert if jobId already exists",async function(){
        await registry.storeReport(jobId, reportHash, productName, username);

        await expect(
            registry.storeReport(jobId, reportHash, productName, username)
        ).to.be.revertedWithCustomError(registry, "HashRegistry__JobAlreadyExists");
    });

    it("should revert for empty jobId", async function(){
        await expect(
            registry.storeReport("",reportHash, productName, username)
        ).to.be.revertedWithCustomError(registry,"HashRegistry__EmptyJobId");
    });

    it("should revert for empty report hash", async function(){
        await expect(
            registry.storeReport(jobId, ethers.ZeroHash, productName, username)
        ).to.be.revertedWithCustomError(registry,"HashRegistry__EmptyHash");
    });

    it("should return correct report data", async function () {
        await registry.storeReport(jobId, reportHash, productName, username);
        const report = await registry.getReport(jobId);
        expect(report.jobId).to.equal(jobId);
    });

    it("should revert if verifying non-existent report", async function(){
        await expect(
            registry.verifyReportHash("UNKNOWN", reportHash)
        ).to.be.revertedWith("Report not found")
    });

    it("should not allow non-owner to store report", async function(){
        await expect(
            registry.connect(user).storeReport(jobId, reportHash, productName, username)
        ).to.be.revertedWithCustomError(registry,"OwnableUnauthorizedAccount");
    });

})