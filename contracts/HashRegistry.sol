// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";

contract HashRegistry is Ownable {
    struct Report {
        string jobId;
        bytes32 reportHash;                  
        string productName;      
        string username;         
        uint256 timestamp;       
        address uploadedBy;      
    }

    mapping(string => Report) public reportsByJob;
    
    //  Events //
    event ReportStored(
        string indexed jobId,
        bytes32 indexed reportHash,
        string productName,
        string indexed username,
        uint256 timestamp,
        address uploadedBy
    );

    // custom errors //
    error HashRegistry__EmptyJobId();
    error HashRegistry__EmptyHash();
    error HashRegistry__JobAlreadyExists(string jobId);
    error HashRegistry___ReportNotFound(string jobId);
    
    // constructor //
    constructor(address initialOwner) Ownable(initialOwner) {}

    // modifiers //
    modifier validNewReport(string calldata jobId, bytes32 reportHash){
        if(bytes(jobId).length==0) revert HashRegistry__EmptyJobId();
        if(reportHash == bytes32(0)) revert HashRegistry__EmptyHash();
        if(reportsByJob[jobId].timestamp != 0) revert HashRegistry__JobAlreadyExists(jobId);
        _;
    }

    modifier reportExists(string calldata jobId){
        if(reportsByJob[jobId].timestamp == 0) revert HashRegistry___ReportNotFound(jobId);
        _;
    }


    /**
     * @notice Store a verified report hash on-chain for a given jobId
     * @dev Each jobId can be used only once
     */

    function storeReport(
        string calldata jobId,
        bytes32 reportHash,
        string calldata productName,
        string calldata username
    ) external onlyOwner validNewReport(jobId, reportHash){
        reportsByJob[jobId] = Report({
            reportHash: reportHash,
            jobId: jobId,
            productName: productName,
            username: username,
            timestamp: block.timestamp,
            uploadedBy: msg.sender
        });

        emit ReportStored(
            jobId,
            reportHash,
            productName,
            username,
            block.timestamp,
            msg.sender
        );
    }

    /**
     * @notice View the report metadata by jobId
     */
    function getReport(string calldata jobId)
        external
        view
        reportExists(jobId)
        returns (Report memory)
    {
        return reportsByJob[jobId];
    }

    /**
     * @notice Verify if a provided hash matches the stored report hash
     */
    function verifyReportHash(string calldata jobId, bytes32 providedHash)
    external
    view
    reportExists(jobId)
    returns (bool)
    {
        return reportsByJob[jobId].reportHash == providedHash;
    }
}
