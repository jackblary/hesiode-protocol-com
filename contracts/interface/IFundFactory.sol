//SPDX-License-Identifier: MIT
pragma solidity ^0.8.12;

interface IFundFactory {
    function doesTokenExist(uint256 _whitlistIndex, address _tokenAddress) external view returns (bool);
}