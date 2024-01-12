const { ethers, network } = require("hardhat");
const { expect, assert } = require("chai");
const { chain } = require("mathjs");
const { contractsNames, swapToken } = require("./utils");

const polygonConfig = require("../scripts/config/Polygon");
const mainnetConfig = require("../scripts/config/Mainnet");

// Time
const ONE_HOUR_IN_SECONDS = 60 * 60;
const ONE_DAY_IN_SECONDS = ONE_HOUR_IN_SECONDS * 24;
const ONE_WEEK_IN_SECONDS = ONE_DAY_IN_SECONDS * 7;
const ONE_YEAR_IN_SECONDS = ONE_DAY_IN_SECONDS * 365.25;

describe("Value Interpreter", function() {
    beforeEach("init global variables and states", async function() {
        this.provider = ethers.getDefaultProvider("matic")
        const [owner, investor, investor2] = await ethers.getSigners();

        const chainlinkStaleRateThreshold = hre.network.live
            ? ONE_DAY_IN_SECONDS + ONE_HOUR_IN_SECONDS
            : ONE_YEAR_IN_SECONDS * 10;

        // Deploy the value interpreter
        const ValueInterpreterFactory = await ethers.getContractFactory(contractsNames.VALUE_INTERPRETER, owner);
        const valueInterpreterInstance = await ValueInterpreterFactory.deploy(chainlinkStaleRateThreshold);
        await valueInterpreterInstance.deployed();

        this.owner = owner
        this.investor = owner
        this.investor2 = owner

        this.valueInterpreterInstance = valueInterpreterInstance
    })
    
    it("is connected to the good provider, involves that it is connected to a fork of mainnet", async () => {
        // Code to check if the provider can connect to a mainnet fork
        // const provider = ethers.getDefaultProvider("matic")
        // console.log("getBlockNumber", await provider.getBlockNumber());

        const AggregatorProxy = await ethers.getContractAt(contractsNames.AGGREGATOR, polygonConfig.chainlink.aggregators["1inch"][0])
        const aggregatorDescription = await AggregatorProxy.description()

        expect(aggregatorDescription, "the aggregator doesn't exist").to.be.not.equal(null)
    })

    it("can add Primitives", async function() {
        const primitivesInfo = [Object.keys(polygonConfig.primitives)[0]].map((key) => {
            if (!polygonConfig.chainlink.aggregators[key]) {
                throw new Error(`Missing aggregator for ${key}`);
            }
    
            const aggregator = polygonConfig.chainlink.aggregators[key];
            const primitive = polygonConfig.primitives[key];
    
            return [primitive, ...aggregator];
        });
    
        const primitives = primitivesInfo.map(([primitive]) => primitive);
        const aggregators = primitivesInfo.map(([, aggregator]) => aggregator);
        const rateAssets = primitivesInfo.map(([, , rateAsset]) => rateAsset);
  
        const tx = await this.valueInterpreterInstance.addPrimitives(primitives, aggregators, rateAssets)
        const reponse = await tx.wait()

        // Get the event for the primitive added
        const events = reponse.events.filter(event => event.event && event.event === "PrimitiveAdded")
        const addPrimitiveEvent = events.length > 0 ? events[0]: null
  
        const firstPrimitiveKey = Object.keys(polygonConfig.primitives)[0]

        expect(addPrimitiveEvent.args.primitive.toLowerCase(), "not the same address").to.equal(polygonConfig.primitives[firstPrimitiveKey].toLowerCase())
        expect(addPrimitiveEvent.args.aggregator.toLowerCase(), "not the same aggregator").to.equal(polygonConfig.chainlink.aggregators[firstPrimitiveKey][0].toLowerCase())
        expect(addPrimitiveEvent.args.rateAsset.toString(), "not the same rate asset").to.equal(polygonConfig.chainlink.aggregators[firstPrimitiveKey][1].toString())
    })

    describe("Assets Total Value", function () {
        beforeEach("add USDC as primitive", async function() {
            try {

                // Deploy a mock USDC
                const MockUSDC = await ethers.getContractFactory(contractsNames.USDC);
                const mockUSDCInstance = await MockUSDC.deploy();
                await mockUSDCInstance.deployed();
                this.mockUSDCInstance = mockUSDCInstance

                const aggregator = polygonConfig.chainlink.aggregators["usdc"];
                const primitive = polygonConfig.primitives["usdc"];

                const primitives = [mockUSDCInstance.address]
                const aggregators = [aggregator[0]]
                const rateAssets = [aggregator[1]]

                const tx = await this.valueInterpreterInstance.addPrimitives(primitives, aggregators, rateAssets)
                const reponse = await tx.wait()
            } catch (error) {
                console.error("error", error);
            }
        })

        it("can calculate the canonical Assets Total Value", async function() {
            const USDC = "0x2791bca1f2de4661ed88a30c99a7a9449aa84174"
            const baseAssets = [this.mockUSDCInstance.address]
            const amounts = [chain(100).multiply(10**6).done()]
            const response = await this.valueInterpreterInstance.callStatic.calcCanonicalAssetsTotalValue(baseAssets, amounts, this.mockUSDCInstance.address);
        
            expect(amounts[0], "can't get the canonical Assets Total Value").to.equal(response)
        })
    })
})