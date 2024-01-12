const { ethers } = require("hardhat");
const { expect, assert } = require("chai");
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
const useWhitelistedInvestor = false

describe("Deployment", function () {

    beforeEach("init signers", async function () {
        const [owner, investor, investor2] = await ethers.getSigners();
    
        this.owner = owner
    })
    
    it("Fund Logic: Deploy Contract", async function () {
        const FundLogic = await ethers.getContractFactory(contractsNames.LOGIC)
        const fundLogicInstance = await FundLogic.deploy()
        await fundLogicInstance.deployed()
        
        expect(fundLogicInstance.address, "fundLogicInstance has a correct address").to.be.a.properAddress;
    })

    it("Value Interpreter: Deploy Contract", async function () {
        const chainlinkStaleRateThreshold = hre.network.live
            ? ONE_DAY_IN_SECONDS + ONE_HOUR_IN_SECONDS
            : ONE_YEAR_IN_SECONDS * 10;
            
        const ValueInterpreterFactory = await ethers.getContractFactory(contractsNames.VALUE_INTERPRETER)
        const valueInterpreterInstance = await ValueInterpreterFactory.deploy(chainlinkStaleRateThreshold);
        await valueInterpreterInstance.deployed()

        expect(valueInterpreterInstance.address, "valueInterpreterInstance has a correct address").to.be.a.properAddress;
    })

    before("Before: Deploy Fund Logic AND Value Interpreter", async function () {
        /** fundLogic DEPLOYEMENT */
        const FundLogic = await ethers.getContractFactory(contractsNames.LOGIC)
        this.fundLogicInstance = await FundLogic.deploy()
        await this.fundLogicInstance.deployed()
        const MockUSDC = await ethers.getContractFactory(contractsNames.USDC)
        this.mockUSDCInstance = await MockUSDC.deploy()
        await this.mockUSDCInstance.deployed()

        /** ValueInterpreter DEPLOYEMENT */
        const chainlinkStaleRateThreshold = hre.network.live
            ? ONE_DAY_IN_SECONDS + ONE_HOUR_IN_SECONDS
            : ONE_YEAR_IN_SECONDS * 10;

        const ValueInterpreterFactory = await ethers.getContractFactory(contractsNames.VALUE_INTERPRETER)
        this.valueInterpreterInstance = await ValueInterpreterFactory.deploy(chainlinkStaleRateThreshold)
        await this.valueInterpreterInstance.deployed()
    })

    it("Fund Factory: Deploy Contract", async function () {
        const FundFactory = await ethers.getContractFactory(contractsNames.FACTORY)
        const factoryInstance = await FundFactory.deploy(this.fundLogicInstance.address, this.mockUSDCInstance.address, ZERO_EX, this.valueInterpreterInstance.address);
        await factoryInstance.deployed()

        expect(factoryInstance.address, "factoryInstance has a correct address").to.be.a.properAddress;
        expect(await factoryInstance.getDenominationTokenAddress(), "Denomination token addresse saved").to.equal(this.mockUSDCInstance.address);
        expect(await factoryInstance.getFundLogicAddress(), "Fund logic address saved").to.not.equal("");
    })

    before("Before: Deploy Fund Factory", async function () {
        const FundFactory = await ethers.getContractFactory(contractsNames.FACTORY)
        const factoryInstance = await FundFactory.deploy(this.fundLogicInstance.address, this.mockUSDCInstance.address, ZERO_EX, this.valueInterpreterInstance.address);
        this.factoryInstance = await factoryInstance.deployed()
    })

    it("Fund Proxy deployed from Factory", async function () {
        const newProxyTx = await this.factoryInstance.createFund(
            fundPaymentFees,
            fundManagmentFees,
            tokenName,
            tokenSymbol,
            whitelistId,
            useWhitelist,
            useWhitelistedInvestor
        )
        const proxy = await newProxyTx.wait();

        // Get the event for the deploy of the fund proxy
        const events = proxy.events.filter(event => event.event && event.event === "FundProxyDeployed")
        const deployEvent = events.length > 0 ? events[0]: null
        
        // attach the proxy to the corresponding abi
        const proxyAddress = deployEvent.args.tokenProxy;
        const fundProxyInstance = this.fundLogicInstance.attach(proxyAddress);

        expect(proxyAddress, "fundProxyInstance has a correct address").to.be.a.properAddress;
        expect(await fundProxyInstance.name()).to.equal(tokenName);
    })
})