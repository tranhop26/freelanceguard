import { expect } from "chai";
import { ethers } from "hardhat";
import { JobEscrow, AgentRegistry } from "../typechain-types";

describe("JobEscrow", () => {
  let usdc: any;
  let registry: AgentRegistry;
  let escrow: JobEscrow;
  let owner: any, client: any, freelancer: any, judge: any;

  beforeEach(async () => {
    [owner, client, freelancer, judge] = await ethers.getSigners();

    // Deploy mock USDC (6 decimals)
    const MockUSDC = await ethers.getContractFactory("MockERC20");
    usdc = await MockUSDC.deploy("USD Coin", "USDC", 6);
    await usdc.waitForDeployment();

    // Deploy registry
    const Registry = await ethers.getContractFactory("AgentRegistry");
    registry = await Registry.deploy();
    await registry.waitForDeployment();

    // Deploy escrow
    const Escrow = await ethers.getContractFactory("JobEscrow");
    escrow = await Escrow.deploy(await usdc.getAddress(), await registry.getAddress());
    await escrow.waitForDeployment();

    // Wire up
    await registry.setJobEscrow(await escrow.getAddress());
    await escrow.setAIJudge(judge.address);

    // Mint USDC to client
    await usdc.mint(client.address, 1000_000000n); // 1000 USDC
    await usdc.connect(client).approve(await escrow.getAddress(), 1000_000000n);
  });

  async function getBlockTimestamp(): Promise<number> {
    const block = await ethers.provider.getBlock("latest");
    if (!block) throw new Error("No block found");
    return block.timestamp;
  }

  it("creates a job and locks funds", async () => {
    const criteriaHash = ethers.keccak256(ethers.toUtf8Bytes("Design a logo"));
    const currentTimestamp = await getBlockTimestamp();
    const deadline = currentTimestamp + 86400;

    await expect(
      escrow.connect(client).createJob(freelancer.address, 100_000000n, deadline, criteriaHash)
    ).to.emit(escrow, "JobCreated");

    expect(await usdc.balanceOf(await escrow.getAddress())).to.equal(100_000000n);
  });

  it("happy path: submit + approve releases funds minus fee", async () => {
    const currentTimestamp = await getBlockTimestamp();
    const deadline = currentTimestamp + 86400;
    await escrow.connect(client).createJob(freelancer.address, 100_000000n, deadline, ethers.ZeroHash);

    const deliverableHash = ethers.keccak256(ethers.toUtf8Bytes("logo.png"));
    await escrow.connect(freelancer).submitDeliverable(0, deliverableHash);
    await escrow.connect(client).approveJob(0);

    // 2% fee = 2 USDC, freelancer gets 98 USDC
    expect(await usdc.balanceOf(freelancer.address)).to.equal(98_000000n);
    expect(await escrow.accumulatedFees()).to.equal(2_000000n);
  });

  it("dispute path: AI Judge splits 60/40", async () => {
    const currentTimestamp = await getBlockTimestamp();
    const deadline = currentTimestamp + 86400;
    await escrow.connect(client).createJob(freelancer.address, 100_000000n, deadline, ethers.ZeroHash);
    await escrow.connect(freelancer).submitDeliverable(0, ethers.keccak256(ethers.toUtf8Bytes("v1")));
    await escrow.connect(client).disputeJob(0, "Missing colors");

    // AI Judge: 60% to freelancer
    await escrow.connect(judge).resolveDispute(0, 6000, "Partial match");

    // net = 98 (after 2% fee), 60% = 58.8, 40% = 39.2
    expect(await usdc.balanceOf(freelancer.address)).to.equal(58_800000n);
    expect(await usdc.balanceOf(client.address)).to.equal(939_200000n); // 1000 - 100 + 39.2
  });

  it("refunds if deadline expired", async () => {
    const currentTimestamp = await getBlockTimestamp();
    const deadline = currentTimestamp + 10;
    await escrow.connect(client).createJob(freelancer.address, 100_000000n, deadline, ethers.ZeroHash);

    // Advance time
    await ethers.provider.send("evm_increaseTime", [20]);
    await ethers.provider.send("evm_mine", []);

    await escrow.refundIfExpired(0);
    expect(await usdc.balanceOf(client.address)).to.equal(1000_000000n);
  });

  it("reputation updates on completion", async () => {
    const currentTimestamp = await getBlockTimestamp();
    const deadline = currentTimestamp + 86400;
    await escrow.connect(client).createJob(freelancer.address, 100_000000n, deadline, ethers.ZeroHash);
    await escrow.connect(freelancer).submitDeliverable(0, ethers.keccak256(ethers.toUtf8Bytes("v1")));
    await escrow.connect(client).approveJob(0);

    const [jobs, avg, disputes, reliability] = await registry.getReputation(freelancer.address);
    expect(jobs).to.equal(1n);
    expect(avg).to.equal(500n); // 5.00 stars
    expect(disputes).to.equal(0n);
    expect(reliability).to.be.gt(0n);
  });
});
