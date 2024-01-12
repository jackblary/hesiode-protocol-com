# Solidity API

## ValueInterpreter

### ETH_UNIT

```solidity
uint256 ETH_UNIT
```

### STALE_RATE_THRESHOLD

```solidity
uint256 STALE_RATE_THRESHOLD
```

### WETH_TOKEN

```solidity
address WETH_TOKEN
```

### OWNER

```solidity
address OWNER
```

### ethUsdAggregator

```solidity
address ethUsdAggregator
```

### primitiveToAggregatorInfo

```solidity
mapping(address => struct ValueInterpreter.AggregatorInfo) primitiveToAggregatorInfo
```

### primitiveToUnit

```solidity
mapping(address => uint256) primitiveToUnit
```

### RateAsset

```solidity
enum RateAsset {
  ETH,
  USD
}
```

### AggregatorInfo

```solidity
struct AggregatorInfo {
  address aggregator;
  enum ValueInterpreter.RateAsset rateAsset;
}
```

### onlyOwner

```solidity
modifier onlyOwner()
```

### constructor

```solidity
constructor(uint256 _staleRateThreshold) public
```

### getOwner

```solidity
function getOwner() public view returns (address owner_)
```

Gets the owner of this contract

_Ownership is deferred to the owner of the FundDeployer contract_

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| owner_ | address | The owner |

### PrimitiveAdded

```solidity
event PrimitiveAdded(address primitive, address aggregator, enum ValueInterpreter.RateAsset rateAsset, uint256 unit)
```

### calcCanonicalAssetsTotalValue

```solidity
function calcCanonicalAssetsTotalValue(address[] _baseAssets, uint256[] _amounts, address _quoteAsset) external returns (uint256 value_)
```

Calculates the total value of given amounts of assets in a single quote asset

_Does not alter protocol state,
but not a view because calls to price feeds can potentially update third party state.
Does not handle a derivative quote asset._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _baseAssets | address[] | The assets to convert |
| _amounts | uint256[] | The amounts of the _baseAssets to convert |
| _quoteAsset | address | The asset to which to convert |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| value_ | uint256 | The sum value of _baseAssets, denominated in the _quoteAsset |

### addPrimitives

```solidity
function addPrimitives(address[] _primitives, address[] _aggregators, enum ValueInterpreter.RateAsset[] _rateAssets) external
```

Adds a list of primitives with the given aggregator and rateAsset values

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _primitives | address[] | The primitives to add |
| _aggregators | address[] | The ordered aggregators corresponding to the list of _primitives |
| _rateAssets | enum ValueInterpreter.RateAsset[] | The ordered rate assets corresponding to the list of _primitives |

### __addPrimitives

```solidity
function __addPrimitives(address[] _primitives, address[] _aggregators, enum ValueInterpreter.RateAsset[] _rateAssets) internal
```

Adds a list of primitives with the given aggregator and rateAsset values

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _primitives | address[] | The primitives to add |
| _aggregators | address[] | The ordered aggregators corresponding to the list of _primitives |
| _rateAssets | enum ValueInterpreter.RateAsset[] |  |

### __calcCanonicalValue

```solidity
function __calcCanonicalValue(address _baseAsset, uint256 _baseAssetAmount, address _quoteAsset) internal view returns (uint256 quoteAssetAmount_)
```

Calculates the value of a base asset in terms of a quote asset (using a canonical rate)

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _baseAsset | address | The base asset |
| _baseAssetAmount | uint256 | The base asset amount to convert |
| _quoteAsset | address | The quote asset |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| quoteAssetAmount_ | uint256 | The equivalent quote asset amount |

### __calcConversionAmount

```solidity
function __calcConversionAmount(address _baseAsset, uint256 _baseAssetAmount, uint256 _baseAssetRate, address _quoteAsset, uint256 _quoteAssetRate) private view returns (uint256 quoteAssetAmount_)
```

