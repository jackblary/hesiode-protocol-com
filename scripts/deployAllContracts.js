/* eslint-disable no-console */
/* eslint-disable no-undef */
const fs = require('fs');
const { ethers } = require('hardhat');
const path = require('path');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const qs = require('qs');
const { chain } = require("mathjs");
const { drawTitle } = require('./utils');


//////////////////////
//    CONSTANT      //
//////////////////////

const USDC_CONTRACT_NAME = "MockUSDC"
const USDC_NAME = "USDC"
const WMATIC_NAME = "WMATIC"
const FUND_LOGIC_CONTRACT_NAME = "FundLogic"
const FUND_LOGIC_CONTRACT_FILE = "contracts/fund/FundLogic.sol:FundLogic"
const FUND_FACTORY_CONTRACT_NAME = "FundFactory"
const FUND_FACTORY_CONTRACT_FILE = "contracts/factory/FundFactory.sol:FundFactory"
const VALUE_INTERPRETER_CONTRACT_NAME = "ValueInterpreter"
const VALUE_INTERPRETER_CONTRACT_FILE = "contracts/Infrastructure/ValueInterpreter.sol:ValueInterpreter"
const ZERO_EX_EXCHANGE_NAME = "ZERO_EX"

const ADDRESSES_FILE = "../public/contracts/addresses.json"
const FUND_FACTORY_ARGUMENTS_FILE = "../public/contracts/fundFactoryArguments.js"

// Time
const ONE_HOUR_IN_SECONDS = 60 * 60;
const ONE_DAY_IN_SECONDS = ONE_HOUR_IN_SECONDS * 24;
const ONE_WEEK_IN_SECONDS = ONE_DAY_IN_SECONDS * 7;
const ONE_YEAR_IN_SECONDS = ONE_DAY_IN_SECONDS * 365.25;

const TOKENS_ADDRESS = {
  // Polygon
  137: {
    USDC: "0x2791bca1f2de4661ed88a30c99a7a9449aa84174",
    WMATIC: "0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270",
    ZERO_EX:"0xdef1c0ded9bec7f1a1670819833240f027b25eff",
  },
  // Mumbai
  80001: {
    USDC: "0xe6b8a5CF854791412c1f6EFC7CAf629f5Df1c747",
    WMATIC: "0x9c3C9283D3e44854697Cd22D3Faa240Cfb032889",
    ZERO_EX:"0x4Fb72262344034e034fCE3D9c701fD9213A55260",
  },
  // localhost (if copy of Polygon mainnet)
  31337: {
    USDC: "0x2791bca1f2de4661ed88a30c99a7a9449aa84174",
    WMATIC: "0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270",
    ZERO_EX:"0xdef1c0ded9bec7f1a1670819833240f027b25eff",
  }
}

let GLOBAL_USDC_ADDRESS = ""
let GLOBAL_WMATIC_ADDRESS = ""
let GLOBAL_ZERO_EX_EXCHANGE_ADDRESS = ""


//////////////////////
//    FUNCTIONS     //
//////////////////////

/**
 * 
 * @param {bool} hasToDeployContract 
 */
async function deployMockUSDCContract(hasToDeployContract = false) {
  if (hasToDeployContract) {
    // deploy the contract
    const contractFactory = await ethers.getContractFactory(USDC_CONTRACT_NAME);
    const contract = await contractFactory.deploy();

    console.info(USDC_NAME + " address (MOCK): " + contract.address);
    GLOBAL_USDC_ADDRESS = contract.address
  }

  // copy the contract JSON file to front-end and add the address field in it
  fs.copyFileSync(
    path.join(__dirname, "../artifacts/contracts/mock/" + USDC_CONTRACT_NAME + ".sol/" + USDC_CONTRACT_NAME + ".json"), //source
    path.join(__dirname, "../public/contracts/" + USDC_NAME + ".json") // destination
  );
}

