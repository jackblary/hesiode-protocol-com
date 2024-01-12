const qs = require('qs');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const contractsNames = {
    FACTORY: "contracts/factory/FundFactory.sol:FundFactory",
    LOGIC: "contracts/fund/FundLogic.sol:FundLogic",
    USDC: "MockUSDC",
    VALUE_INTERPRETER: "ValueInterpreter",
    AGGREGATOR: "AggregatorV3Interface"
}

// Enum
const ChainlinkRateAsset = {
    ETH: '0',
    USD: '1',
  }

/**
 * 
 * @param {object} params 
 * @param {object} signer 
 * @param {integer} chainId 
 * @returns 
 */
const swapToken = async (params, signer, chainId) => {
    if(!params || !signer || !chainId) {
        console.error("swapToken: missing params, signer or chainId");
        return
    }
  
    let response;
    try {
        const url = `https://polygon.api.0x.org/swap/v1/quote?${qs.stringify(params)}`
    
        response = await fetch(url);
        console.info("swapToken: url quote", url);
    } catch (error) {
        console.error("swapToken: error fetch quote", error);
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
            console.error("swapToken: response error", jsonResponse);
            minimalResponse = false
        }
    } catch (error) {
        console.error("swapToken: error json", error);
    }
  
    // SEND TRANSACTION
    if (minimalResponse) {
    // SEND TRANSACTION
    try {
        await signer.sendTransaction(minimalResponse)
        return true
    } catch (error) {
        console.error("getWMATIC: error sending transaction", error);
    }
    } else {
        return false
    }
}

module.exports = {
    contractsNames,
    ChainlinkRateAsset,
    swapToken
}