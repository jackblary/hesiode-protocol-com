const { ethers } = require("hardhat");
const { expect, assert } = require("chai");
const { chain } = require("mathjs");
const { contractsNames } = require("./utils");

const ZERO_EX = "0xdef1c0ded9bec7f1a1670819833240f027b25eff"

// Time
const ONE_HOUR_IN_SECONDS = 60 * 60;
const ONE_DAY_IN_SECONDS = ONE_HOUR_IN_SECONDS * 24;
const ONE_WEEK_IN_SECONDS = ONE_DAY_IN_SECONDS * 7;
const ONE_YEAR_IN_SECONDS = ONE_DAY_IN_SECONDS * 365.25;

// FUND PARAMS
const fundPaymentFees = 0
const fundManagmentFees = 0
const tokenName = "test"
const tokenSymbol = "TST"
const whitelistId = 0
const useWhitelist = false

const sumToInvest = 100000000; // 100 USDC
const sumToAllow = 100000000; // 100 USDC
const sharesToMint = "1000000000000000000"; // 1 share


beforeEach("init global variables and states", async function() {
    const [owner, investor, investor2] = await ethers.getSigners();

    // Deploy a mock USDC
    const MockUSDC = await ethers.getContractFactory(contractsNames.USDC);
    const mockUSDCInstance = await MockUSDC.deploy();
    await mockUSDCInstance.deployed();

    // Deploy the fund logic
    const FundLogic = await ethers.getContractFactory(contractsNames.LOGIC, owner);
    const fundLogicInstance = await FundLogic.deploy();
    await fundLogicInstance.deployed();

    // Deploy the Value Interpreter
    const chainlinkStaleRateThreshold = hre.network.live
        ? ONE_DAY_IN_SECONDS + ONE_HOUR_IN_SECONDS
        : ONE_YEAR_IN_SECONDS * 10;

    const ValueInterpreterFactory = await ethers.getContractFactory(contractsNames.VALUE_INTERPRETER)
    const valueInterpreterInstance = await ValueInterpreterFactory.deploy(chainlinkStaleRateThreshold)
    await valueInterpreterInstance.deployed()

    // Deploy the fund factory
    const FundFactory = await ethers.getContractFactory(contractsNames.FACTORY, owner);
    const fundFactoryInstance = await FundFactory.deploy(fundLogicInstance.address, mockUSDCInstance.address, ZERO_EX, valueInterpreterInstance.address);
    await fundFactoryInstance.deployed()
    
    // Deploy a new Proxy
    const newProxyTx = await fundFactoryInstance.createFund(30, 40, "test", "TST", 0, false, false);
    const proxy = await newProxyTx.wait();
  
    // Get the event for the deploy of the fund proxy
    const events = proxy.events.filter(event => event.event && event.event === "FundProxyDeployed")
    const deployEvent = events.length > 0 ? events[0]: null
  
    // attach the proxy to the corresponding abi
    const proxyAddress = deployEvent.args.tokenProxy;
    const fundProxied = fundLogicInstance.attach(proxyAddress);

    mockUSDCInstance.connect(investor).mint(10 ** 15);
    mockUSDCInstance.connect(investor2).mint(10 ** 15);

    this.owner = owner
    this.investor = owner
    this.investor2 = owner
    this.mockUSDCInstance = mockUSDCInstance
    this.fundFactoryInstance = fundFactoryInstance
    this.fundLogicInstance = fundLogicInstance
    this.fundProxied = fundProxied
    this.valueInterpreterInstance = valueInterpreterInstance
})

describe("Fund Factory", function() {
    it("create Whitelist", async function() {

        // Get the list of whitelist before creatin a new one
        const [ indexBefore ] = await this.fundFactoryInstance.getWhiteLists()

        const whitelistName = "New Whitelist"
        const newWhitelistTx = await this.fundFactoryInstance.createWhitelist(whitelistName)
        const { events } = await newWhitelistTx.wait()

        // Get the event for the creation of a new whitelist
        const eventsFiltered = events.filter(event => event.event && event.event === "WhiteListCreated")

        // Get the list of whitelist after creating a new one
        const [indexAfter, name, listOwner, tokensCount, tokens] = await this.fundFactoryInstance.getWhiteLists()

        expect(eventsFiltered.length, "No corresponding event").to.equal(1)
        expect(indexAfter.length, "No new whitelist added").to.equal(indexBefore.length + 1)
        expect(name[indexBefore.length - 1], "The name is not the good one").to.equal(whitelistName)
        expect(listOwner[indexBefore.length - 1], "The list owner is not the good one").to.equal(this.owner.address)
        expect(eventsFiltered[0].args.name, "The name is not the good one").to.equal(whitelistName)
    })
    
    beforeEach("Before: create whitelist", async function() {
        const whitelistName = "New Whitelist"
        const newWhitelistTx = await this.fundFactoryInstance.createWhitelist(whitelistName)
    })
    it("add token to whitelist", async function() {
        const tokenName = "usdc"
        const tokenSymnol = "USDC"
        const tokenAddress = "0x2791bca1f2de4661ed88a30c99a7a9449aa84174"

        const [indexBefore, nameBefore, listOwnerBefore, tokensCountBefore, tokensBefore] = await this.fundFactoryInstance.getWhiteLists()

        //addTokenToWhiteList
        const addTokenTx = await this.fundFactoryInstance.addTokenToWhiteList(indexBefore[0], tokenName, tokenSymnol, tokenAddress)
        const { events } = await addTokenTx.wait()

        // Get the event for adding token in the whitelist
        const eventsFiltered = events.filter(event => event.event && event.event === "TokenAddedInWhitelist")

        const [indexAfter, nameAfter, listOwnerAfter, tokensCountAfter, tokensAfter] = await this.fundFactoryInstance.getWhiteLists()

        expect(eventsFiltered.length, "No corresponding event").to.equal(1)
        expect(parseInt(tokensCountAfter), "The number of tokens in the whitelist is not good").to.equal(parseInt(tokensCountBefore) + 1)
        expect(tokensAfter[tokensAfter.length -1], "The number of tokens in the whitelist is not good").to.equal(tokenSymnol)
    })
})