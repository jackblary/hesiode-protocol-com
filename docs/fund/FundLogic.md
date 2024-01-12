# Solidity API

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

