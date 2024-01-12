const { ethers } = require("hardhat");
const { expect, assert } = require("chai");
const { chain } = require("mathjs");
const { contractsNames, swapToken } = require("./utils");
const polygonConfig = require("../scripts/config/Polygon");

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
const protocolDeposifFee = 30
const protocolManagementFees = 40

const MAX_BPS = 10000

// SUM to manipulate
const sumToInvest = 100000000; // 100 USDC
const sumToAllow = 100000000; // 100 USDC
const sharesToMint = "1000000000000000000"; // 1 share
const sumToTransfert = 50000000; // 50 USDT


function add(arg1, arg2) {
    var sum = "";
    var r = 0;
    var a1, a2, i;
  
    // Pick the shortest string as first parameter and the longest as second parameter in my algorithm
    if (arg1.length < arg2.length) {
      a1 = arg1;
      a2 = arg2;
    } else {
      a1 = arg2;
      a2 = arg1;
    }
    a1 = a1.split("").reverse();
    a2 = a2.split("").reverse();
  
    // Sum a1 and a2 digits
    for (i = 0; i < a2.length; i++) {
      var t = (i < a1.length ? parseInt(a1[i]) : 0) + parseInt(a2[i]) + r;
  
      sum += t % 10;
  
      r = t < 10 ? 0 : Math.floor(t / 10);
    }
    // Append the last remain
    if (r > 0) sum += r;
  
    sum = sum.split("").reverse();
  
    // Trim the leading "0"
    // eslint-disable-next-line eqeqeq
    while (sum[0] == "0") sum.shift();
  
    return sum.length > 0 ? sum.join("") : "0";
  }