_Helper to convert an amount from a _baseAsset to a _quoteAsset_

### __getLatestRateData

```solidity
function __getLatestRateData(address _primitive) private view returns (int256 rate_)
```

_Helper to get the latest rate for a given primitive_

### __validateAggregator

```solidity
function __validateAggregator(address _aggregator) private view
```

_Helper to validate an aggregator by checking its return values for the expected interface_

### __validateRateIsNotStale

```solidity
function __validateRateIsNotStale(uint256 _latestUpdatedAt) private view
```

_Helper to validate that a rate is not from a round considered to be stale_

### __calcConversionAmountSameRateAsset

```solidity
function __calcConversionAmountSameRateAsset(uint256 _baseAssetAmount, uint256 _baseAssetUnit, uint256 _baseAssetRate, uint256 _quoteAssetUnit, uint256 _quoteAssetRate) private pure returns (uint256 quoteAssetAmount_)
```

_Helper to convert amounts where base and quote assets both have ETH rates or both have USD rates_

### __calcConversionAmountEthRateAssetToUsdRateAsset

```solidity
function __calcConversionAmountEthRateAssetToUsdRateAsset(uint256 _baseAssetAmount, uint256 _baseAssetUnit, uint256 _baseAssetRate, uint256 _quoteAssetUnit, uint256 _quoteAssetRate, uint256 _ethPerUsdRate) private pure returns (uint256 quoteAssetAmount_)
```

_Helper to convert amounts where the base asset has an ETH rate and the quote asset has a USD rate_

### __calcConversionAmountUsdRateAssetToEthRateAsset

```solidity
function __calcConversionAmountUsdRateAssetToEthRateAsset(uint256 _baseAssetAmount, uint256 _baseAssetUnit, uint256 _baseAssetRate, uint256 _quoteAssetUnit, uint256 _quoteAssetRate, uint256 _ethPerUsdRate) private pure returns (uint256 quoteAssetAmount_)
```

_Helper to convert amounts where the base asset has a USD rate and the quote asset has an ETH rate_

### __calcAssetValue

```solidity
function __calcAssetValue(address _baseAsset, uint256 _amount, address _quoteAsset) private returns (uint256 value_)
```

_Helper to differentially calculate an asset value
based on if it is a primitive or derivative asset._

### getUnitForPrimitive

```solidity
function getUnitForPrimitive(address _primitive) public view returns (uint256 unit_)
```

Gets the unit variable value for a primitive

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| unit_ | uint256 | The unit variable value |

### getStaleRateThreshold

```solidity
function getStaleRateThreshold() public view returns (uint256 staleRateThreshold_)
```

Gets the `STALE_RATE_THRESHOLD` variable value

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| staleRateThreshold_ | uint256 | The `STALE_RATE_THRESHOLD` value |

### isSupportedPrimitiveAsset

```solidity
function isSupportedPrimitiveAsset(address _asset) public view returns (bool isSupported_)
```

Checks whether an asset is a supported primitive

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _asset | address | The asset to check |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| isSupported_ | bool | True if the asset is a supported primitive |

### getAggregatorForPrimitive

```solidity
function getAggregatorForPrimitive(address _primitive) public view returns (address aggregator_)
```

Gets the aggregator for a primitive

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _primitive | address | The primitive asset for which to get the aggregator value |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| aggregator_ | address | The aggregator address |

### getEthUsdAggregator

```solidity
function getEthUsdAggregator() public view returns (address ethUsdAggregator_)
```

Gets the `ethUsdAggregator` variable value

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| ethUsdAggregator_ | address | The `ethUsdAggregator` variable value |

### getWethToken

```solidity
function getWethToken() public view returns (address wethToken_)
```

Gets the `WETH_TOKEN` variable value

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| wethToken_ | address | The `WETH_TOKEN` variable value |

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

## FundLogic

### FUND_FACTORY

```solidity
address FUND_FACTORY
```

### VALUE_INTERPRETER