/**
 * 
 * @param {object} params 
 * @param {bool} deployerAsSigner 
 * @param {integer} chainId 
 * @returns 
 */
async function swapToken(params, deployerAsSigner, chainId) {
  if(!params || !deployerAsSigner || !chainId) {
    console.error("swapToken: missing params, deployerAsSigner or chainId");
    return
  }

  let response;
  try {
    const url = `https://polygon.api.0x.org/swap/v1/quote?${qs.stringify(params)}`

    response = await fetch(url);
    console.info("swapToken: url quote", url);
  } catch (error) {
    console.error("swapToken: errror fetch quote");
  }

  // PARSE RESPONSE TO JSON
  let minimalResponse;
  try {
    const jsonResponse = await response.json();
    
    if (!jsonResponse.code) {
      minimalResponse = {
        // chainId: 137,
        chainId: chainId,
        to: jsonResponse.to,
        data: jsonResponse.data,
        value: jsonResponse.value,
        from: jsonResponse.from,
        gasPrice: jsonResponse.gasPrice,
        gasLimit: "4892090"
      };
    } else {
      console.error("swapToken: response error");
      minimalResponse = false
    }
  } catch (error) {
    console.error("swapToken: error json");
  }

  // SEND TRANSACTION
  if (minimalResponse) {
    // SEND TRANSACTION
    try {
      await deployerAsSigner.sendTransaction(minimalResponse)
      return true
    } catch (error) {
      console.error("getWMATIC: error sending transaction", error);
    }
  } else {
    return false
  }
}

/**
 * 
 * @param {bool} deployerAsSigner 
 * @param {integer} chainId 
 * @returns 
 */
async function getWMATIC(deployerAsSigner, chainId) {
  console.info();
  console.info("-- BEGIN SWAP WMATIC --");
  // Note that the MATIC token uses 18 decimal places, so `sellAmount` is `500 * 10^18`.
  const sellAmount = chain(500).multiply(10**18).done().toString() // 500000000000000000000
  const params = {
      // Not all token symbols are supported. The address of the token can be used instead.
      sellToken: 'MATIC', 
      buyToken: 'WMATIC',
      sellAmount, 
      takerAddress: deployerAsSigner.address
  }
  
  const response = await swapToken(params, deployerAsSigner, chainId)
  if (response) {
    console.info("getWMATIC: swap done !");
    console.info("------");
    return true
  } else {
    console.error("getWMATIC: error during swap");
    console.info("------");
    return false
  }
}

/**
 * 
 * @param {bool} deployerAsSigner 
 * @param {integer} chainId 
 * @returns 
 */
async function getUSDC(deployerAsSigner, chainId) {
  console.info();
  console.info("-- BEGIN SWAP USDC --");
  // Note that the MATIC token uses 18 decimal places, so `sellAmount` is `500 * 10^18`.
  const sellAmount = chain(500).multiply(10**18).done().toString() // 500000000000000000000
  const params = {
      // Not all token symbols are supported. The address of the token can be used instead.
      sellToken: 'MATIC', 
      buyToken: 'USDC',
      sellAmount,
      // takerAddress: deployerAsSigner.address
  }
  
  const response = await swapToken(params, deployerAsSigner, chainId)
  if (response) {
    console.info("getUSDC: swap done !");
    console.info("------");
    return true
  } else {
    console.error("getUSDC: error during swap");
    console.info("------");
    return false
  }
}

/**
 * 
 * @param {bool} deployerAsSigner 
 * @param {integer} chainId 
 * @returns 
 */
async function getTokens(deployerAsSigner, chainId) {
  if (!deployerAsSigner) {
    console.error("getTokens: deployerAsSigner needed");
    return
  }

  // await getWMATIC(deployerAsSigner, chainId)
  return await getUSDC(deployerAsSigner, chainId)
}

/**
 * 
 * @param {object} param0 
 * @returns 
 */
