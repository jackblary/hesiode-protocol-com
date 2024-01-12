# Solidity API

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

