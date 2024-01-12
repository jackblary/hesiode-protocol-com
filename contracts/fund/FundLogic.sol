//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlEnumerableUpgradeable.sol";

import "../libraries/ZeroExHelper.sol";
import "../interface/IFundFactory.sol";
import "../interface/IValueInterpreter.sol";
import "./TokenLogic.sol";

import "hardhat/console.sol";

contract FundLogic is TokenLogic, AccessControlEnumerableUpgradeable {
    using SafeMath for uint256;
    using SafeERC20 for IERC20Metadata;

    address public FUND_FACTORY;
    address public VALUE_INTERPRETER;
    address private OWNER;

    address public DENOMINATION_TOKEN;

    address private ZERO_EX_EXCHANGE;

    uint256 private constant MAX_BPS = 10000; // 100%
    uint256 private constant SECONDS_IN_YEAR = 31557600; // 60*60*24*365.25
    uint256 private constant feeBpsForProtocol = 50; // 0,5%
    uint256 private constant feeDepositForProtocol = 0; // 0%
    uint256 private feeBpsForFund;
    uint256 private feeDepositForFund;
    uint256 private fundLastPaid;
    uint256 private tokensWhitelistId;

    bool private useTokensWhitelist;

    bytes32 public constant ADMIN_MANAGER = keccak256("ADMIN_MANAGER");
    bytes32 public constant MANAGER = keccak256("MANAGER");

    // A mutex to protect against reentrancy
    bool internal reentranceLocked;

    bool private useAllowedInvestor;

    address[] internal trackedAssets;
    address[] internal investorWhitelist;
    mapping(address => uint256) internal assetTrackedPosition;
    mapping(address => bool) internal assetToIsTracked;
    mapping(address => uint256) internal addressAllowedPosition;
    mapping(address => bool) internal addressAllowed;

    event FeesPaidForMinting(
        uint256 mintingFeeForProtocol,
        uint256 mintingFeeForOwner
    );
    event FundFeePaidInShares(uint256 sharesAmount);
    event SharesMinted(
        uint256 sharesAmount,
        uint256 investmentAmount,
        address indexed owner
    );
    event InvestmentRedeemedInTokens(
        address indexed owner,
        uint256 sharesAmount,
        address[] receivedAssets,
        uint256[] receivedAssetAmounts
    );
    event InvestmentRedeemedInDenominationToken(
        address indexed owner,
        uint256 sharesAmount,
        uint256 tokenAmount
    );
    event GavCalulated(address fund, uint256 amount);

    /**
     * @dev Throws error if called by any account other than the owner.
     */
    modifier onlyOwner() {
        __assertIsOwner();
        _;
    }

    modifier notShares(address _asset) {
        __assertIsNotShares(_asset);
        _;
    }

    modifier onlyAllowedInvestor() {
        __assertOnlyAllowedInvestor();
        _;
    }

    modifier locksReentrance() {
        __assertNotReentranceLocked();
        reentranceLocked = true;
        _;
        reentranceLocked = false;
    }

    // ASSERTION HELPERS

    // Modifiers are inefficient in terms of contract size,
    // so we use helper functions to prevent repetitive inlining of expensive string values.

    function __assertNotReentranceLocked() private view {
        require(!reentranceLocked, "Re-entrance");
    }

    function __assertIsOwner() private view {
        require(owner() == msg.sender, "Ownable: caller is not the owner");
    }

    function __assertIsNotShares(address _asset) private view {
        require(_asset != address(this), "Cannot act on shares");
    }

    function __assertOnlyAllowedInvestor() private view {
        if (useAllowedInvestor == true) {
            require(addressAllowed[msg.sender], "Not authorized to invest");
        }
    }

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {}

    //////////////////////
    //    CONSTRUCTOR   //
    //////////////////////

    function initialize(
        address _owner,
        uint256 _fundPaymentFees,
        uint256 _fundManagmentFees,
        address _denominationToken,
        address _zeroExchange,
        string memory _name,
        string memory _symbol,
        uint256 _tokensWhitelistId,
        bool _useTokensWhitelist,
        address _valueInterpreter,
        bool _useAllowedInvestor
    ) public onlyInitializing {
        TokenLogic.initialize(_name, _symbol);

        DENOMINATION_TOKEN = _denominationToken;
        FUND_FACTORY = msg.sender;
        OWNER = _owner;
        ZERO_EX_EXCHANGE = _zeroExchange;
        VALUE_INTERPRETER = _valueInterpreter;

        feeBpsForFund = _fundManagmentFees;
        feeDepositForFund = _fundPaymentFees;

        useTokensWhitelist = _useTokensWhitelist;
        if (_useTokensWhitelist == true) {
            tokensWhitelistId = _tokensWhitelistId;
        }

        __addTrackedAsset(_denominationToken);

        _setRoleAdmin(MANAGER, ADMIN_MANAGER);
        _grantRole(ADMIN_MANAGER, _owner);
        _grantRole(MANAGER, _owner);

        if (_useAllowedInvestor == true) {
            useAllowedInvestor = _useAllowedInvestor;
            __addInvestor(_owner);
        }

        __setLastPaidForFund(block.timestamp);
    }

    //////////////////////
    //      EXTERNAL    //
    //////////////////////

    /**
     * @notice function to invest in the fund and mint shares of if
     * @param _investmentAmount The number of shares that the user want to buy
     */
    function investInFund(
        uint256 _investmentAmount
    ) external onlyAllowedInvestor returns (uint256) {
        require(_investmentAmount > 0, "investement need to be > 0");

        // calculate and pay fees
        (bool feesPayed, uint256 depositFees) = __payFees(_investmentAmount);

        require(feesPayed, "error paying fee");

        IERC20Metadata denominationToken = IERC20Metadata(DENOMINATION_TOKEN);

        // Calculate the number of share to Mint for the investor
        uint256 realInvestment = _investmentAmount.sub(depositFees);
        uint256 shareToMint = __sharesToMint(realInvestment);
        // Payment and minting
        denominationToken.transferFrom(
            msg.sender,
            address(this),
            realInvestment
        );
        _mint(msg.sender, shareToMint);

        emit SharesMinted(shareToMint, realInvestment, msg.sender);

        return shareToMint;
    }

    /**
     * @notice function to redeem shares of the fund in a proportion of each tokens
     * @param _sharesToWithdraw The number of shares that the user want to redeem
     */
    function redeemSharesInTokens(
        uint256 _sharesToWithdraw
    )
        external
        locksReentrance
        onlyAllowedInvestor
        returns (
            bool,
            address[] memory payoutAssets_,
            uint256[] memory payoutAmounts_
        )
    {
        require(_sharesToWithdraw > 0, "_shares need to be >0");
        require(
            balanceOf(msg.sender) >= _sharesToWithdraw,
            "user shares < shares wanted"
        );

        // pay fees
        (bool feesPayed, ) = __payFees(0);

        require(feesPayed, "error paying fee");

        uint256 sharesSupply = totalSupply();

        _burn(msg.sender, _sharesToWithdraw);

        payoutAssets_ = getTrackedAssets();

        // Calculate and transfer payout asset amounts due to _recipient
        payoutAmounts_ = new uint256[](payoutAssets_.length);
        for (uint256 i; i < payoutAssets_.length; i++) {
            uint256 balance = IERC20Metadata(payoutAssets_[i]).balanceOf(
                address(this)
            );
            payoutAmounts_[i] = balance.mul(_sharesToWithdraw).div(
                sharesSupply
            );

            // Transfer payout asset to _recipient
            if (payoutAmounts_[i] > 0) {
                IERC20Metadata(payoutAssets_[i]).transfer(
                    msg.sender,
                    payoutAmounts_[i]
                );
            }
        }

        emit InvestmentRedeemedInTokens(
            msg.sender,
            _sharesToWithdraw,
            payoutAssets_,
            payoutAmounts_
        );

        return (true, payoutAssets_, payoutAmounts_);
    }

    /**
     * @notice function to redeem shares only in the denomination token
     * @param _sharesToWithdraw The number of shares that the user want to redeem
     */
    function redeemSharesInDenominationToken(
        uint256 _sharesToWithdraw
    ) external locksReentrance onlyAllowedInvestor returns (bool) {
        require(_sharesToWithdraw > 0, "_shares need to be >0");
        require(
            balanceOf(msg.sender) >= _sharesToWithdraw,
            "user shares < shares wanted"
        );

        // pay fees
        (bool feesPayed, ) = __payFees(0);

        require(feesPayed, "error paying fee");

        IERC20Metadata denominationToken = IERC20Metadata(DENOMINATION_TOKEN);
        uint256 tokenToRedeem = __denominationAssetToRedeem(_sharesToWithdraw);
        require(
            getDenominationAssetBalance() >= tokenToRedeem,
            "fund balance to low for redeem"
        );

        denominationToken.safeTransfer(msg.sender, tokenToRedeem);

        _burn(msg.sender, _sharesToWithdraw);

        emit InvestmentRedeemedInDenominationToken(
            msg.sender,
            _sharesToWithdraw,
            tokenToRedeem
        );

        return true;
    }

    function addNewManager(address _manager) external onlyOwner returns (bool) {
        grantRole(MANAGER, _manager);
        return true;
    }

    function revokeManager(address _manager) external onlyOwner returns (bool) {
        revokeRole(MANAGER, _manager);
        return true;
    }

    /**
     * @notice Swaps ERC20->ERC20 tokens held by this contract using a 0x-API quote.
     */
    function fillQuote(
        // The `sellTokenAddress` field from the API response.
        IERC20Metadata _sellToken,
        // The `buyTokenAddress` field from the API response.
        IERC20Metadata _buyToken,
        // The `allowanceTarget` field from the API response.
        address _spender,
        // The `to` field from the API response.
        address payable _swapTarget,
        // The `data` field from the API response.
        bytes calldata _swapCallData
    ) external payable onlyRole(MANAGER) returns (bool) {
        // check if the fund use a whitelist
        if (useTokensWhitelist) {
            IFundFactory fundFactory = IFundFactory(FUND_FACTORY);
            // if its the case, check if _buyToken is inside
            require(
                fundFactory.doesTokenExist(
                    tokensWhitelistId,
                    address(_sellToken)
                ),
                "sellToken not approved"
            );
            // if its the case, check if _sellToken is inside
            require(
                fundFactory.doesTokenExist(
                    tokensWhitelistId,
                    address(_buyToken)
                ),
                "buyToken not approved"
            );
        }

        // Give `spender` an infinite allowance to spend this contract's `sellToken`.
        // Note that for some tokens (e.g., USDT, KNC), you must first reset any existing
        // allowance to 0 before being able to update it.
        // require(sellToken.approve(spender, uint256(-1)));
        require(
            __approveAssetMaxAsNeeded(_spender, address(_sellToken)),
            "error with allowance"
        );
        /*
        address _asset,
        address _target,
        uint256 _neededAmount
        */
        ZeroExHelper.fillQuote(
            address(_sellToken),
            address(_buyToken),
            _spender,
            _swapTarget,
            _swapCallData
        );

        // Call the encoded swap function call on the contract at `swapTarget`,
        // passing along any ETH attached to this function call to cover protocol fees.
        (bool success, ) = _swapTarget.call{value: msg.value}(_swapCallData);
        require(success, "SWAP_CALL_FAILED");

        __addTrackedAsset(address(_buyToken));
        // Remove token from tracked assets if there is no balance left.
        if (!__isAssetNeedToBeTracked(address(_sellToken))) {
            __removeTrackedAsset(address(_sellToken));
        }

        // Refund any unspent protocol fees to the sender.
        payable(msg.sender).transfer(address(this).balance);

        return true;
    }

    /**
     * @notice Payable fallback to allow this contract to receive protocol fee refunds.
     */
    receive() external payable {}

    //////////////////////
    //      PUBLIC      //
    //////////////////////

    /**
     * @notice add an authorized investor
     * @param _investor the address to authorize
     */
    function addInvestor(address _investor) public onlyOwner {
        __addInvestor(_investor);
    }

    /**
     * @notice add a list of authorized investor
     * @param _investors the addresses to authorize
     */
    function addInvestors(address[] memory _investors) public onlyOwner {
        for (uint256 index = 0; index < _investors.length; index++) {
            address currentInvestor = _investors[index];

            __addInvestor(currentInvestor);
        }
    }

    /**
     * @notice function to remove the right to invest
     * @param _investor the address for wich remove the right to invest
     */
    function removeAllowedInvestor(address _investor) public onlyOwner {
        require(
            addressAllowed[_investor] == true,
            "Investor already not allowed"
        );

        uint256 positionInvestor = addressAllowedPosition[_investor];
        address lastElementAddress = investorWhitelist[
            investorWhitelist.length - 1
        ];

        addressAllowed[_investor] = false;

        // Move last element to the position of the asset to remove
        investorWhitelist[positionInvestor] = lastElementAddress;
        addressAllowedPosition[lastElementAddress] = positionInvestor;
        investorWhitelist.pop();

        delete addressAllowedPosition[_investor];
    }

    /**
     * @notice funtion to get gross asset value of the fund
     * @return gav_ the gross asset value of the fund
     */
    function calcGav() public returns (uint256 gav_) {
        address[] memory assets = getTrackedAssets();

        if (assets.length == 0) {
            emit GavCalulated(address(this), 0);
            return 0;
        }

        uint256[] memory balances = new uint256[](assets.length);
        for (uint256 i; i < assets.length; i++) {
            balances[i] = IERC20Metadata(assets[i]).balanceOf(address(this));
        }

        gav_ = IValueInterpreter(getValueInterpreter())
            .calcCanonicalAssetsTotalValue(
                assets,
                balances,
                DENOMINATION_TOKEN
            );

        emit GavCalulated(address(this), gav_);

        return gav_;
    }

    /**
     * @notice add asset to the tracked asset list
     */
    function addTrackedAssets(address[] calldata _assets) public {
        for (uint256 i; i < _assets.length; i++) {
            __addTrackedAsset(_assets[i]);
        }
    }

    //////////////////////
    //      PRIVATE     //
    //////////////////////

    /**
     * @dev Helper to know how much of each tokens need to be swapped
     * @param _sharesToWithdraw The number of shares that the user want to redeem
     */
    function __calculTokensToSwap(
        uint256 _sharesToWithdraw
    ) private view returns (address[] memory, uint256[] memory) {
        // get all tokens
        address[] memory tokens = getTrackedAssets();

        // get the pourcentage shares to withdraw
        uint256 currentTotalSupply = totalSupply();
        uint256 percentage = _sharesToWithdraw.div(currentTotalSupply).mul(100);

        uint256[] memory tokensToSwapBalance = new uint256[](tokens.length);
        address[] memory tokensToSwapAddress = new address[](tokens.length);
        /*
            payoutAmounts_[i] = ERC20(payoutAssets_[i])
                .balanceOf(vaultProxy)
                .mul(sharesToRedeem)
                .div(sharesSupply);
        */
        // get the number of tokens for the percentage and remove the denomination asset from it
        for (uint256 index = 0; index < tokens.length; index++) {
            if (tokens[index] != DENOMINATION_TOKEN) {
                IERC20Metadata token = IERC20Metadata(tokens[index]);

                uint256 tokenBalance = token.balanceOf(address(this));
                uint256 balanceToSwap = tokenBalance.div(100).mul(percentage);

                tokensToSwapBalance[index] = balanceToSwap;
                tokensToSwapAddress[index] = tokens[index];
            }
        }

        return (tokensToSwapAddress, tokensToSwapBalance);
    }

    /**
     * @notice pay fees for the protocol and for the fund
     * @dev use this function either for invest and for redeem but with 0 for _investmentAmount in case of redeem
     *      the payment of fees is not the same if theres due to the owner of the fund or the protocole
     * @param _investmentAmount the investment for wich to pay fees
     */
    function __payFees(
        uint256 _investmentAmount
    ) private returns (bool, uint256 depositFeesPaied_) {
        uint256 lastPaid = getFundLastPaid();
        uint256 secondsDue = block.timestamp.sub(lastPaid);
        depositFeesPaied_ = 0;

        // Calculate and Transfert tokens to protocol for managment fees
        __payProtocolManagmentFees(lastPaid, secondsDue);

        // Calculate and pay fees for managment of fund by fund owner (fund)
        uint256 managmentFeeFund = __payFundManagmentFees(lastPaid, secondsDue);

        // Deposit fees
        if (_investmentAmount > 0) {
            // Calculate % of fees for deposit (protocole)
            // Calculate % of fees for deposit (fund)
            depositFeesPaied_ = __calcAndPayDepositFees(_investmentAmount);
        }

        // Even if feeDueForProtocol and feeDueForFund are 0, we update the lastPaid timestamp and emit the event
        __setLastPaidForFund(block.timestamp);

        return (true, depositFeesPaied_);
    }

    function __calcAndPayDepositFees(
        uint256 _investmentAmount
    ) private returns (uint256) {
        IERC20Metadata denominationToken = IERC20Metadata(DENOMINATION_TOKEN);

        // get fund fee due for investment from user
        uint256 mintingFeeForOwner = _investmentAmount.div(10000).mul(
            getFeeDepositForFund()
        );

        // get protocole fee due for investment from user
        uint256 mintingFeeForProtocol = _investmentAmount.div(10000).mul(
            getFeeDepositForProtocol()
        );

        // check that user has enough denomination token for investment (that include fees)
        uint balance = denominationToken.balanceOf(msg.sender);
        require(
            balance >= _investmentAmount,
            "Insufficient funds for transfer"
        );

        // check the allowance
        uint256 allowed = denominationToken.allowance(
            msg.sender,
            address(this)
        );
        require(allowed >= _investmentAmount, "Allowance to low for transfer");

        // Minting fees
        denominationToken.transferFrom(
            msg.sender,
            FUND_FACTORY,
            mintingFeeForProtocol
        );
        denominationToken.transferFrom(msg.sender, OWNER, mintingFeeForOwner);

        emit FeesPaidForMinting(mintingFeeForProtocol, mintingFeeForOwner);

        // feePaied_ = feePaied_.add(mintingFeeForOwner).add(mintingFeeForProtocol);
        return mintingFeeForOwner.add(mintingFeeForProtocol);
    }

    /**
     * @notice calculate and pay the managment fees to the protocol for each tokens in the fund
     */
    function __payProtocolManagmentFees(
        uint256 _lastPaid,
        uint256 _secondsDue
    ) private {
        address[] memory trackedAssetsList = getTrackedAssets();

        uint256 amount = 0;

        for (uint256 i = 0; i < trackedAssetsList.length; i++) {
            ERC20Upgradeable currentAsset = ERC20Upgradeable(
                trackedAssetsList[i]
            );
            uint256 balance = currentAsset.balanceOf(address(this));
            if (balance > 0) {
                require(balance > amount, "not enough token to transfer");
                uint256 tokensDue = __calcFeeDueForProtocol(
                    _lastPaid,
                    _secondsDue,
                    balance
                );
                currentAsset.transfer(address(FUND_FACTORY), tokensDue);
            }
        }
    }

    /**
     * @notice calculate the number of fund's part due to the owner
     */
    function __payFundManagmentFees(
        uint256 _lastPaid,
        uint256 _secondsDue
    ) private returns (uint256 sharesDue_) {
        if (_lastPaid >= block.timestamp) {
            return 0;
        }

        uint256 sharesSupply = totalSupply();

        uint256 rawSharesDue = sharesSupply
            .mul(getFeeBpsFund())
            .mul(_secondsDue)
            .div(SECONDS_IN_YEAR)
            .div(MAX_BPS);

        uint256 supplyNetRawSharesDue = sharesSupply.sub(rawSharesDue);
        if (supplyNetRawSharesDue == 0) {
            return 0;
        }

        sharesDue_ = rawSharesDue.mul(sharesSupply).div(supplyNetRawSharesDue);

        if (sharesDue_ == 0) {
            return 0;
        }

        _mint(OWNER, sharesDue_);

        emit FundFeePaidInShares(sharesDue_);

        return sharesDue_;
    }

    /**
     * @notice calculate the number of tokens due of a specific asset to the protocol as fees
     */
    function __calcFeeDueForProtocol(
        uint256 _lastPaid,
        uint256 _secondsDue,
        uint256 _assetBalance
    ) private view returns (uint256 rawTokensDue_) {
        rawTokensDue_ = 0;
        // Formula = (seconds_elapsed_since_last_pay)/(seconds in a year)*[ANNUAL FEE TARGET RATIO]*[ASSET BALANCE]
        // ex: if 24h elasped, and 10% annual fee targeted: ((3600*24)/3,154e+7)*(1000/10000)*asset_balance
        if (_lastPaid < block.timestamp) {
            rawTokensDue_ = _assetBalance
                .mul(getFeeBpsProtocol())
                .mul(_secondsDue)
                .div(SECONDS_IN_YEAR)
                .div(MAX_BPS);
        }
        return rawTokensDue_;
    }

    /**
     * @notice function to know of much shares to mint for a given amount of token
     * if there is not share curently shared then the first deposit equal one (1) share or 10**(share's decimals)
     * @param _amountToConvert the amount of token
     */
    function __sharesToMint(
        uint256 _amountToConvert
    ) private view returns (uint256 sharesToMint_) {
        uint256 sharesSupply = totalSupply();
        uint256 denominationAssetBalance = getDenominationAssetBalance();
        uint256 shareDecimal = decimals();
        uint256 denominationAssetDecimal = IERC20Metadata(DENOMINATION_TOKEN)
            .decimals();
        uint256 sharesUnit = 10 ** uint256(shareDecimal);

        if (sharesSupply == 0) {
            sharesToMint_ = sharesUnit;
            return sharesToMint_;
        }

        uint256 decimalDifference = 0;
        if (denominationAssetDecimal < shareDecimal) {
            decimalDifference = shareDecimal.sub(denominationAssetDecimal);
        } else {
            decimalDifference = denominationAssetDecimal.sub(shareDecimal);
        }
        denominationAssetBalance = denominationAssetBalance.mul(
            10 ** uint256(decimalDifference)
        );

        uint256 sharePrice = denominationAssetBalance.div(sharesSupply);
        sharesToMint_ = _amountToConvert
            .mul(10 ** uint256(decimalDifference))
            .div(sharePrice);

        return sharesToMint_;
    }

    /**
     * @dev Helper to know the sum of denomination asset to redeem
     */
    function __denominationAssetToRedeem(
        uint256 _sharesToRedeem
    ) private view returns (uint256 tokenToRedeem_) {
        uint256 sharesSupply = totalSupply();
        uint256 denominationAssetBalance = getDenominationAssetBalance();

        tokenToRedeem_ = denominationAssetBalance.mul(_sharesToRedeem).div(
            sharesSupply
        );
        return tokenToRedeem_;
    }

    /**
     * @dev Helper to set the lastPaid timestamp for the current fund
     */
    function __setLastPaidForFund(uint256 _nextTimestamp) private {
        fundLastPaid = _nextTimestamp;
    }

    /**
     * @dev Helper to add a tracked asset
     */
    function __addTrackedAsset(address _asset) private notShares(_asset) {
        if (!isTrackedAsset(_asset)) {
            trackedAssets.push(_asset);
            assetToIsTracked[_asset] = true;
            assetTrackedPosition[_asset] = trackedAssets.length - 1;
        }
    }

    /**
     * @dev Helper to remove a tracked asset
     */
    function __removeTrackedAsset(address _asset) private notShares(_asset) {
        if (isTrackedAsset(_asset)) {
            uint256 positionAsset = assetTrackedPosition[_asset];
            address lastElementAddress = trackedAssets[
                trackedAssets.length - 1
            ];

            assetToIsTracked[_asset] = false;

            // Move last element to the position of the asset to remove
            trackedAssets[positionAsset] = lastElementAddress;
            assetTrackedPosition[lastElementAddress] = positionAsset;
            trackedAssets.pop();

            delete assetTrackedPosition[_asset];
        }
    }

    /**
     * @dev Helper to know if an asset need to be tracked
     */
    function __isAssetNeedToBeTracked(
        address _asset
    ) private view notShares(_asset) returns (bool) {
        uint256 balance = IERC20Metadata(_asset).balanceOf(address(this));
        if (balance > 0) {
            return true;
        } else {
            return false;
        }
    }

    //////////////////////
    //      INTERNAL    //
    //////////////////////

    /**
     * @notice Helper to approve a target account with the max amount of an asset.
     * This is helpful for fully trusted contracts, such as adapters that
     * interact with external protocol like Uniswap, Compound, etc.
     */
    function __approveAssetMaxAsNeeded(
        address _spender,
        address _asset
    ) internal returns (bool) {
        uint256 tokenAllowance = IERC20Metadata(_asset).allowance(
            address(this),
            _spender
        );

        if (tokenAllowance > 0) {
            IERC20Metadata(_asset).approve(_spender, 0);
        }
        IERC20Metadata(_asset).approve(_spender, type(uint256).max);

        return true;
    }

    /**
     * @dev helper to the get the balance of an assets
     */
    function __getAssetBalance(
        address _asset
    ) internal view returns (uint256 balance_) {
        return IERC20Metadata(_asset).balanceOf(address(this));
    }

    /**
     * @dev helper to i
     */
    function __addInvestor(address _investor) internal {
        require(addressAllowed[_investor] == false, "Investor already allowed");

        investorWhitelist.push(_investor);
        addressAllowedPosition[_investor] = investorWhitelist.length - 1;
        addressAllowed[_investor] = true;
    }

    //////////////////////
    //  STATE GETTERS   //
    //////////////////////

    /**
     * @dev Returns the address of the current owner.
     */
    function owner() public view virtual returns (address) {
        return OWNER;
    }

    /**
     * @notice Get the last time the fund was paid
     * @dev Gets the fundLastPaid value
     */
    function getFundLastPaid() public view returns (uint256) {
        return fundLastPaid;
    }

    /**
     * @dev function to the get the contract's denomination asset balance
     */
    function getDenominationAssetBalance()
        public
        view
        returns (uint256 balance_)
    {
        return IERC20Metadata(DENOMINATION_TOKEN).balanceOf(address(this));
    }

    /**
     * @notice Gets the `feeBpsForProtocol` variable value
     * @return feeBps_ The `feeBpsForProtocol` variable value
     */
    function getFeeBpsProtocol() public pure returns (uint256 feeBps_) {
        return feeBpsForProtocol;
    }

    /**
     * @notice Gets the `feeBpsForFund` variable value
     * @return feeBps_ The `feeBpsForFund` variable value
     */
    function getFeeBpsFund() public view returns (uint256 feeBps_) {
        return feeBpsForFund;
    }

    /**
     * @notice Gets the `feeDepositForFund` variable value
     * @return feeDeposit_ The `feeDepositForFund` variable value
     */
    function getFeeDepositForFund() public view returns (uint256 feeDeposit_) {
        return feeDepositForFund;
    }

    /**
     * @notice Gets the `feeDepositForProtocol` variable value
     * @return feeDeposit_ The `feeDepositForProtocol` variable value
     */
    function getFeeDepositForProtocol()
        public
        pure
        returns (uint256 feeDeposit_)
    {
        return feeDepositForProtocol;
    }

    /**
     * @notice Get the whitelist id
     */
    function getTokensWhitelistId() public view returns (uint256) {
        return tokensWhitelistId;
    }

    /**
     * @notice return the informations about the fund
     */
    function getFundInformations()
        public
        view
        returns (
            string memory,
            string memory,
            uint256,
            address,
            uint256,
            uint256,
            uint256,
            uint256,
            uint256,
            address[] memory,
            bool,
            uint256
        )
    {
        return (
            name(),
            symbol(),
            totalSupply(),
            OWNER,
            feeBpsForFund,
            feeDepositForFund,
            feeBpsForProtocol,
            feeDepositForProtocol,
            getDenominationAssetBalance(),
            getTrackedAssets(),
            useTokensWhitelist,
            getTokensWhitelistId()
        );
    }

    /**
     * @notice Gets the `ZERO_EX_EXCHANGE` variable value
     * @return zeroExExchange_ The `ZERO_EX_EXCHANGE` variable value
     */
    function getZeroExExchange() public view returns (address zeroExExchange_) {
        return ZERO_EX_EXCHANGE;
    }

    function getTrackedAssets() public view returns (address[] memory) {
        return trackedAssets;
    }

    /**
     * @notice Checks whether an address is a tracked asset of the vault
     * @param _asset The address to check
     * @return isTrackedAsset_ True if the address is a tracked asset
     */
    function isTrackedAsset(
        address _asset
    ) public view returns (bool isTrackedAsset_) {
        return assetToIsTracked[_asset];
    }

    function getUseAllowedInvestor() public view returns (bool) {
        return useAllowedInvestor;
    }

    /**
     * @return investorWhitelist_ the list of investor allowed to invest in the fund
     */
    function getInvestorWhitelist() public view returns (address[] memory) {
        return investorWhitelist;
    }

    /**
     * @notice Checks wether an address is allowed to invest
     * @param _investor The address to check
     * @return True if the address is allowed to invest
     */
    function isAddressAllowedToInvest(
        address _investor
    ) public view returns (bool) {
        return addressAllowed[_investor];
    }

    /**
     * @notice Gets the `VALUE_INTERPRETER` variable
     * @return valueInterpreter_ The `VALUE_INTERPRETER` variable value
     */
    function getValueInterpreter()
        public
        view
        returns (address valueInterpreter_)
    {
        return VALUE_INTERPRETER;
    }
}
