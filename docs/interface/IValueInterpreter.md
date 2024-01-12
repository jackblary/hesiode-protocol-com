# Solidity API

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

