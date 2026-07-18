// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

interface IAgentRegistry {
    function recordJobCompletion(address agent, uint8 rating) external;
    function recordDispute(address agent) external;
}

/// @title FreelanceGuard JobEscrow
/// @notice ERC-8183-inspired USDC escrow for freelance jobs with AI-arbitrated disputes
contract JobEscrow is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    enum Status {
        Open,          // 0: job posted, funds locked, waiting for freelancer
        InProgress,    // 1: freelancer assigned
        Submitted,     // 2: freelancer submitted deliverable
        Approved,      // 3: client approved, funds released
        Disputed,      // 4: client disputed, waiting for AI Judge
        Resolved,      // 5: AI Judge resolved
        Refunded       // 6: refunded (deadline expired or resolved as refund)
    }

    struct Job {
        uint256 id;
        address client;
        address freelancer;
        uint256 amount;              // in USDC units (6 decimals)
        uint256 deadline;            // unix timestamp
        Status status;
        bytes32 criteriaHash;        // keccak256 of criteria string
        bytes32 deliverableHash;     // keccak256 of deliverable URL + notes
        uint256 createdAt;
        uint256 submittedAt;
    }

    IERC20 public immutable usdc;
    IAgentRegistry public agentRegistry;
    address public aiJudge;
    uint256 public platformFeeBps = 200; // 2%
    uint256 public constant MAX_FEE_BPS = 1000; // max 10%
    uint256 public constant BPS_DENOMINATOR = 10000;
    uint256 public accumulatedFees;

    uint256 private _jobCounter;
    mapping(uint256 => Job) public jobs;

    event JobCreated(uint256 indexed jobId, address indexed client, address indexed freelancer, uint256 amount, uint256 deadline);
    event DeliverableSubmitted(uint256 indexed jobId, bytes32 deliverableHash);
    event JobApproved(uint256 indexed jobId, uint256 freelancerAmount, uint256 fee);
    event JobDisputed(uint256 indexed jobId, string reason);
    event DisputeResolved(uint256 indexed jobId, uint256 freelancerBps, string reasoning);
    event JobRefunded(uint256 indexed jobId, uint256 amount);
    event AIJudgeUpdated(address indexed newJudge);
    event PlatformFeeUpdated(uint256 newBps);
    event FeesWithdrawn(address indexed to, uint256 amount);

    modifier onlyClient(uint256 jobId) {
        require(jobs[jobId].client == msg.sender, "Not client");
        _;
    }

    modifier onlyFreelancer(uint256 jobId) {
        require(jobs[jobId].freelancer == msg.sender, "Not freelancer");
        _;
    }

    modifier onlyAIJudge() {
        require(msg.sender == aiJudge, "Not AI Judge");
        _;
    }

    modifier jobExists(uint256 jobId) {
        require(jobs[jobId].id != 0 || jobId == 0, "Job not found");
        require(jobId < _jobCounter, "Invalid job ID");
        _;
    }

    constructor(address _usdc, address _agentRegistry) Ownable(msg.sender) {
        require(_usdc != address(0), "Invalid USDC address");
        usdc = IERC20(_usdc);
        agentRegistry = IAgentRegistry(_agentRegistry);
        aiJudge = msg.sender; // deployer is initial AI Judge; can be changed
    }

    /// @notice Client creates a job and locks USDC
    function createJob(
        address freelancer,
        uint256 amount,
        uint256 deadline,
        bytes32 criteriaHash
    ) external nonReentrant returns (uint256 jobId) {
        require(freelancer != address(0), "Invalid freelancer");
        require(freelancer != msg.sender, "Cannot hire self");
        require(amount > 0, "Amount must be > 0");
        require(deadline > block.timestamp, "Deadline in past");

        jobId = _jobCounter++;
        jobs[jobId] = Job({
            id: jobId,
            client: msg.sender,
            freelancer: freelancer,
            amount: amount,
            deadline: deadline,
            status: Status.InProgress,
            criteriaHash: criteriaHash,
            deliverableHash: bytes32(0),
            createdAt: block.timestamp,
            submittedAt: 0
        });

        usdc.safeTransferFrom(msg.sender, address(this), amount);

        emit JobCreated(jobId, msg.sender, freelancer, amount, deadline);
    }

    /// @notice Freelancer submits deliverable
    function submitDeliverable(uint256 jobId, bytes32 deliverableHash)
        external
        onlyFreelancer(jobId)
    {
        Job storage job = jobs[jobId];
        require(job.status == Status.InProgress, "Not in progress");
        require(deliverableHash != bytes32(0), "Empty deliverable");

        job.deliverableHash = deliverableHash;
        job.submittedAt = block.timestamp;
        job.status = Status.Submitted;

        emit DeliverableSubmitted(jobId, deliverableHash);
    }

    /// @notice Client approves deliverable, releases funds
    function approveJob(uint256 jobId) external nonReentrant onlyClient(jobId) {
        Job storage job = jobs[jobId];
        require(job.status == Status.Submitted, "Not submitted");

        uint256 fee = (job.amount * platformFeeBps) / BPS_DENOMINATOR;
        uint256 freelancerAmount = job.amount - fee;

        job.status = Status.Approved;
        accumulatedFees += fee;

        usdc.safeTransfer(job.freelancer, freelancerAmount);

        // Record reputation
        if (address(agentRegistry) != address(0)) {
            try agentRegistry.recordJobCompletion(job.freelancer, 5) {} catch {}
        }

        emit JobApproved(jobId, freelancerAmount, fee);
    }

    /// @notice Client disputes deliverable
    function disputeJob(uint256 jobId, string calldata reason)
        external
        onlyClient(jobId)
    {
        Job storage job = jobs[jobId];
        require(job.status == Status.Submitted, "Not submitted");
        require(bytes(reason).length > 0, "Empty reason");

        job.status = Status.Disputed;

        if (address(agentRegistry) != address(0)) {
            try agentRegistry.recordDispute(job.freelancer) {} catch {}
        }

        emit JobDisputed(jobId, reason);
    }

    /// @notice AI Judge resolves dispute — distributes based on freelancerBps (0-10000)
    function resolveDispute(
        uint256 jobId,
        uint256 freelancerBps,
        string calldata reasoning
    ) external nonReentrant onlyAIJudge {
        Job storage job = jobs[jobId];
        require(job.status == Status.Disputed, "Not disputed");
        require(freelancerBps <= BPS_DENOMINATOR, "Invalid bps");

        uint256 fee = (job.amount * platformFeeBps) / BPS_DENOMINATOR;
        uint256 netAmount = job.amount - fee;
        uint256 toFreelancer = (netAmount * freelancerBps) / BPS_DENOMINATOR;
        uint256 toClient = netAmount - toFreelancer;

        job.status = Status.Resolved;
        accumulatedFees += fee;

        if (toFreelancer > 0) usdc.safeTransfer(job.freelancer, toFreelancer);
        if (toClient > 0) usdc.safeTransfer(job.client, toClient);

        if (address(agentRegistry) != address(0) && freelancerBps >= 5000) {
            uint8 rating = uint8((freelancerBps * 5) / BPS_DENOMINATOR);
            try agentRegistry.recordJobCompletion(job.freelancer, rating) {} catch {}
        }

        emit DisputeResolved(jobId, freelancerBps, reasoning);
    }

    /// @notice Refund if deadline expired and no submission
    function refundIfExpired(uint256 jobId) external nonReentrant {
        Job storage job = jobs[jobId];
        require(job.status == Status.InProgress, "Not eligible");
        require(block.timestamp > job.deadline, "Not expired");

        job.status = Status.Refunded;
        usdc.safeTransfer(job.client, job.amount);

        emit JobRefunded(jobId, job.amount);
    }

    // === Admin functions ===

    function setAIJudge(address newJudge) external onlyOwner {
        require(newJudge != address(0), "Invalid judge");
        aiJudge = newJudge;
        emit AIJudgeUpdated(newJudge);
    }

    function setAgentRegistry(address _registry) external onlyOwner {
        agentRegistry = IAgentRegistry(_registry);
    }

    function setPlatformFee(uint256 newBps) external onlyOwner {
        require(newBps <= MAX_FEE_BPS, "Fee too high");
        platformFeeBps = newBps;
        emit PlatformFeeUpdated(newBps);
    }

    function withdrawFees(address to) external onlyOwner nonReentrant {
        require(to != address(0), "Invalid recipient");
        uint256 amount = accumulatedFees;
        require(amount > 0, "No fees");
        accumulatedFees = 0;
        usdc.safeTransfer(to, amount);
        emit FeesWithdrawn(to, amount);
    }

    // === View functions ===

    function getJob(uint256 jobId) external view returns (Job memory) {
        return jobs[jobId];
    }

    function totalJobs() external view returns (uint256) {
        return _jobCounter;
    }
}
