const { ethers } = require("hardhat");
const { ChainlinkRateAsset } = require("../../test/utils");

// Special assets
// const weth = '0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619';
// const wmatic = '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270';
// const wrappedNativeAsset = wmatic;

// WETH is not included as it is auto-included in the chainlink price feed
const primitives = {
  dai: '0x001b3b4d0f3714ca98ba10f6042daebf0b1b7b6f',
  link: '0x326C977E6efc84E512bB9C30f76E30c160eD06FB',
  sand: '0xe03489d4e90b22c59c5e23d45dfd59fc0db8a025',
  usdc: '0xe6b8a5cf854791412c1f6efc7caf629f5df1c747',
  usdt: '0xA02f6adc7926efeBBd59Fd43A84f4E0c0c91e832',
};

const aggregators = {
  dai: ['0x0FCAa9c899EC5A91eBc3D5Dd869De833b06fB046', ChainlinkRateAsset.USD],
  link: ['0x1C2252aeeD50e0c9B64bDfF2735Ee3C932F5C408', ChainlinkRateAsset.USD],
  sand: ['0x9dd18534b8f456557d11B9DDB14dA89b2e52e308', ChainlinkRateAsset.USD],
  usdc: ['0x572dDec9087154dC5dfBB1546Bb62713147e0Ab0', ChainlinkRateAsset.USD],
  usdt: ['0x92C09849638959196E976289418e5973CC96d645', ChainlinkRateAsset.USD],
};
const ethUsdAggregator = '0x0715A7794a1dc8e42615F059dD6e406A6594651A';

// prettier-ignore
const polygonConfig = {
  chainlink: {
    aggregators,
    ethusd: ethUsdAggregator,
  },
  feeBps: 50,
  feeTokenBurn: {
    burnFromVault: false,
    externalBurnerAddress: ethers.constants.AddressZero,
    sendToProtocolFeeReserve: true,
  },
  positionsLimit: 20,
  primitives,
  // weth,
  // wrappedNativeAsset
}

// const fn = async (hre) => {
//   await saveConfig(hre, polygonConfig);
// };

// fn.tags = ['Config'];

// fn.skip = async (hre) => {
//   // Run this only for polygon.
//   const chain = await hre.getChainId();

//   return !isMatic(chain);
// };

// export default fn;

module.exports = polygonConfig
