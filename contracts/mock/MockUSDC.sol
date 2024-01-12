//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

import "hardhat/console.sol";

contract MockUSDC is ERC20 {
    constructor () ERC20("USDC", "USDC") {
        uint256 elementToMint = 1000 * (10 ** uint256(decimals()));
        _mint(msg.sender, elementToMint);
    }

    function mint(uint256 _amount) public {
        _mint(msg.sender, _amount);
    }

    /**
     * @notice overrive function
     */
    function decimals() public view override returns (uint8) {
        return 6;
    }
}