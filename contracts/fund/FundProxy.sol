//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/proxy/Proxy.sol";

contract FundProxy is Proxy {
    address public FundLogic;

    constructor(address _fundLogic, bytes memory _data) {
        FundLogic = _fundLogic;

        (bool success, bytes memory returnData) = _fundLogic.delegatecall(_data); // solium-disable-line
        require(success, string(returnData));
    }

    function _implementation() internal override view returns (address) {
        return FundLogic;
    }
}