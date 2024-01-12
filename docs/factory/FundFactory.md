# Solidity API

## FundFactory

### FUND_LOGIC

```solidity
address FUND_LOGIC
```

### DENOMINATION_TOKEN

```solidity
address DENOMINATION_TOKEN
```

### PROTOCOL_OWNER

```solidity
address PROTOCOL_OWNER
```

### ZERO_EX_EXCHANGE

```solidity
address ZERO_EX_EXCHANGE
```

### VALUE_INTERPRETER

```solidity
address VALUE_INTERPRETER
```

### fundsList

```solidity
address[] fundsList
```

### Token

```solidity
struct Token {
  string name;
  string symbol;
  address tokenAddress;
  uint256 index;
}
```

### WhiteList

```solidity
struct WhiteList {
  uint256 index;
  string name;
  struct FundFactory.Token[] tokens;
  mapping(address => uint256) tokenPositionForAddress;
  mapping(address => bool) tokenExist;
  address listOwner;
}
```

### whitelistStructs

```solidity
mapping(uint256 => struct FundFactory.WhiteList) whitelistStructs
```

### whitelistIndex

```solidity
uint256[] whitelistIndex
```

### FundProxyDeployed

```solidity
event FundProxyDeployed(address creator, address tokenProxy, string tokenName, string tokenSymbol)
```

### WhiteListCreated

```solidity
event WhiteListCreated(uint256 index, string name)
```

### TokenAddedInWhitelist

```solidity
event TokenAddedInWhitelist(uint256 whitelistIndex, string tokenName, string tokenSymbol, address tokenAddress)
```

### onlyOwner

```solidity
modifier onlyOwner()
```

### onlyWhitelistOwner

```solidity
modifier onlyWhitelistOwner(uint256 _whitelistIndex)
```

### constructor

```solidity
constructor(address _fundLogicAddress, address _denominationToken, address _zeroExchange, address _valueInterpreter) public
```

### withdrawFees

```solidity
function withdrawFees() external
```

### createWhitelist

```solidity
function createWhitelist(string _name) external returns (uint256)
```

### addTokenToWhiteList

```solidity
function addTokenToWhiteList(uint256 _whitelistIndex, string _name, string _symbol, address _address) external
```

### removeToken

```solidity
function removeToken(uint256 _whitelistIndex, address _addressToken) external returns (bool)
```

### createFund

```solidity
function createFund(uint256 _fundPaymentFees, uint256 _fundManagmentFees, string _tokenName, string _tokenSymbol, uint256 _whitelistId, bool _useWhitelist, bool _useAllowedInvestor) external returns (address)
```

### getFactoryInformations

```solidity
function getFactoryInformations() public view returns (address, address, address, address, uint256, uint256)
```

_Returns informations about the factory_

### owner

```solidity
function owner() public view virtual returns (address)
```

_Returns the address of the current owner._

### getFundLogicAddress

```solidity
function getFundLogicAddress() public view returns (address)
```

### getDenominationTokenAddress

```solidity
function getDenominationTokenAddress() public view returns (address)
```

### getFundsList

```solidity
function getFundsList() public view returns (address[])
```

return the addresses of all the funds

### getWhitelistCount

```solidity
function getWhitelistCount() public view returns (uint256)
```

return the number of whitelist

### getFundCount

```solidity
function getFundCount() public view returns (uint256)
```

### doesTokenExist

```solidity
function doesTokenExist(uint256 _whitlistIndex, address _tokenAddress) external view returns (bool)
```

check if a token exist in a given whitelist

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _whitlistIndex | uint256 | the index of the whitelist |
| _tokenAddress | address | the address of the token |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | bool | true if the token exist and false if it's not the case |

### getWhiteLists

```solidity
function getWhiteLists() public view returns (uint256[], string[], address[], uint256[], string[])
```

return all the whitelists

### getWhiteList

```solidity
function getWhiteList(uint256 _index) external view returns (uint256, string, address, string, string[], string[], address[])
```

return a specified whitelist

