# Solidity API

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

