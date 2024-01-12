// SPDX-License-Identifier: LGP-3.0
pragma solidity ^0.8.12;

/**
 * @title IAggregatorV3Interface
 */
interface IAggregatorV3Interface {
    function latestRoundData()
        external
        view
        returns (
            uint80 roundId,
            int256 answer,
            uint256 startedAt,
            uint256 updatedAt,
            uint80 answeredInRound
        );
}