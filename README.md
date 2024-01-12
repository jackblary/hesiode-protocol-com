# Hesiode Protocole

This project contains all the smart contract for the Hesiode Protocole.


## Usage

Compile smart contracts:
```
npx hardhat compile
```

Test smart contracts:
```
npx hardhat test
```

Run a stand-alone network
```
npx hardhat node
```

Deploy smart contract on local network
```
npm run deploy-local
```

Deploy smart contract on mumbai testnet
```
npm run deploy-mumbai
```

Init Value Interpret on Polygon
```
npm run init-vi-mumbai --address=<contract address>
```
Init Value Interpret on Mumbai Testnet
```
npm run init-vi-mumbai --address=<contract address>
```

Init Value Interpret on local network
```
npm run init-vi --address=<contract address>
```

To verify a smart contract (see https://hardhat.org/hardhat-runner/plugins/nomiclabs-hardhat-etherscan for more informations)
```
npx hardhat verify --network <network name> <contract address> <Constructor argument>
```


## Miscellaneous

This repository use https://github.com/OpenZeppelin/solidity-docgen to generate documentation.


To test if the fork has worked during the launch of the node, type this command:
```
curl --location --request POST 'localhost:8545/' --header 'Content-Type: application/json' --data-raw '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'
```

you will get a response like that
```
{"jsonrpc":"2.0","id":1,"result":"0x22eaebc"}
```
"result" is the current block number in hex, you have to convert it in decimal and check it on a network scan (ex https://polygonscan.com)