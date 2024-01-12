const { ethers } = require('hardhat');

const VALUE_INTERPRETER_CONTRACT_FILE = "contracts/Infrastructure/ValueInterpreter.sol:ValueInterpreter"
const CONFIG = {
  // Polygon
  137: require("./config/Polygon"),
  // Mumbai
  80001: require("./config/Mumbai"),
  // Fork
  31337: require("./config/Mumbai"),
}

const initValueInterpreter = async (valueInterpreterAddress, config, signer) => {
  console.info();
  console.info("-- BEGIN INIT VALUE INTERPRETER --");

  try {
    const valueInterpreterInstance = await ethers.getContractAt(VALUE_INTERPRETER_CONTRACT_FILE, valueInterpreterAddress, signer)

    const primitivesInfo = Object.keys(config.primitives).map((key) => {
      if (!config.chainlink.aggregators[key]) {
        throw new Error(`Missing aggregator for ${key}`);
      }

      const aggregator = config.chainlink.aggregators[key];
      const primitive = config.primitives[key];

      return [primitive, ...aggregator];
    });

    const primitives = primitivesInfo.map(([primitive]) => primitive);
    const aggregators = primitivesInfo.map(([, aggregator]) => aggregator);
    const rateAssets = primitivesInfo.map(([, , rateAsset]) => rateAsset);

    const Tx = await valueInterpreterInstance.addPrimitives(primitives, aggregators, rateAssets, {
        gasLimit: "4892090"
    })
    const response = await Tx.wait()
  
    console.info(`${primitives.length} primitives added`);
    console.info("------");

    return !!primitives.length
  } catch (error) {
    console.log("initValueInterpreter error", error);
  }
}
exports.initValueInterpreter = initValueInterpreter

//////////////////////
//    MAIN SCRIPT   //
//////////////////////

// npm run init-vi-mumbai --address=0x117F8e117B098DdA63D4494Be73CfB571C06ad0c
// npx hardhat run scripts/deployAllContracts.js --address 0x117F8e117B098DdA63D4494Be73CfB571C06ad0c 
async function main() {
  console.info("-- INIT VALUE INTERPRETER SCRIPT --")
  const valueInterpreterAddress = process.env.npm_config_address
  console.info("ValueInterpreter Address:", process.env.npm_config_address);

  if (!valueInterpreterAddress) {
    throw new Error("Value Interpreter address not send as a parameter")
  }

  const [deployerAsSigner] = await ethers.getSigners();

  const networkData = await deployerAsSigner.provider.getNetwork()
  const chainId = networkData.chainId

  console.info("chainId:", chainId);
  // init values in valueInterpreter
  try {
    const config = CONFIG[chainId]
    isValueInterpreterInitialized = await initValueInterpreter(valueInterpreterAddress, config, deployerAsSigner)
  } catch (error) {
    console.error("initValueInterpreter error:", error);
  }
}



main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