async function writeContractsAddresses({ valueInterpreterAddress, valueInterpreterName, fundFactoryName, fundFactoryAddress, fundLogicName, fundLogicAddress, chainId}) {
  console.info();
  console.info("-- BEGIN COPY OF CONTRACTS FILES --");
  try {
    // copy the value interpreter JSON file in the front-end folder
    fs.copyFileSync(
      path.join(__dirname, "../artifacts/contracts/Infrastructure/" + valueInterpreterName + ".sol/" + valueInterpreterName + ".json"), //source
      path.join(__dirname, "../public/contracts/" + valueInterpreterName + ".json") // destination
    );

    // copy the fund factory JSON file in the front-end folder
    fs.copyFileSync(
      path.join(__dirname, "../artifacts/contracts/factory/" + fundFactoryName + ".sol/" + fundFactoryName + ".json"), //source
      path.join(__dirname, "../public/contracts/" + fundFactoryName + ".json") // destination
    );

    // copy the fund logic JSON file to front-end folder
    fs.copyFileSync(
      path.join(__dirname, "../artifacts/contracts/fund/" + fundLogicName + ".sol/" + fundLogicName + ".json"), //source
      path.join(__dirname, "../public/contracts/" + fundLogicName + ".json") // destination
    );

    // check if addresses.json already exists
    let exists = fs.existsSync(path.join(__dirname, ADDRESSES_FILE));

    // if not, created the file
    if (!exists) {
      fs.writeFileSync(
        path.join(__dirname, ADDRESSES_FILE), 
        "{}"
      ); 
    }

    // update the addresses.json file with the new contract address
    let addressesFile = fs.readFileSync(path.join(__dirname, ADDRESSES_FILE));
    let addressesJson = JSON.parse(addressesFile);

    if (!addressesJson[valueInterpreterName]) {
      addressesJson[valueInterpreterName] = {};
    }

    if (!addressesJson[fundFactoryName]) {
      addressesJson[fundFactoryName] = {};
    }

    if (!addressesJson[fundLogicName]) {
      addressesJson[fundLogicName] = {};
    }

    if (!addressesJson[USDC_NAME]) {
      addressesJson[USDC_NAME] = {};
    }

    addressesJson[fundLogicName][chainId] = fundLogicAddress;
    addressesJson[fundFactoryName][chainId] = fundFactoryAddress;
    addressesJson[USDC_NAME][chainId] = GLOBAL_USDC_ADDRESS;
    addressesJson[valueInterpreterName][chainId] = valueInterpreterAddress;

    fs.writeFileSync(
      path.join(__dirname, ADDRESSES_FILE), 
      JSON.stringify(addressesJson)
    );
    console.info("Copy done !");
    console.info("------");

    // create an arguments file for the fund factory contract to help verify it
    
    // check if fundFactoryArguments.js already exists
    let argumentsFileExists = fs.existsSync(path.join(__dirname, FUND_FACTORY_ARGUMENTS_FILE));

    // if not, created the file
    if (!argumentsFileExists) {
      fs.writeFileSync(
        path.join(__dirname, FUND_FACTORY_ARGUMENTS_FILE), 
        "{}"
      ); 
    }

    // update the fundFactoryArguments.js file with the new addresses
    const beginningOfFile = "module.exports = ";
    let argumentsJs = [];

    argumentsJs.push(fundLogicAddress);
    argumentsJs.push(GLOBAL_USDC_ADDRESS);
    argumentsJs.push(GLOBAL_ZERO_EX_EXCHANGE_ADDRESS);

    fs.writeFileSync(
      path.join(__dirname, FUND_FACTORY_ARGUMENTS_FILE), 
      beginningOfFile + JSON.stringify(argumentsJs)
    );

    return true
  } catch (error) {
    console.error("error writeContractsAddresses()", error);
    return false
  }
}

/**
 * 
 * @param {string} valueInterpreterName 
 * @param {File} valueInterpreterFile 
 * @returns {string} address of the value interpreter contract
 */
