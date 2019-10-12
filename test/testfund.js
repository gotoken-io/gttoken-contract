const { BN, constants, expectEvent, expectRevert  } = require('openzeppelin-test-helpers');
const { expect  } = require('chai');
const getBlockNumber = require('./blockNumber')(web3)

const USDT = artifacts.require("USDT")
const FundAndDistributeFactory = artifacts.require("FundAndDistributeFactory")

const GTToken = artifacts.require("GTToken");
const GTTokenFactory = artifacts.require("GTTokenFactory");
const FundAndDistributeBase = artifacts.require("FundAndDistributeBase");

contract('FundAndDistributeFactory', (accounts) => {
  let usdt = {}
  let gttoken = {}
  let fund = {}
  let factory = {}

  context('init', ()=>{
    it('init', async ()=>{
      usdt = await USDT.deployed();
      f = await GTTokenFactory.deployed();
      tokentx = await f.createCloneToken('0x0000000000000000000000000000000000000000', 0, "Test", 3, "tst", true, accounts.slice(0, 3));
      gttoken = await GTToken.at(tokentx.logs[0].args._cloneToken);

      factory = await FundAndDistributeFactory.deployed();
      ctx = await factory.createUSDTSytelERC20TokenIssuers(gttoken.address,
          "USDT for gt", "desc", usdt.address, accounts.slice(0, 3));
      fund = await FundAndDistributeBase.at(ctx.logs[0].args.addr);
      assert.ok(usdt);
      assert.ok(gttoken);
      assert.ok(fund);
      assert.ok(factory);

          invoke_id = await gttoken.get_unused_invoke_id("add_trusted_issuer", {from:accounts[0]});
          await gttoken.add_trusted_issuer(invoke_id, fund.address, {from:accounts[1]});
          await gttoken.add_trusted_issuer(invoke_id, fund.address, {from:accounts[0]});
    }),

    it('init usdt', async() =>{
      await usdt.issue(accounts[6], 300000000);
      await usdt.issue(accounts[8], 100000000);
      await usdt.issue(accounts[9], 200000000);
      await usdt.issue(accounts[7], 300000000);

      await usdt.approve(fund.address, 80000000, {from:accounts[8]});
      await usdt.approve(fund.address, 90000000, {from:accounts[9]});
      await usdt.approve(fund.address, 70000000, {from:accounts[7]});

      assert.equal(await usdt.balanceOf(accounts[8]), 100000000, 'accounts[8] balance should be 100000000')
      assert.equal(await usdt.balanceOf(accounts[9]), 200000000, 'accounts[9] balance should be 200000000')
      assert.equal(await usdt.balanceOf(accounts[7]), 300000000, 'accounts[7] balance should be 300000000')
    });

    it('test fund ', async() =>{
      await expectRevert(fund.fund(100, {from:accounts[7]}), "not a trusted issuer");
      invoke_id = await fund.get_unused_invoke_id("add_funders", {from:accounts[0]});
      await fund.add_funders(invoke_id, accounts.slice(7, 10), {from:accounts[0]});
      await fund.add_funders(invoke_id, accounts.slice(7, 10), {from:accounts[1]});

      await expectRevert(fund.fund(100, {from:accounts[6]}), "not a trusted issuer");

      await expectRevert.unspecified(fund.fund(100000000, {from:accounts[8]}));

      await fund.fund(80000000, {from:accounts[8]});
      assert.equal(await gttoken.balanceOf(accounts[8]), 80000, 'accounts[8] balance should be 8000');
      assert.equal(await gttoken.balanceOf(fund.address), 80000, 'fund balance should be 8000');
    });

    it('test distribute', async()=>{
      invoke_id = await fund.get_unused_invoke_id("distribute", {from:accounts[0]});
      await fund.distribute(invoke_id, accounts[5], 80000, {from:accounts[0]});
      await fund.distribute(invoke_id, accounts[5], 80000, {from:accounts[1]});

      assert.equal(await gttoken.balanceOf(fund.address), 0, 'fund balance should be 0');
      assert.equal(await gttoken.balanceOf(accounts[5]), 80000, 'accounts[8] balance should be 8000');
    });

    it('test exchange', async()=>{
      await gttoken.approve(fund.address, 80000, {from:accounts[5]});
      await fund.exchange(80000, {from:accounts[5]});


      assert.equal(await gttoken.balanceOf(fund.address), 0, 'fund balance should be 8000');
      assert.equal(await gttoken.balanceOf(accounts[5]), 0, 'accounts[5] balance should be 0');
      assert.equal(await usdt.balanceOf(accounts[5]), 40000000, 'accounts[5] balance should be 40000000')
    });
  })
})
