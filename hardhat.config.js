require("dotenv").config({path: 'hardhat.env'});
require("@nomicfoundation/hardhat-toolbox");
require("solidity-docgen");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.17",
  
  // It's the network used for the tests and the stand alone network
  defaultNetwork: "mumbai",

  /**
   * SECTION FORK NETWORK + DEPLOY
   */
  networks: {
    hardhat: {
    },
    mumbai: {
      url: `https://polygon-mumbai.infura.io/v3/${process.env.MUMBAI_PROJECT_ID}`,
      // This is the private key of the account that we want to use for the deployement (the one that has the funds, get it with metamask)
      accounts: [process.env.PRIVATE_KEY]
    },
    polygon: {
      url: `https://polygon-mainnet.infura.io/v3/${process.env.POLYGON_PROJECT_ID}`,
      accounts: [process.env.PRIVATE_KEY]
    }
  },

  gasReporter: {
    enabled: process.env.REPORT_GAS !== undefined,
    currency: "USD",
  },

  /**
   * SECTION VERIFY SMART CONTRACT
   */
  etherscan: {
    // apiKey: process.env.ETHERSCAN_API_KEY,
    apiKey: {
      mainnet: process.env.POLYGON_API_KEY,
      polygon: process.env.POLYGON_API_KEY,
     polygonMumbai: process.env.POLYGON_API_KEY,
    }
  },

  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts"
  },

  solidity: {
    version: "0.8.12",
    settings: {
      optimizer: {
        enabled: true,
        runs: 1000,
      },
    },
  },

  docgen: {
    pages: "files"
  }, 
};