async function publishValueInterpreterContract(valueInterpreterName, valueInterpreterFile, chainlinkStaleRateThreshold) {
  console.info();
  console.info("-- BEGIN PUBLISH VALUE INTERPRETER --");

  const ValueInterpreterFactory = await ethers.getContractFactory(valueInterpreterFile)
  const valueInterpreterInstance = await ValueInterpreterFactory.deploy(chainlinkStaleRateThreshold, {
    gasLimit: "4892090"
  })

  console.info(valueInterpreterName + " address: " + valueInterpreterInstance.address);

  console.info("------");
  return valueInterpreterInstance.address
}

/**
 * 
 * @param {string} fundLogicName 
 * @returns {string} address of the fund logic contract
 */
async function publishTokenLogicContract(fundLogicName, fundLogicFile) {
  console.info();
  console.info("-- BEGIN PUBLISH TOKEN LOGIC --");
  // deploy the contract
  const ContractFactory = await ethers.getContractFactory(fundLogicFile);
  const contractFactoryInstance = await ContractFactory.deploy({
    gasLimit: "4892090"
  });

  console.info(fundLogicName + " address: " + contractFactoryInstance.address);

  console.info("------");
  return contractFactoryInstance.address
}

/**
 * 
 * @param {string} fundFactoryName 
 * @param {string} fundLogicAddress 
 * @returns 
 */
async function publishFactoryContract(fundFactoryName, fundFactoryFile, fundLogicAddress, valueInterpreterAddress) {
  console.info();
  console.info("-- BEGIN PUBLISH TOKEN FACTORY --");
  // deploy the contract
  const ContractFactory = await ethers.getContractFactory(fundFactoryFile);
  const contractFactoryInstance = await ContractFactory.deploy(fundLogicAddress, GLOBAL_USDC_ADDRESS, GLOBAL_ZERO_EX_EXCHANGE_ADDRESS, valueInterpreterAddress, {
    gasLimit: "4892090"
  });

  console.info(fundFactoryName + " address: " + contractFactoryInstance.address);

  console.info("------");
  return contractFactoryInstance.address
}

function setTokensAddress(chainId) {
  GLOBAL_USDC_ADDRESS = TOKENS_ADDRESS[chainId][USDC_NAME]
  GLOBAL_WMATIC_ADDRESS = TOKENS_ADDRESS[chainId][WMATIC_NAME]
  GLOBAL_ZERO_EX_EXCHANGE_ADDRESS = TOKENS_ADDRESS[chainId][ZERO_EX_EXCHANGE_NAME]
}


//////////////////////
//    MAIN SCRIPT   //
//////////////////////