```solidity
address VALUE_INTERPRETER
```

### OWNER

```solidity
address OWNER
```

### DENOMINATION_TOKEN

```solidity
address DENOMINATION_TOKEN
```

### ZERO_EX_EXCHANGE

```solidity
address ZERO_EX_EXCHANGE
```

### MAX_BPS

```solidity
uint256 MAX_BPS
```

### SECONDS_IN_YEAR

```solidity
uint256 SECONDS_IN_YEAR
```

### feeBpsForProtocol

```solidity
uint256 feeBpsForProtocol
```

### feeDepositForProtocol

```solidity
uint256 feeDepositForProtocol
```

### feeBpsForFund

```solidity
uint256 feeBpsForFund
```

### feeDepositForFund

```solidity
uint256 feeDepositForFund
```

### fundLastPaid

```solidity
uint256 fundLastPaid
```

### tokensWhitelistId

```solidity
uint256 tokensWhitelistId
```

### useTokensWhitelist

```solidity
bool useTokensWhitelist
```

### ADMIN_MANAGER

```solidity
bytes32 ADMIN_MANAGER
```

### MANAGER

```solidity
bytes32 MANAGER
```

### reentranceLocked

```solidity
bool reentranceLocked
```

### useAllowedInvestor

```solidity
bool useAllowedInvestor
```

### trackedAssets

```solidity
address[] trackedAssets
```

### investorWhitelist

```solidity
address[] investorWhitelist
```

### assetTrackedPosition

```solidity
mapping(address => uint256) assetTrackedPosition
```

### assetToIsTracked

```solidity
mapping(address => bool) assetToIsTracked
```

### addressAllowedPosition

```solidity
mapping(address => uint256) addressAllowedPosition
```

### addressAllowed

```solidity
mapping(address => bool) addressAllowed
```

### FeesPaidForMinting

```solidity
event FeesPaidForMinting(uint256 mintingFeeForProtocol, uint256 mintingFeeForOwner)
```

### FundFeePaidInShares

```solidity
event FundFeePaidInShares(uint256 sharesAmount)
```

### SharesMinted

```solidity
event SharesMinted(uint256 sharesAmount, uint256 investmentAmount, address owner)
```

### InvestmentRedeemedInTokens

```solidity
event InvestmentRedeemedInTokens(address owner, uint256 sharesAmount, address[] receivedAssets, uint256[] receivedAssetAmounts)
```

### InvestmentRedeemedInDenominationToken

```solidity
event InvestmentRedeemedInDenominationToken(address owner, uint256 sharesAmount, uint256 tokenAmount)
```

### GavCalulated

```solidity
event GavCalulated(address fund, uint256 amount)
```

### onlyOwner

```solidity
modifier onlyOwner()
```

_Throws error if called by any account other than the owner._

### notShares

```solidity
modifier notShares(address _asset)
```

### onlyAllowedInvestor

```solidity
modifier onlyAllowedInvestor()
```

### locksReentrance

```solidity
modifier locksReentrance()
```

### __assertNotReentranceLocked

```solidity
function __assertNotReentranceLocked() private view
```

### __assertIsOwner

```solidity
function __assertIsOwner() private view
```

### __assertIsNotShares

```solidity
function __assertIsNotShares(address _asset) private view
```

### __assertOnlyAllowedInvestor

```solidity
function __assertOnlyAllowedInvestor() private view
```

### constructor

```solidity
constructor() public
```

### initialize

```solidity
function initialize(address _owner, uint256 _fundPaymentFees, uint256 _fundManagmentFees, address _denominationToken, address _zeroExchange, string _name, string _symbol, uint256 _tokensWhitelistId, bool _useTokensWhitelist, address _valueInterpreter, bool _useAllowedInvestor) public
```

### investInFund

```solidity
function investInFund(uint256 _investmentAmount) external returns (uint256)
```

