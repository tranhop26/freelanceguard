import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import * as dotenv from "dotenv";
import * as path from "path";

// Load .env.local from parent directory (project root)
dotenv.config({ path: path.resolve(__dirname, "../.env.local") });

const PRIVATE_KEY = process.env.DEPLOYER_PRIVATE_KEY;
const RPC_URL = process.env.NEXT_PUBLIC_ARC_RPC_URL || "https://rpc.testnet.arc.network";
const CHAIN_ID = parseInt(process.env.NEXT_PUBLIC_ARC_CHAIN_ID || "5042002");

if (!PRIVATE_KEY) {
  throw new Error("DEPLOYER_PRIVATE_KEY not found in .env.local");
}

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.24",
    settings: {
      optimizer: { enabled: true, runs: 200 },
      viaIR: true,
    },
  },
  networks: {
    arcTestnet: {
      url: RPC_URL,
      accounts: [PRIVATE_KEY],
      chainId: CHAIN_ID,
      gasPrice: "auto",
    },
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },
};

export default config;
