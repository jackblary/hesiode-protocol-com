//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

import "hardhat/console.sol";

contract TokenLogic is Initializable, ERC20Upgradeable {

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {}

    //////////////////////
    //    CONSTRUCTOR   //
    //////////////////////

    function initialize(string memory _name, string memory _symbol)
        public
        onlyInitializing
    {
        __ERC20_init(_name, _symbol);
    }

    //////////////////////
    //      PRIVATE     //
    //////////////////////

    function __mint(address _to, uint256 amount) private {
        _mint(_to, amount);
    }

    function __burn(address _account, uint256 _amount) private {
        _burn(_account, _amount);
    }
}