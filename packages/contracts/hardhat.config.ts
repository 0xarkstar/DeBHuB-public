import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import * as dotenv from "dotenv";

// Load environment variables from .env file
dotenv.config();

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    hardhat: {},
    localhost: {
      url: "http://127.0.0.1:8545"
    },
    "irys-testnet": {
      url: "https://testnet-rpc.irys.xyz/v1/execution-rpc",
      chainId: 1270,
      accounts: process.env.IRYS_PRIVATE_KEY ? [process.env.IRYS_PRIVATE_KEY] : [],
      gasPrice: 20000000000, // 20 gwei
      gas: 10000000
    },
  },
  typechain: {
    outDir: "typechain-types",
    target: "ethers-v6",
  },
};

export default config;