function to invest in the fund and mint shares of if

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _investmentAmount | uint256 | The number of shares that the user want to buy |

### redeemSharesInTokens

```solidity
function redeemSharesInTokens(uint256 _sharesToWithdraw) external returns (bool, address[] payoutAssets_, uint256[] payoutAmounts_)
```

function to redeem shares of the fund in a proportion of each tokens

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _sharesToWithdraw | uint256 | The number of shares that the user want to redeem |

### redeemSharesInDenominationToken

```solidity
function redeemSharesInDenominationToken(uint256 _sharesToWithdraw) external returns (bool)
```

function to redeem shares only in the denomination token

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _sharesToWithdraw | uint256 | The number of shares that the user want to redeem |

### addNewManager

```solidity
function addNewManager(address _manager) external returns (bool)
```

### revokeManager

```solidity
function revokeManager(address _manager) external returns (bool)
```

### fillQuote

```solidity
function fillQuote(contract IERC20Metadata _sellToken, contract IERC20Metadata _buyToken, address _spender, address payable _swapTarget, bytes _swapCallData) external payable returns (bool)
```

Swaps ERC20->ERC20 tokens held by this contract using a 0x-API quote.

### receive

```solidity
receive() external payable
```

Payable fallback to allow this contract to receive protocol fee refunds.

### addInvestor

```solidity
function addInvestor(address _investor) public
```

add an authorized investor

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _investor | address | the address to authorize |

### addInvestors

```solidity
function addInvestors(address[] _investors) public
```

add a list of authorized investor

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _investors | address[] | the addresses to authorize |

### removeAllowedInvestor

```solidity
function removeAllowedInvestor(address _investor) public
```

function to remove the right to invest

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _investor | address | the address for wich remove the right to invest |

### calcGav

```solidity
function calcGav() public returns (uint256 gav_)
```

funtion to get gross asset value of the fund

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| gav_ | uint256 | the gross asset value of the fund |

### addTrackedAssets

```solidity
function addTrackedAssets(address[] _assets) public
```

add asset to the tracked asset list

### __calculTokensToSwap

```solidity
function __calculTokensToSwap(uint256 _sharesToWithdraw) private view returns (address[], uint256[])
```

_Helper to know how much of each tokens need to be swapped_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _sharesToWithdraw | uint256 | The number of shares that the user want to redeem |

### __payFees

```solidity
function __payFees(uint256 _investmentAmount) private returns (bool, uint256 depositFeesPaied_)
```

pay fees for the protocol and for the fund

_use this function either for invest and for redeem but with 0 for _investmentAmount in case of redeem
     the payment of fees is not the same if theres due to the owner of the fund or the protocole_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _investmentAmount | uint256 | the investment for wich to pay fees |

### __calcAndPayDepositFees

```solidity
function __calcAndPayDepositFees(uint256 _investmentAmount) private returns (uint256)
```

### __payProtocolManagmentFees

```solidity
function __payProtocolManagmentFees(uint256 _lastPaid, uint256 _secondsDue) private
```

calculate and pay the managment fees to the protocol for each tokens in the fund

### __payFundManagmentFees

```solidity
function __payFundManagmentFees(uint256 _lastPaid, uint256 _secondsDue) private returns (uint256 sharesDue_)
```

calculate the number of fund's part due to the owner

### __calcFeeDueForProtocol

```solidity
function __calcFeeDueForProtocol(uint256 _lastPaid, uint256 _secondsDue, uint256 _assetBalance) private view returns (uint256 rawTokensDue_)
```

calculate the number of tokens due of a specific asset to the protocol as fees

### __sharesToMint

```solidity
function __sharesToMint(uint256 _amountToConvert) private view returns (uint256 sharesToMint_)
```