async function main() {
  drawTitle();
  
  console.info("╔════════════════════════╗");
  console.info("║ DEPLOY SMART CONTRACTS ║");
  console.info("╚════════════════════════╝");

  let fundLogicAddress;
  let fundFactoryAddress;
  let valueInterpreterAddress;
  let isCopyDone = false;
  let isSwapDone = false;

  const [deployerAsSigner] = await ethers.getSigners();

  const networkData = await deployerAsSigner.provider.getNetwork()
  const chainId = networkData.chainId
  if (networkData.name) {
    const chainName = networkData.name
  } else {
    const chainName = "localhost"
  }
  console.info("Chain name:", networkData.name);
  console.info("Chain ID:", chainId);

  console.info(
    "Deploying contracts with the account:",
    deployerAsSigner.address
  );
  
  console.info("Account balance:", (await deployerAsSigner.getBalance()).toString());
  console.info("");

  setTokensAddress(chainId)

  // check if the network is localhost
  if(chainId === 31337) {
    // Make ready the accounts for some test on local chain 
    const hasToDeployMockUSDCContract = false;
    await deployMockUSDCContract(hasToDeployMockUSDCContract);

    // add USDC and WMATIC to first account
    isSwapDone = await getTokens(deployerAsSigner, chainId);
    console.info("");
  }

  const chainlinkStaleRateThreshold = chainId === 31337
  ? ONE_YEAR_IN_SECONDS * 10
  : ONE_DAY_IN_SECONDS + ONE_HOUR_IN_SECONDS;

  console.info("*** List of Tokens to use ***");
  console.info("- USDC", GLOBAL_USDC_ADDRESS);
  // console.info("WMATIC", GLOBAL_WMATIC_ADDRESS);
  console.info("");

  try {
    valueInterpreterAddress = await publishValueInterpreterContract(VALUE_INTERPRETER_CONTRACT_NAME, VALUE_INTERPRETER_CONTRACT_FILE, chainlinkStaleRateThreshold);
  } catch (error) {
    console.error("error publishing value Interpreter contract", error);
  }

  try {
    fundLogicAddress = await publishTokenLogicContract(FUND_LOGIC_CONTRACT_NAME, FUND_LOGIC_CONTRACT_FILE, valueInterpreterAddress);
  } catch (error) {
    console.error("error publishing token logic contract", error);
  }

  if (fundLogicAddress && valueInterpreterAddress) {
    try {
      fundFactoryAddress = await publishFactoryContract(FUND_FACTORY_CONTRACT_NAME, FUND_FACTORY_CONTRACT_FILE, fundLogicAddress, valueInterpreterAddress);
    } catch (error) {
      console.error("error publishing factory contract", error);
    }
  }

  if (fundLogicAddress && fundFactoryAddress) {
    isCopyDone = await writeContractsAddresses({
      valueInterpreterName: VALUE_INTERPRETER_CONTRACT_NAME,
      valueInterpreterAddress,
      fundFactoryName: FUND_FACTORY_CONTRACT_NAME,
      fundFactoryAddress,
      fundLogicName: FUND_LOGIC_CONTRACT_NAME,
      fundLogicAddress,
      chainId
    })
  } else {
    isCopyDone = false
  }

  console.info();
  console.info("╠══ SM DEPLOY RECAP ══╣");
  console.info("│");
  // console.info("┐")
  if (chainId === 31337) {
    if (isSwapDone) {
      console.info("├─ Swap:           [x]");
    } else {
      console.info("├─ Swap:           [ ]");
    }
  }
  console.info("├┬──┤ Publish ├─");
  if (valueInterpreterAddress) {
    console.info("│├─ value interpreter:  [x]");
  } else {
    console.info("│├─ value interpreter:  [ ]");
  }
  if (fundFactoryAddress) {
    console.info("│├─ fund factory:  [x]");
  } else {
    console.info("│├─ fund factory:  [ ]");
  }
  if (fundLogicAddress) {
    console.info("│└─ fund logic:    [x]");
  } else {
    console.info("│└─ fund logic:    [ ]");
  }
  if (isCopyDone) {
    console.info("└─ copy files:     [x]");
  } else {
    console.info("└─ copy files:     [ ]");
  }
  console.info();
  
  if (chainId !== 31337) {
    console.info("═══════════════════════");
    console.info("\nIf you want to verify the contracts, you can run the following command (not for localhost):");
    console.info("- For FundLogic:");
    console.info(`  npx hardhat verify --network ${process.env.HARDHAT_NETWORK} ${fundLogicAddress} --contract ${FUND_LOGIC_CONTRACT_FILE}`);
    console.info("- For ValueInterpreter:");
    console.info(`  npx hardhat verify --network ${process.env.HARDHAT_NETWORK} ${valueInterpreterAddress} --contract ${VALUE_INTERPRETER_CONTRACT_FILE}`);
    console.info("- For FundFactory:");
    console.info(`  npx hardhat verify --network ${process.env.HARDHAT_NETWORK} --constructor-args ${FUND_FACTORY_ARGUMENTS_FILE} ${fundFactoryAddress} --contract ${FUND_FACTORY_CONTRACT_FILE}`);
  }
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
