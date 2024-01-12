//// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

import "hardhat/console.sol";

library ZeroExHelper {

    struct _0xSwapDescription {
        address inputToken;
        address outputToken;
        uint256 inputTokenAmount;
    }
    
    function fillQuote(
        // The `sellTokenAddress` field from the API response.
        address _sellToken,
        // The `buyTokenAddress` field from the API response.
        address _buyToken,
        // The `allowanceTarget` field from the API response.
        address _spender,
        // The `to` field from the API response.
        address payable _swapTarget,
        // uint256 _qteToSwap,
        // The `data` field from the API response.
        bytes calldata _swapCallData
    ) internal returns (bool) {
        require(checkCallData(_sellToken, _buyToken, _spender, _swapTarget, _swapCallData), "ZEH: Invalid call data");
        // (bool success, ) = _swapTarget.call(_swapCallData);
        (bool success,) = _swapTarget.call{value: msg.value}(_swapCallData);
        return success;
    }

    function checkCallData (
        address _sellToken,
        address _buyToken,
        address _spender,
        address _swapTarget,
        // uint256 _qteToSwap,
        bytes calldata _callData
    ) internal view returns (bool) {
        ( _0xSwapDescription memory swapDescriptionObj) = abi.decode(_callData[4:], (_0xSwapDescription));

        return (
            swapDescriptionObj.inputToken == _sellToken &&
            swapDescriptionObj.outputToken == _buyToken &&
            _spender == _swapTarget
        );
    }
}