function to know of much shares to mint for a given amount of token
if there is not share curently shared then the first deposit equal one (1) share or 10**(share's decimals)

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _amountToConvert | uint256 | the amount of token |

### __denominationAssetToRedeem

```solidity
function __denominationAssetToRedeem(uint256 _sharesToRedeem) private view returns (uint256 tokenToRedeem_)
```

_Helper to know the sum of denomination asset to redeem_

### __setLastPaidForFund

```solidity
function __setLastPaidForFund(uint256 _nextTimestamp) private
```

_Helper to set the lastPaid timestamp for the current fund_

### __addTrackedAsset

```solidity
function __addTrackedAsset(address _asset) private
```

_Helper to add a tracked asset_

### __removeTrackedAsset

```solidity
function __removeTrackedAsset(address _asset) private
```

_Helper to remove a tracked asset_

### __isAssetNeedToBeTracked

```solidity
function __isAssetNeedToBeTracked(address _asset) private view returns (bool)
```

_Helper to know if an asset need to be tracked_

### __approveAssetMaxAsNeeded

```solidity
function __approveAssetMaxAsNeeded(address _spender, address _asset) internal returns (bool)
```

Helper to approve a target account with the max amount of an asset.
This is helpful for fully trusted contracts, such as adapters that
interact with external protocol like Uniswap, Compound, etc.

### __getAssetBalance

```solidity
function __getAssetBalance(address _asset) internal view returns (uint256 balance_)
```

_helper to the get the balance of an assets_

### __addInvestor

```solidity
function __addInvestor(address _investor) internal
```

_helper to i_

### owner

```solidity
function owner() public view virtual returns (address)
```

_Returns the address of the current owner._

### getFundLastPaid

```solidity
function getFundLastPaid() public view returns (uint256)
```

Get the last time the fund was paid

_Gets the fundLastPaid value_

### getDenominationAssetBalance

```solidity
function getDenominationAssetBalance() public view returns (uint256 balance_)
```

_function to the get the contract's denomination asset balance_

### getFeeBpsProtocol

```solidity
function getFeeBpsProtocol() public pure returns (uint256 feeBps_)
```

Gets the `feeBpsForProtocol` variable value

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| feeBps_ | uint256 | The `feeBpsForProtocol` variable value |

### getFeeBpsFund

```solidity
function getFeeBpsFund() public view returns (uint256 feeBps_)
```

Gets the `feeBpsForFund` variable value

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| feeBps_ | uint256 | The `feeBpsForFund` variable value |

### getFeeDepositForFund

```solidity
function getFeeDepositForFund() public view returns (uint256 feeDeposit_)
```

Gets the `feeDepositForFund` variable value

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| feeDeposit_ | uint256 | The `feeDepositForFund` variable value |

### getFeeDepositForProtocol

```solidity
function getFeeDepositForProtocol() public pure returns (uint256 feeDeposit_)
```

Gets the `feeDepositForProtocol` variable value

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| feeDeposit_ | uint256 | The `feeDepositForProtocol` variable value |

### getTokensWhitelistId

```solidity
function getTokensWhitelistId() public view returns (uint256)
```

Get the whitelist id

### getFundInformations

```solidity
function getFundInformations() public view returns (string, string, uint256, address, uint256, uint256, uint256, uint256, uint256, address[], bool, uint256)
```

return the informations about the fund

### getZeroExExchange

```solidity
function getZeroExExchange() public view returns (address zeroExExchange_)
```

Gets the `ZERO_EX_EXCHANGE` variable value

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| zeroExExchange_ | address | The `ZERO_EX_EXCHANGE` variable value |

### getTrackedAssets

```solidity
function getTrackedAssets() public view returns (address[])
```

### isTrackedAsset

```solidity
function isTrackedAsset(address _asset) public view returns (bool isTrackedAsset_)
```

Checks whether an address is a tracked asset of the vault

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _asset | address | The address to check |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| isTrackedAsset_ | bool | True if the address is a tracked asset |

### getUseAllowedInvestor

```solidity
function getUseAllowedInvestor() public view returns (bool)
```

### getInvestorWhitelist

```solidity
function getInvestorWhitelist() public view returns (address[])
```

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | address[] | investorWhitelist_ the list of investor allowed to invest in the fund |

### isAddressAllowedToInvest

```solidity
function isAddressAllowedToInvest(address _investor) public view returns (bool)
```

Checks wether an address is allowed to invest

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _investor | address | The address to check |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | bool | True if the address is allowed to invest |

### getValueInterpreter

```solidity
function getValueInterpreter() public view returns (address valueInterpreter_)
```

Gets the `VALUE_INTERPRETER` variable

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| valueInterpreter_ | address | The `VALUE_INTERPRETER` variable value |

## FundProxy

### FundLogic

```solidity
address FundLogic
```

### constructor

```solidity
constructor(address _fundLogic, bytes _data) public
```

### _implementation

```solidity
function _implementation() internal view returns (address)
```

_This is a virtual function that should be overridden so it returns the address to which the fallback function
and {_fallback} should delegate._

## TokenLogic

### constructor

```solidity
constructor() public
```

### initialize

```solidity
function initialize(string _name, string _symbol) public
```

### __mint

```solidity
function __mint(address _to, uint256 amount) private
```

### __burn

```solidity
function __burn(address _account, uint256 _amount) private
```

## IChainlinkAggregator

### latestRoundData

```solidity
function latestRoundData() external view returns (uint80, int256, uint256, uint256, uint80)
```

## IFundFactory

### doesTokenExist

```solidity
function doesTokenExist(uint256 _whitlistIndex, address _tokenAddress) external view returns (bool)
```

## IValueInterpreter

### calcCanonicalAssetValue

```solidity
function calcCanonicalAssetValue(address, uint256, address) external returns (uint256)
```

### calcCanonicalAssetsTotalValue

```solidity
function calcCanonicalAssetsTotalValue(address[], uint256[], address) external returns (uint256)
```

### isSupportedAsset

```solidity
function isSupportedAsset(address) external view returns (bool)
```

### isSupportedDerivativeAsset

```solidity
function isSupportedDerivativeAsset(address) external view returns (bool)
```

### isSupportedPrimitiveAsset

```solidity
function isSupportedPrimitiveAsset(address) external view returns (bool)
```

## ZeroExHelper

### _0xSwapDescription

```solidity
struct _0xSwapDescription {
  address inputToken;
  address outputToken;
  uint256 inputTokenAmount;
}
```

### fillQuote

```solidity
function fillQuote(address _sellToken, address _buyToken, address _spender, address payable _swapTarget, bytes _swapCallData) internal returns (bool)
```

### checkCallData

```solidity
function checkCallData(address _sellToken, address _buyToken, address _spender, address _swapTarget, bytes _callData) internal view returns (bool)
```

## MockUSDC

### constructor

```solidity
constructor() public
```

### mint

```solidity
function mint(uint256 _amount) public
```

### decimals

```solidity
function decimals() public view returns (uint8)
```

overrive function

## AggregatorV3Interface

### decimals

```solidity
function decimals() external view returns (uint8)
```

### description

```solidity
function description() external view returns (string)
```

### version

```solidity
function version() external view returns (uint256)
```

### getRoundData

```solidity
function getRoundData(uint80 _roundId) external view returns (uint80 roundId, int256 answer, uint256 startedAt, uint256 updatedAt, uint80 answeredInRound)
```

### latestRoundData

```solidity
function latestRoundData() external view returns (uint80 roundId, int256 answer, uint256 startedAt, uint256 updatedAt, uint80 answeredInRound)
```

## IFundFactory

### doesTokenExist

```solidity
function doesTokenExist(uint256 _whitlistIndex, address _tokenAddress) external view returns (bool)
```

## IAggregatorV3Interface

### latestRoundData

```solidity
function latestRoundData() external view returns (uint80 roundId, int256 answer, uint256 startedAt, uint256 updatedAt, uint80 answeredInRound)
```

