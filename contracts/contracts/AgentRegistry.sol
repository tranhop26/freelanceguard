// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";

/// @title FreelanceGuard AgentRegistry
/// @notice ERC-8004-inspired on-chain reputation registry for freelancers
contract AgentRegistry is Ownable {
    struct AgentInfo {
        bool registered;
        string metadataURI;
        uint256 jobsCompleted;
        uint256 totalRating;        // sum of all ratings (each 1-5)
        uint256 disputeCount;
        uint256 registeredAt;
    }

    mapping(address => AgentInfo) public agents;
    address public jobEscrow;
    uint256 public totalAgents;

    event AgentRegistered(address indexed agent, string metadataURI);
    event JobCompletionRecorded(address indexed agent, uint8 rating);
    event DisputeRecorded(address indexed agent);
    event JobEscrowUpdated(address indexed newEscrow);

    modifier onlyJobEscrow() {
        require(msg.sender == jobEscrow, "Not JobEscrow");
        _;
    }

    constructor() Ownable(msg.sender) {}

    function registerAgent(string calldata metadataURI) external {
        require(!agents[msg.sender].registered, "Already registered");

        agents[msg.sender] = AgentInfo({
            registered: true,
            metadataURI: metadataURI,
            jobsCompleted: 0,
            totalRating: 0,
            disputeCount: 0,
            registeredAt: block.timestamp
        });

        totalAgents++;
        emit AgentRegistered(msg.sender, metadataURI);
    }

    function recordJobCompletion(address agent, uint8 rating) external onlyJobEscrow {
        require(rating >= 1 && rating <= 5, "Rating 1-5");

        AgentInfo storage info = agents[agent];
        if (!info.registered) {
            // Auto-register if not registered
            info.registered = true;
            info.registeredAt = block.timestamp;
            totalAgents++;
        }

        info.jobsCompleted++;
        info.totalRating += rating;

        emit JobCompletionRecorded(agent, rating);
    }

    function recordDispute(address agent) external onlyJobEscrow {
        AgentInfo storage info = agents[agent];
        if (!info.registered) {
            info.registered = true;
            info.registeredAt = block.timestamp;
            totalAgents++;
        }
        info.disputeCount++;
        emit DisputeRecorded(agent);
    }

    /// @notice Returns reputation summary
    /// @return jobsCompleted Number of completed jobs
    /// @return avgRatingScaled Average rating * 100 (e.g., 480 = 4.8 stars)
    /// @return disputeCount Number of disputes
    /// @return reliabilityScore 0-1000 (higher = more reliable)
    function getReputation(address agent) external view returns (
        uint256 jobsCompleted,
        uint256 avgRatingScaled,
        uint256 disputeCount,
        uint256 reliabilityScore
    ) {
        AgentInfo memory info = agents[agent];
        jobsCompleted = info.jobsCompleted;
        disputeCount = info.disputeCount;

        if (jobsCompleted > 0) {
            avgRatingScaled = (info.totalRating * 100) / jobsCompleted;
        } else {
            avgRatingScaled = 0;
        }

        // Reliability: (completed*100 - disputes*50) / (completed+1), clamped 0-1000
        if (jobsCompleted == 0 && disputeCount == 0) {
            reliabilityScore = 0;
        } else {
            int256 raw = (int256(jobsCompleted) * 100 - int256(disputeCount) * 50) * 10 / int256(jobsCompleted + 1);
            if (raw < 0) reliabilityScore = 0;
            else if (raw > 1000) reliabilityScore = 1000;
            else reliabilityScore = uint256(raw);
        }
    }

    function setJobEscrow(address _escrow) external onlyOwner {
        require(_escrow != address(0), "Invalid address");
        jobEscrow = _escrow;
        emit JobEscrowUpdated(_escrow);
    }

    function isRegistered(address agent) external view returns (bool) {
        return agents[agent].registered;
    }
}