describe("Fund Logic", function() {

  beforeEach("init global variables and states", async function() {
    const [owner, investor, investor2] = await ethers.getSigners();

    const provider = ethers.getDefaultProvider("matic")
  
    // Deploy a mock USDC
    const MockUSDC = await ethers.getContractFactory(contractsNames.USDC);
    const mockUSDCInstance = await MockUSDC.deploy();
    await mockUSDCInstance.deployed();
  
    // Deploy a mock USDT
    const MockUSDT = await ethers.getContractFactory(contractsNames.USDC);
    const mockUSDTInstance = await MockUSDT.deploy();
    await mockUSDTInstance.deployed();
  
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
    const newProxyTx = await fundFactoryInstance.createFund(
      protocolDeposifFee,
      protocolManagementFees,
      "test",
      "TST",
      0,
      false,
      false
    );
    const proxy = await newProxyTx.wait();
  
    // Get the event for the deploy of the fund proxy
    const events = proxy.events.filter(event => event.event && event.event === "FundProxyDeployed")
    const deployEvent = events.length > 0 ? events[0]: null
  
    // attach the proxy to the corresponding abi
    const proxyAddress = deployEvent.args.tokenProxy;
    const fundProxied = fundLogicInstance.attach(proxyAddress);
  
    mockUSDCInstance.connect(investor).mint(10 ** 15);
    mockUSDCInstance.connect(investor2).mint(10 ** 15);
    mockUSDTInstance.connect(investor).mint(10 ** 15);
    mockUSDTInstance.connect(investor2).mint(10 ** 15);
  
    this.owner = owner
    this.investor = investor
    this.investor2 = investor2
    this.mockUSDCInstance = mockUSDCInstance
    this.mockUSDTInstance = mockUSDTInstance
    this.fundFactoryInstance = fundFactoryInstance
    this.fundLogicInstance = fundLogicInstance
    this.fundProxied = fundProxied
    this.valueInterpreterInstance = valueInterpreterInstance
    this.provider = provider
  })

  describe("mint shares", function() {
    it("can mint shares of the fund", async function () {
        // ask to USDC to approve the transfert between the user account to the fund
        await this.mockUSDCInstance
            .connect(this.investor)
            .approve(this.fundProxied.address, sumToAllow);

        // mint the shares of the fund
        const MintTx = await this.fundProxied
            .connect(this.investor)
            .investInFund(sumToInvest);
        await MintTx.wait();

        const sharesTotalSupply = await this.fundProxied.totalSupply();

        const Sharesbalance = await this.fundProxied.balanceOf(
            this.investor.address
        );

        expect(sharesTotalSupply.toString(), "shares' supply").to.equal((sharesToMint).toString());
        expect(Sharesbalance.toString(), "balance of shares").to.equal(sharesToMint.toString());
    });
      
    it("can mint shares again of the fund", async function () {
        /**
         * FIRST TRANSACTION
        */
        // ask to USDC to approve the transfert between the user account to the fund
        await this.mockUSDCInstance
            .connect(this.investor)
            .approve(this.fundProxied.address, sumToAllow);

        // mint the shares of the fund
        const MintTx = await this.fundProxied
            .connect(this.investor)
            .investInFund(sumToInvest);
        await MintTx.wait();

        const sharesTotalSupplyOld = await this.fundProxied.totalSupply();
      
        /**
         * SECOND TRANSACTION
         */
        // ask to USDC to approve the transfert between the user account to the fund
        await this.mockUSDCInstance
            .connect(this.investor2)
            .approve(this.fundProxied.address, sumToAllow);

        // mint the shares of the fund
        const MintTx2 = await this.fundProxied
            .connect(this.investor2)
            .investInFund(sumToInvest);
        await MintTx2.wait();

        const sharesTotalSupply = await this.fundProxied.totalSupply();

        const Sharesbalance = await this.fundProxied.balanceOf(
            this.investor2.address
        );

        const calcNewSharesTotalSupply = chain(sharesTotalSupplyOld.toString()).add(sharesToMint).divide("1000000000000000000").done()
        const sharesTotalSupplyUnit = chain(sharesTotalSupply.toString()).divide(sharesToMint).done()

        expect(sharesTotalSupplyUnit, "shares's supply").to.be.above(calcNewSharesTotalSupply);
        expect(Sharesbalance, "balance of shares").to.above(sharesToMint);
    });
  });
    
  describe("redeem investment", () => {
    beforeEach("Mint shares before withdrawing them", async function () {
        await this.mockUSDCInstance
            .connect(this.investor)
            .approve(this.fundProxied.address, sumToAllow);
        const MintTx1 = await this.fundProxied
            .connect(this.investor)
            .investInFund(sumToInvest);
        await MintTx1.wait();
    });
  
    it("can withdraw shares of the fund", async function () {
        const sharesToRedeem = "1000000000000000000"; // 1 share

        // wait a little to increase the fee
        await ethers.provider.send("evm_increaseTime", [ONE_WEEK_IN_SECONDS]);
        await ethers.provider.send("evm_mine");
  
        const oldShareForInvestor = await this.fundProxied.balanceOf(this.investor.address)

          // redeem USDC
        const MintTx = await this.fundProxied
            .connect(this.investor)
            .redeemSharesInTokens(sharesToRedeem);
        const receipt = await MintTx.wait();

        const event = receipt.events.find(event => event.event === "InvestmentRedeemedInTokens");

        const newShareForInvestor = await this.fundProxied.balanceOf(this.investor.address)

        expect(event, "InvestmentRedeemedInTokens event was not emitted").to.exists;
        expect(parseInt(newShareForInvestor) < parseInt(oldShareForInvestor), "the investor has more share after redeeming his shares").to.equal(true)
    });
  
    it("charges managment fee for the fund owner when withdrawn shares", async function () {
        const sharesToRedeem = "1000000000000000000"; // 1 share
  
          // Get old balances and supply
        const oldSharesBalance = await this.fundProxied.totalSupply();
        const oldShareOwner = await this.fundProxied.balanceOf(this.owner.address)
  
          // wait a little to increase the fee
        await ethers.provider.send("evm_increaseTime", [ONE_WEEK_IN_SECONDS]);
        await ethers.provider.send("evm_mine");
  
          // redeem USDC
        const MintTx = await this.fundProxied
            .connect(this.investor)
            .redeemSharesInTokens(sharesToRedeem);
        await MintTx.wait();
  
  
          // Get new balances and supply
        const newSharesBalance = await this.fundProxied.totalSupply();
        const newShareOwner = await this.fundProxied.balanceOf(this.owner.address)
  
        expect(parseInt(newSharesBalance))
          .to.be.below(parseInt(oldSharesBalance), "above expected balance")
          .and.to.be.at.least(0, "balance below 0");
        expect(newShareOwner > oldShareOwner, "the owner has less shares").to.equal(true)
    });
  
    it("charges managment fee for the protocol when withdrawn shares", async function () {
        const sharesToRedeem = "1000000000000000000"; // 1 share
        const feeBpsForProtocol = await this.fundProxied.getFeeBpsProtocol();

        // Transfer to fund USDT
        const transferTx = await this.mockUSDTInstance.connect(this.investor).transfer(this.fundProxied.address, sumToTransfert)
        
        // Add USDT to tracked assets
        const addTx = await this.fundProxied.addTrackedAssets([this.mockUSDTInstance.address])
        await addTx.wait()
        
          // Get old balances and supply
        const oldUSDCBalanceFund = await this.mockUSDCInstance.balanceOf(
            this.fundProxied.address
        );
        const oldUSDCBalanceProtocol = await this.mockUSDCInstance.balanceOf(
            this.fundFactoryInstance.address
        );
        const oldUSDTBalanceFund = await this.mockUSDTInstance.balanceOf(
            this.fundProxied.address
        );
        const oldUSDTBalanceProtocol = await this.mockUSDTInstance.balanceOf(
            this.fundFactoryInstance.address
        );
  
          // wait a little to increase the fee
        await ethers.provider.send("evm_increaseTime", [ONE_WEEK_IN_SECONDS]);
        await ethers.provider.send("evm_mine");
  
          // redeem USDC
        const MintTx = await this.fundProxied
            .connect(this.investor)
            .redeemSharesInTokens(sharesToRedeem);
        await MintTx.wait();
  
        // Calculate management fee for the protocol
        const managementFeeProtocolUSDC = parseInt(
          (oldUSDCBalanceFund * feeBpsForProtocol * ONE_WEEK_IN_SECONDS) /
            ONE_YEAR_IN_SECONDS /
            MAX_BPS
        );
        const managementFeeProtocolUSDT = parseInt(
            (oldUSDTBalanceFund * feeBpsForProtocol * ONE_WEEK_IN_SECONDS) /
              ONE_YEAR_IN_SECONDS /
              MAX_BPS
        );
  
        const newUSDCBalanceProtocol = await this.mockUSDCInstance.balanceOf(
            this.fundFactoryInstance.address
        );
        const newUSDTBalanceProtocol = await this.mockUSDTInstance.balanceOf(
            this.fundFactoryInstance.address
        );
  
          // Old Owner's balance of USDC + management fee
        const calcNewUSDCBalanceProtocol = add(
          oldUSDCBalanceProtocol.toString(),
          managementFeeProtocolUSDC.toString()
        );
        const calcNewUSDTBalanceProtocol = add(
            oldUSDCBalanceProtocol.toString(),
            managementFeeProtocolUSDT.toString()
        );

        expect(newUSDCBalanceProtocol, "the new USDC balance of the protocole is below the old one").to.be.above(oldUSDCBalanceProtocol)
        expect(calcNewUSDCBalanceProtocol.toString(), "new USDC balance of protocol is to low").to.equal(
          newUSDCBalanceProtocol.toString()
        );
        expect(newUSDTBalanceProtocol, "the new USDT balance of the protocole is below the old one").to.be.above(oldUSDTBalanceProtocol)
        expect(calcNewUSDTBalanceProtocol.toString(), "new USDT balance of protocol is to low").to.equal(
          newUSDTBalanceProtocol.toString()
        );
    });
  })

  describe("fund gav is correct", function () {
    beforeEach("init ValueInterpreter", async function () {
      // add addPrimitives
      const aggregator = polygonConfig.chainlink.aggregators["usdc"];
      // const primitive = polygonConfig.primitives["usdc"];
      const primitive = this.mockUSDCInstance.address

      const primitives = [primitive]
      const aggregators = [aggregator[0]]
      const rateAssets = [aggregator[1]]

      const tx = await this.valueInterpreterInstance.addPrimitives(primitives, aggregators, rateAssets)
      await tx.wait()
    })

    it("can calc Gav of fund after one investment", async function () {
      // ask to USDC to approve the transfert between the user account to the fund
      await this.mockUSDCInstance
          .connect(this.investor)
          .approve(this.fundProxied.address, sumToAllow);

      // mint the shares of the fund
      const MintTx = await this.fundProxied
          .connect(this.investor)
          .investInFund(sumToInvest);
      await MintTx.wait();

      // Check gav
      const gav = await this.fundProxied.callStatic.calcGav()
      const sumToInvestMinusFees = chain(sumToInvest).multiply(chain(MAX_BPS).subtract(protocolDeposifFee).done()).divide(MAX_BPS).done()

      expect(gav.toString()).to.equal(sumToInvestMinusFees.toString())
    })

    it("can calc Gav of fund after two investment", async function () {
      /** FIRST INVESTMENT */
      // ask to USDC to approve the transfert between the user account to the fund
      await this.mockUSDCInstance
          .connect(this.investor)
          .approve(this.fundProxied.address, sumToAllow);

      // mint the shares of the fund
      const MintTx = await this.fundProxied
          .connect(this.investor)
          .investInFund(sumToInvest);
      await MintTx.wait();

      /** SECOND INVESTMENT */
      // ask to USDC to approve the transfert between the user account to the fund
      await this.mockUSDCInstance
          .connect(this.investor)
          .approve(this.fundProxied.address, sumToAllow);

      // mint the shares of the fund
      const MintTx2 = await this.fundProxied
          .connect(this.investor)
          .investInFund(sumToInvest);
      const mint2 = await MintTx2.wait();

      // Check gav
      const gav = await this.fundProxied.callStatic.calcGav()
      const sumToInvestMinusFees = chain(sumToInvest).multiply(chain(MAX_BPS).subtract(protocolDeposifFee).done()).divide(MAX_BPS).multiply(2).done()

      expect(gav.toString()).to.equal(sumToInvestMinusFees.toString())
    })


    it("can calc Gav of fund after sending matic", async function () {
      // ask to USDC to approve the transfert between the user account to the fund
      await this.mockUSDCInstance
          .connect(this.investor)
          .approve(this.fundProxied.address, sumToAllow);

      // mint the shares of the fund
      const MintTx = await this.fundProxied
          .connect(this.investor)
          .investInFund(sumToInvest);
      await MintTx.wait();

      // Add addPrimitives/aggregator for USDT
      const aggregator = polygonConfig.chainlink.aggregators["usdt"];
      // const primitive = polygonConfig.primitives["usdc"];
      const primitive = this.mockUSDTInstance.address

      const primitives = [primitive]
      const aggregators = [aggregator[0]]
      const rateAssets = [aggregator[1]]

      const tx = await this.valueInterpreterInstance.addPrimitives(primitives, aggregators, rateAssets)
      await tx.wait()
      
      // Transfer to fund USDT
      const transferTx = await this.mockUSDTInstance.connect(this.investor).transfer(this.fundProxied.address, sumToTransfert)

      // Add USDT to tracked assets
      const addTx = await this.fundProxied.addTrackedAssets([this.mockUSDTInstance.address])
      await addTx.wait()

      // Get GAV from fund
      const gav = await this.fundProxied.callStatic.calcGav()

      // Calc total of tokens after fees
      const totalWithFees = chain(chain(sumToInvest).add(sumToTransfert).done()).multiply(chain(MAX_BPS).subtract(protocolDeposifFee).done()).divide(MAX_BPS).done()
      // +/- 1%
      const totalBellow = chain(totalWithFees).multiply(101).divide(100).done()
      const totelAbove = chain(totalWithFees).multiply(99).divide(100).done()

      // expect(gav.toString()).to.equal(sumToInvestMinusFees.toString())
      expect(parseInt(gav), "the GAV is not good")
        .to.be.above(parseInt(totelAbove), "the GAV is below the expected minimum")
        .and.to.be.below(parseInt(totalBellow), "the GAV is above the expected maximum")
    })
  })
})