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

