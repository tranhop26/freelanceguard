import hre from "hardhat";
const { ethers } = hre;
import * as fs from "fs";
import * as path from "path";
import * as dotenv from "dotenv";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, "../../.env.local") });

async function main() {
  const USDC_ADDRESS = process.env.NEXT_PUBLIC_USDC_ADDRESS;
  if (!USDC_ADDRESS) throw new Error("USDC address not set");

  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Balance:", ethers.formatUnits(balance, 6), "USDC (gas token)");

  // Deploy AgentRegistry
  console.log("\n📦 Deploying AgentRegistry...");
  const Registry = await ethers.getContractFactory("AgentRegistry");
  const registry = await Registry.deploy();
  await registry.waitForDeployment();
  const registryAddress = await registry.getAddress();
  console.log("✅ AgentRegistry:", registryAddress);

  // Deploy JobEscrow
  console.log("\n📦 Deploying JobEscrow...");
  const Escrow = await ethers.getContractFactory("JobEscrow");
  const escrow = await Escrow.deploy(USDC_ADDRESS, registryAddress);
  await escrow.waitForDeployment();
  const escrowAddress = await escrow.getAddress();
  console.log("✅ JobEscrow:", escrowAddress);

  // Wire up
  console.log("\n🔗 Wiring contracts...");
  const tx1 = await registry.setJobEscrow(escrowAddress);
  await tx1.wait();
  console.log("✅ AgentRegistry.jobEscrow set");

  const tx2 = await escrow.setAIJudge(deployer.address);
  await tx2.wait();
  console.log("JobEscrow.aiJudge set to deployer");

  // Save deployment info
  const deploymentInfo = {
    network: "arcTestnet",
    chainId: 5042002,
    timestamp: new Date().toISOString(),
    deployer: deployer.address,
    contracts: {
      AgentRegistry: registryAddress,
      JobEscrow: escrowAddress,
      USDC: USDC_ADDRESS,
    },
  };

  const deploymentPath = path.join(__dirname, "..", "deployments", "arcTestnet.json");
  fs.writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2));
  console.log("\n📄 Deployment saved to:", deploymentPath);

  // Update .env.local
  const envPath = path.resolve(__dirname, "../../.env.local");
  let env = fs.readFileSync(envPath, "utf-8");
  
  if (env.includes("NEXT_PUBLIC_JOB_ESCROW_ADDRESS=")) {
    env = env.replace(/NEXT_PUBLIC_JOB_ESCROW_ADDRESS=.*/g, `NEXT_PUBLIC_JOB_ESCROW_ADDRESS=${escrowAddress}`);
  } else {
    env += `\nNEXT_PUBLIC_JOB_ESCROW_ADDRESS=${escrowAddress}`;
  }

  if (env.includes("NEXT_PUBLIC_AGENT_REGISTRY_ADDRESS=")) {
    env = env.replace(/NEXT_PUBLIC_AGENT_REGISTRY_ADDRESS=.*/g, `NEXT_PUBLIC_AGENT_REGISTRY_ADDRESS=${registryAddress}`);
  } else {
    env += `\nNEXT_PUBLIC_AGENT_REGISTRY_ADDRESS=${registryAddress}`;
  }

  fs.writeFileSync(envPath, env);
  console.log("✅ .env.local updated with contract addresses");

  console.log("\n🎉 Deployment complete!");
  console.log(`\nExplorer links:`);
  console.log(`- AgentRegistry: https://testnet.arcscan.app/address/${registryAddress}`);
  console.log(`- JobEscrow: https://testnet.arcscan.app/address/${escrowAddress}`);
}

main().catch((error) => {
  console.error("❌ Deployment failed:", error);
  process.exit(1);
});
