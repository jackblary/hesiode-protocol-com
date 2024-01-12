//SPDX-License-Identifier: MIT
pragma solidity ^0.8.12;

import "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

import "../interface/IChainlinkAggregator.sol";

import "hardhat/console.sol";

contract ValueInterpreter {
    using SafeMath for uint256;
    using SafeERC20 for IERC20Metadata;

    uint256 private constant ETH_UNIT = 10**18;

    uint256 STALE_RATE_THRESHOLD;
    address WETH_TOKEN;

    address internal immutable OWNER;

    address private ethUsdAggregator;
    mapping(address => AggregatorInfo) private primitiveToAggregatorInfo;
    mapping(address => uint256) private primitiveToUnit;

    enum RateAsset {
        ETH,
        USD
    }

    struct AggregatorInfo {
        address aggregator;
        RateAsset rateAsset;
    }

    modifier onlyOwner() {
        require(
            msg.sender == getOwner(),
            "onlyOwner: Only the Owner can call this function"
        );
        _;
    }

    constructor(uint256 _staleRateThreshold) {
        OWNER = msg.sender;
        STALE_RATE_THRESHOLD = _staleRateThreshold;
    }

    /**
     * @notice Gets the owner of this contract
     * @return owner_ The owner
     * @dev Ownership is deferred to the owner of the FundDeployer contract
     */
    function getOwner() public view returns (address owner_) {
        return OWNER;
    }

    event PrimitiveAdded(
        address indexed primitive,
        address aggregator,
        RateAsset rateAsset,
        uint256 unit
    );

    //////////////////////
    //      EXTERNAL    //
    //////////////////////

    /**
     * @notice Calculates the total value of given amounts of assets in a single quote asset
     * @param _baseAssets The assets to convert
     * @param _amounts The amounts of the _baseAssets to convert
     * @param _quoteAsset The asset to which to convert
     * @return value_ The sum value of _baseAssets, denominated in the _quoteAsset
     * @dev Does not alter protocol state,
     * but not a view because calls to price feeds can potentially update third party state.
     * Does not handle a derivative quote asset.
     */
    function calcCanonicalAssetsTotalValue(
        address[] memory _baseAssets,
        uint256[] memory _amounts,
        address _quoteAsset
    ) external returns (uint256 value_) {
        require(
            _baseAssets.length == _amounts.length,
            "calcCanonicalAssetsTotalValue: Arrays unequal lengths"
        );
        require(
            isSupportedPrimitiveAsset(_quoteAsset),
            "calcCanonicalAssetsTotalValue: Unsupported _quoteAsset"
        );

        for (uint256 i; i < _baseAssets.length; i++) {
            uint256 assetValue = __calcAssetValue(_baseAssets[i], _amounts[i], _quoteAsset);
            value_ = value_.add(assetValue);
        }

        return value_;
    }

    /**
     * @notice Adds a list of primitives with the given aggregator and rateAsset values
     * @param _primitives The primitives to add
     * @param _aggregators The ordered aggregators corresponding to the list of _primitives
     * @param _rateAssets The ordered rate assets corresponding to the list of _primitives
     */
    function addPrimitives(
        address[] calldata _primitives,
        address[] calldata _aggregators,
        RateAsset[] calldata _rateAssets
    ) external onlyOwner {
        __addPrimitives(_primitives, _aggregators, _rateAssets);
    }

    //////////////////////
    //      INTERNAL    //
    //////////////////////

    /**
     * @notice Adds a list of primitives with the given aggregator and rateAsset values
     * @param _primitives The primitives to add
     * @param _aggregators The ordered aggregators corresponding to the list of _primitives
     */
    function __addPrimitives(
        address[] calldata _primitives,
        address[] calldata _aggregators,
        RateAsset[] calldata _rateAssets
    ) internal {
        require(
            _primitives.length == _aggregators.length,
            "__addPrimitives: Unequal _primitives and _aggregators array lengths"
        );
        require(
            _primitives.length == _rateAssets.length,
            "__addPrimitives: Unequal _primitives and _rateAssets array lengths"
        );

        for (uint256 i; i < _primitives.length; i++) {
            require(
                getAggregatorForPrimitive(_primitives[i]) == address(0),
                "__addPrimitives: Value already set"
            );

            __validateAggregator(_aggregators[i]);

            primitiveToAggregatorInfo[_primitives[i]] = AggregatorInfo({
                aggregator: _aggregators[i],
                rateAsset: _rateAssets[i]
            });

            // Store the amount that makes up 1 unit given the asset's decimals
            uint256 unit = 10**uint256(IERC20Metadata(_primitives[i]).decimals());
            primitiveToUnit[_primitives[i]] = unit;

            emit PrimitiveAdded(_primitives[i], _aggregators[i], _rateAssets[i], unit);
        }
    }

    /**
     * @notice Calculates the value of a base asset in terms of a quote asset (using a canonical rate)
     * @param _baseAsset The base asset
     * @param _baseAssetAmount The base asset amount to convert
     * @param _quoteAsset The quote asset
     * @return quoteAssetAmount_ The equivalent quote asset amount
     */
    function __calcCanonicalValue(
        address _baseAsset,
        uint256 _baseAssetAmount,
        address _quoteAsset
    ) internal view returns (uint256 quoteAssetAmount_) {
        // Case where _baseAsset == _quoteAsset is handled by ValueInterpreter

        int256 baseAssetRate = __getLatestRateData(_baseAsset);
        require(baseAssetRate > 0, "__calcCanonicalValue: Invalid base asset rate");

        int256 quoteAssetRate = __getLatestRateData(_quoteAsset);
        require(quoteAssetRate > 0, "__calcCanonicalValue: Invalid quote asset rate");

        return
            __calcConversionAmount(
                _baseAsset,
                _baseAssetAmount,
                uint256(baseAssetRate),
                _quoteAsset,
                uint256(quoteAssetRate)
            );
    }

    //////////////////////
    //      PRIVATE     //
    //////////////////////

    /**
     * @dev Helper to convert an amount from a _baseAsset to a _quoteAsset
     */
    function __calcConversionAmount(
        address _baseAsset,
        uint256 _baseAssetAmount,
        uint256 _baseAssetRate,
        address _quoteAsset,
        uint256 _quoteAssetRate
    ) private view returns (uint256 quoteAssetAmount_) {
        RateAsset baseAssetRateAsset = primitiveToAggregatorInfo[_baseAsset].rateAsset;
        RateAsset quoteAssetRateAsset = primitiveToAggregatorInfo[_quoteAsset].rateAsset;
        uint256 baseAssetUnit = getUnitForPrimitive(_baseAsset);
        uint256 quoteAssetUnit = getUnitForPrimitive(_quoteAsset);

        // If rates are both in ETH or both in USD
        if (baseAssetRateAsset == quoteAssetRateAsset) {
            return
                __calcConversionAmountSameRateAsset(
                    _baseAssetAmount,
                    baseAssetUnit,
                    _baseAssetRate,
                    quoteAssetUnit,
                    _quoteAssetRate
                );
        }

        (, int256 ethPerUsdRate, , uint256 ethPerUsdRateLastUpdatedAt, ) = IChainlinkAggregator(
            getEthUsdAggregator()
        ).latestRoundData();
        require(ethPerUsdRate > 0, "__calcConversionAmount: Bad ethUsd rate");
        __validateRateIsNotStale(ethPerUsdRateLastUpdatedAt);

        // If _baseAsset's rate is in ETH and _quoteAsset's rate is in USD
        if (baseAssetRateAsset == RateAsset.ETH) {
            return
                __calcConversionAmountEthRateAssetToUsdRateAsset(
                    _baseAssetAmount,
                    baseAssetUnit,
                    _baseAssetRate,
                    quoteAssetUnit,
                    _quoteAssetRate,
                    uint256(ethPerUsdRate)
                );
        }

        // If _baseAsset's rate is in USD and _quoteAsset's rate is in ETH
        return
            __calcConversionAmountUsdRateAssetToEthRateAsset(
                _baseAssetAmount,
                baseAssetUnit,
                _baseAssetRate,
                quoteAssetUnit,
                _quoteAssetRate,
                uint256(ethPerUsdRate)
            );
    }

    /**
     * @dev Helper to get the latest rate for a given primitive
     */
    function __getLatestRateData(address _primitive) private view returns (int256 rate_) {
        address aggregator = getAggregatorForPrimitive(_primitive);
        require(aggregator != address(0), "__getLatestRateData: Primitive does not exist");

        uint256 rateUpdatedAt;
        (, rate_, , rateUpdatedAt, ) = IChainlinkAggregator(aggregator).latestRoundData();
        __validateRateIsNotStale(rateUpdatedAt);

        return rate_;
    }

    /**
     * @dev Helper to validate an aggregator by checking its return values for the expected interface
     */
    function __validateAggregator(address _aggregator) private view {
        (, int256 answer, , uint256 updatedAt, ) = IChainlinkAggregator(_aggregator).latestRoundData();
        require(answer > 0, "__validateAggregator: No rate detected");
        __validateRateIsNotStale(updatedAt);
    }

    /**
     * @dev Helper to validate that a rate is not from a round considered to be stale
     */
    function __validateRateIsNotStale(uint256 _latestUpdatedAt) private view {
        require(
            _latestUpdatedAt >= block.timestamp.sub(getStaleRateThreshold()),
            "__validateRateIsNotStale: Stale rate detected"
        );
    }

    /**
     * @dev Helper to convert amounts where base and quote assets both have ETH rates or both have USD rates
     */
    function __calcConversionAmountSameRateAsset(
        uint256 _baseAssetAmount,
        uint256 _baseAssetUnit,
        uint256 _baseAssetRate,
        uint256 _quoteAssetUnit,
        uint256 _quoteAssetRate
    ) private pure returns (uint256 quoteAssetAmount_) {
        // Only allows two consecutive multiplication operations to avoid potential overflow
        return
            _baseAssetAmount.mul(_baseAssetRate).mul(_quoteAssetUnit).div(
                _baseAssetUnit.mul(_quoteAssetRate)
            );
    }

    /**
     * @dev Helper to convert amounts where the base asset has an ETH rate and the quote asset has a USD rate
     */
    function __calcConversionAmountEthRateAssetToUsdRateAsset(
        uint256 _baseAssetAmount,
        uint256 _baseAssetUnit,
        uint256 _baseAssetRate,
        uint256 _quoteAssetUnit,
        uint256 _quoteAssetRate,
        uint256 _ethPerUsdRate
    ) private pure returns (uint256 quoteAssetAmount_) {
        // Only allows two consecutive multiplication operations to avoid potential overflow.
        // Intermediate step needed to resolve stack-too-deep error.
        uint256 intermediateStep = _baseAssetAmount.mul(_baseAssetRate).mul(_ethPerUsdRate).div(
            ETH_UNIT
        );

        return intermediateStep.mul(_quoteAssetUnit).div(_baseAssetUnit).div(_quoteAssetRate);
    }

    /**
     * @dev Helper to convert amounts where the base asset has a USD rate and the quote asset has an ETH rate
     */
    function __calcConversionAmountUsdRateAssetToEthRateAsset(
        uint256 _baseAssetAmount,
        uint256 _baseAssetUnit,
        uint256 _baseAssetRate,
        uint256 _quoteAssetUnit,
        uint256 _quoteAssetRate,
        uint256 _ethPerUsdRate
    ) private pure returns (uint256 quoteAssetAmount_) {
        // Only allows two consecutive multiplication operations to avoid potential overflow
        // Intermediate step needed to resolve stack-too-deep error.
        uint256 intermediateStep = _baseAssetAmount.mul(_baseAssetRate).mul(_quoteAssetUnit).div(
            _ethPerUsdRate
        );

        return intermediateStep.mul(ETH_UNIT).div(_baseAssetUnit).div(_quoteAssetRate);
    }

    /**
     * @dev Helper to differentially calculate an asset value
     * based on if it is a primitive or derivative asset.
     */
    function __calcAssetValue(
        address _baseAsset,
        uint256 _amount,
        address _quoteAsset
    ) private returns (uint256 value_) {
        if (_baseAsset == _quoteAsset || _amount == 0) {
            return _amount;
        }

        // Handle case that asset is a primitive
        if (isSupportedPrimitiveAsset(_baseAsset)) {
            return __calcCanonicalValue(_baseAsset, _amount, _quoteAsset);
        }

        revert("__calcAssetValue: Unsupported _baseAsset");
    }

    //////////////////////
    //      GETTERS     //
    //////////////////////

    /**
     * @notice Gets the unit variable value for a primitive
     * @return unit_ The unit variable value
     */
    function getUnitForPrimitive(address _primitive) public view returns (uint256 unit_) {
        if (_primitive == getWethToken()) {
            return ETH_UNIT;
        }

        return primitiveToUnit[_primitive];
    }

    /**
     * @notice Gets the `STALE_RATE_THRESHOLD` variable value
     * @return staleRateThreshold_ The `STALE_RATE_THRESHOLD` value
     */
    function getStaleRateThreshold() public view returns (uint256 staleRateThreshold_) {
        return STALE_RATE_THRESHOLD;
    }

    /**
     * @notice Checks whether an asset is a supported primitive
     * @param _asset The asset to check
     * @return isSupported_ True if the asset is a supported primitive
     */
    function isSupportedPrimitiveAsset(address _asset) public view returns (bool isSupported_)
    {
        return getAggregatorForPrimitive(_asset) != address(0);
    }

    /**
     * @notice Gets the aggregator for a primitive
     * @param _primitive The primitive asset for which to get the aggregator value
     * @return aggregator_ The aggregator address
     */
    function getAggregatorForPrimitive(address _primitive)
        public
        view
        returns (address aggregator_)
    {
        return primitiveToAggregatorInfo[_primitive].aggregator;
    }

    /**
     * @notice Gets the `ethUsdAggregator` variable value
     * @return ethUsdAggregator_ The `ethUsdAggregator` variable value
     */
    function getEthUsdAggregator() public view returns (address ethUsdAggregator_) {
        return ethUsdAggregator;
    }

    /**
     * @notice Gets the `WETH_TOKEN` variable value
     * @return wethToken_ The `WETH_TOKEN` variable value
     */
    function getWethToken() public view returns (address wethToken_) {
        return WETH_TOKEN;
    }
}