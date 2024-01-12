//SPDX-License-Identifier: MIT
pragma solidity ^0.8.12;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

import "../fund/FundLogic.sol";
import "../fund/FundProxy.sol";

contract FundFactory {
    using SafeERC20 for IERC20;

    address immutable FUND_LOGIC;
    address immutable DENOMINATION_TOKEN;
    address immutable PROTOCOL_OWNER;
    address immutable ZERO_EX_EXCHANGE;
    address immutable VALUE_INTERPRETER;
    
    address[] fundsList;

    struct Token {
        string name;
        string symbol;
        address tokenAddress;
        uint256 index;
    }

    struct WhiteList {
        uint256 index;
        string name;
        Token[] tokens;
        mapping (address => uint256) tokenPositionForAddress;
        mapping (address => bool) tokenExist;
        address listOwner;
    }

    mapping (uint256 => WhiteList) public whitelistStructs;
    uint256[] private whitelistIndex;

    event FundProxyDeployed(address creator, address tokenProxy, string tokenName, string tokenSymbol);
    event WhiteListCreated(uint256 index, string name);
    event TokenAddedInWhitelist(uint256 whitelistIndex, string tokenName, string tokenSymbol, address tokenAddress);

    modifier onlyOwner() {
        require(msg.sender == PROTOCOL_OWNER, "Only the contract owner can call this function");
        _;
    }

    modifier onlyWhitelistOwner(uint256 _whitelistIndex) {
        require(msg.sender == whitelistStructs[_whitelistIndex].listOwner, "Only the whitelist owner can call this function");
        _;
    }

    constructor(address _fundLogicAddress, address _denominationToken, address _zeroExchange, address _valueInterpreter) {
        FUND_LOGIC = _fundLogicAddress;
        DENOMINATION_TOKEN = _denominationToken;
        PROTOCOL_OWNER = msg.sender;
        ZERO_EX_EXCHANGE = _zeroExchange;
        VALUE_INTERPRETER = _valueInterpreter;
    }

    //////////////////////
    //      EXTERNAL    //
    //////////////////////

    function withdrawFees() external onlyOwner {
        IERC20 denominationToken = IERC20(DENOMINATION_TOKEN);
        uint256 balance = denominationToken.balanceOf(address(this));
        require(balance >= 0, "balance < 0");
        
        denominationToken.safeTransfer(PROTOCOL_OWNER, balance);
    }

    function createWhitelist(string memory _name) external returns (uint256) {
        require(bytes(_name).length > 0, "The name is mandatory");
        
        uint256 index =  whitelistIndex.length + 1;
        whitelistStructs[index].index = index;
        whitelistStructs[index].name = _name;
        whitelistStructs[index].listOwner = msg.sender;
        whitelistIndex.push(index);

        emit WhiteListCreated(index, _name);
        return index;
    }

    function addTokenToWhiteList(
        uint256 _whitelistIndex,
        string memory _name,
        string memory _symbol,
        address _address
    ) onlyWhitelistOwner(_whitelistIndex) external {
        require(bytes(whitelistStructs[_whitelistIndex].name).length > 0 , "the index must be of a existing whitelist");
        require(bytes(_name).length > 0, "The length name must be > 0" );
        require(bytes(_symbol).length > 0, "The length symbol must be > 0" );
        require(_address != address(0), "The token address is mandatory" );
        require(!whitelistStructs[_whitelistIndex].tokenExist[_address], "Token already in the whitelist");
        
        Token memory newToken = Token({
            name: _name,
            symbol: _symbol,
            tokenAddress: _address,
            index: whitelistStructs[_whitelistIndex].tokens.length
        });
        whitelistStructs[_whitelistIndex].tokens.push(newToken);
        whitelistStructs[_whitelistIndex].tokenPositionForAddress[_address] = whitelistStructs[_whitelistIndex].tokens.length - 1;
        whitelistStructs[_whitelistIndex].tokenExist[_address] = true;

        emit TokenAddedInWhitelist(_whitelistIndex, _name, _symbol, _address);
    }

    function removeToken(uint256 _whitelistIndex, address _addressToken) onlyWhitelistOwner(_whitelistIndex) external returns (bool) {
        require(bytes(whitelistStructs[_whitelistIndex].name).length > 0 , "the index must be of a existing whitelist");

        uint256 tokenPosition = whitelistStructs[_whitelistIndex].tokenPositionForAddress[_addressToken];
        address lastTokenAddress = whitelistStructs[_whitelistIndex].tokens[tokenPosition].tokenAddress;
        // move last token at the index of the token that we want to delete
        whitelistStructs[_whitelistIndex].tokens[tokenPosition] = whitelistStructs[_whitelistIndex].tokens[whitelistStructs[_whitelistIndex].tokens.length - 1];
        // remove the last duplicate token 
        whitelistStructs[_whitelistIndex].tokens.pop();
        // update (ex) last token position
        whitelistStructs[_whitelistIndex].tokenPositionForAddress[lastTokenAddress] = tokenPosition;
        whitelistStructs[_whitelistIndex].tokenExist[_addressToken] = false;

        return true;
    }

   function createFund(
        address fundLogic,
        uint256 _fundPaymentFees,
        uint256 _fundManagmentFees,
        string memory _tokenName,
        string memory _tokenSymbol,
        uint256 _whitelistId,
        bool _useWhitelist,
        bool _useAllowedInvestor
    ) external returns (address) {
        require(fundLogic != address(0), "Adresse de logique invalide");

        // Vous devez coder la logique pour encoder ces paramètres.
        // Par exemple, vous pouvez les encoder en un seul bytes mémoire si nécessaire.
        bytes memory initData = abi.encodeWithSelector(
            FundProxy(fundLogic).initialize.selector,
            _fundPaymentFees,
            _fundManagmentFees,
            _tokenName,
            _tokenSymbol,
            _whitelistId,
            _useWhitelist,
            _useAllowedInvestor
        );

        address fundProxy = _factory.deploy(fundLogic, initData);
        Fund memory newFund = Fund({
            proxyAddress: fundProxy,
            logicAddress: fundLogic,
            ownerAddress: msg.sender
        });
        funds.push(newFund);

        emit FundCreated(fundProxy, fundLogic, msg.sender);

        return fundProxy;
    }

    //////////////////////
    //  STATE GETTERS   //
    //////////////////////

    /**
     * @dev Returns informations about the factory
     */
    function getFactoryInformations() public view returns (address, address, address, address, uint256, uint256) {
        return (address(this), FUND_LOGIC, DENOMINATION_TOKEN, PROTOCOL_OWNER, getFundCount(), IERC20(DENOMINATION_TOKEN).balanceOf(address(this)));
    }

    /**
     * @dev Returns the address of the current owner.
     */
    function owner() public view virtual returns (address) {
        return PROTOCOL_OWNER;
    }
    
    function getFundLogicAddress() public view returns (address) {
        return FUND_LOGIC;
    }
    
    function getDenominationTokenAddress() public view returns (address) {
        return DENOMINATION_TOKEN;
    }
    
    /**
     * @notice return the addresses of all the funds
     */
    function getFundsList() public view returns (address[] memory) {
        return fundsList;
    }
    
    /**
     * @notice return the number of whitelist
     */
    function getWhitelistCount() public view returns (uint256) {
        return whitelistIndex.length;
    }

    function getFundCount() public view returns (uint256) {
        return fundsList.length;
    }

    /**
     * @notice check if a token exist in a given whitelist
     * @param _whitlistIndex the index of the whitelist
     * @param _tokenAddress the address of the token
     * @return true if the token exist and false if it's not the case
     */
    function doesTokenExist(uint256 _whitlistIndex, address _tokenAddress) external view returns (bool) {
        uint256 tokenPosition = whitelistStructs[_whitlistIndex].tokenPositionForAddress[_tokenAddress];
        if (bytes(whitelistStructs[_whitlistIndex].tokens[tokenPosition].name).length > 0) {
            return true;
        } else {
            return false;
        }
    }

    /**
     * @notice return all the whitelists
     */
    function getWhiteLists() public view returns (uint256[] memory, string[] memory, address[] memory, uint256[] memory, string[] memory) {
        uint256            whitelistCount = getWhitelistCount();
        uint256[]   memory index = new uint256[](whitelistCount);
        string[]    memory name = new string[](whitelistCount);
        address[]   memory listOwner = new address[](whitelistCount);
        uint256[]   memory tokensCount = new uint256[](whitelistCount);
        string[]    memory tokens = new string[](whitelistCount);

        for (uint256 i = 0; i < whitelistCount; i++) {
            uint256 currentIndex = whitelistIndex[i];
            index[i] = whitelistStructs[currentIndex].index;
            name[i] = whitelistStructs[currentIndex].name;
            listOwner[i] = whitelistStructs[currentIndex].listOwner;
            tokensCount[i] = whitelistStructs[currentIndex].tokens.length;

            string memory tempTokens;
            
            for (uint256 j = 0; j < whitelistStructs[currentIndex].tokens.length; j++) {
                if (j > 0) {
                    tempTokens = string.concat(tempTokens, ",");
                }
                tempTokens = string.concat(tempTokens, whitelistStructs[currentIndex].tokens[j].symbol);
            }
            tokens[i] = tempTokens;
        }
        return (index, name, listOwner, tokensCount, tokens);
    }

    /**
     * @notice return a specified whitelist
     */
     function getWhiteList(uint256 _index) external view returns (uint256, string memory, address, string memory, string[] memory, string[] memory, address[] memory) {
        uint256            indexWhitelist = _index;
        uint256            index = whitelistStructs[_index].index;
        string      memory name = whitelistStructs[_index].name;
        address            listOwner = whitelistStructs[_index].listOwner;
        string      memory tokens;
        string[]    memory names = new string[](whitelistStructs[indexWhitelist].tokens.length);
        string[]    memory symbols = new string[](whitelistStructs[indexWhitelist].tokens.length);
        address[]   memory addresses = new address[](whitelistStructs[indexWhitelist].tokens.length);
        
        for (uint256 counter = 0; counter < whitelistStructs[indexWhitelist].tokens.length; counter++) {
            if (counter > 0) {
                tokens = string.concat(tokens, ",");
            }
            tokens = string.concat(tokens, whitelistStructs[indexWhitelist].tokens[counter].symbol);
            names[counter] = whitelistStructs[indexWhitelist].tokens[counter].name;
            symbols[counter] = whitelistStructs[indexWhitelist].tokens[counter].symbol;
            addresses[counter] = whitelistStructs[indexWhitelist].tokens[counter].tokenAddress;
        }

        return (index, name, listOwner, tokens, names, symbols, addresses);
     }
}