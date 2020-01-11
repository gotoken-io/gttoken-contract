const StdERC20 = artifacts.require("StdERC20");
const ERC20TokenBank = artifacts.require("ERC20TokenBank");
const ERC20TokenBankFactory = artifacts.require("ERC20TokenBankFactory");
const USDT = artifacts.require("USDT")

const MultiSigFactory = artifacts.require("MultiSigFactory");
const MultiSig = artifacts.require("MultiSig");
const TrustListFactory = artifacts.require("TrustListFactory");
const TrustList = artifacts.require("TrustList");

const { BN, constants, expectEvent, expectRevert  } = require('openzeppelin-test-helpers');
const { expect  } = require('chai');

const getEvents = ({ logs = []  }, event) => logs.filter(l => l.event === event)
const getEventAt = (receipt, event, index = 0) => getEvents(receipt, event)[index]
const getEventArgument = (receipt, event, arg, index = 0) => getEventAt(receipt, event, index).args[arg]


contract('ERC20 Token Bank', (accounts) =>{

  let multisig_factory = {}
  let multisig = {}
  let trustlist_factory = {}
  let trustlist = {}

  context('init', ()=>{
        it('init', async () => {
          multisig_factory = await MultiSigFactory.deployed();
          assert.ok(multisig_factory);
          tokentx = await multisig_factory.createMultiSig(accounts.slice(0, 3));
          multisig = await MultiSig.at(tokentx.logs[0].args.addr);

          trustlist_factory = await TrustListFactory.deployed();
          assert.ok(trustlist_factory);
          tokentx = await trustlist_factory.createTrustList(accounts.slice(3, 4), multisig.address);
          trustlist = await MultiSig.at(tokentx.logs[0].args.addr);

        })

  it('rds init ', async function() {
    rds = await StdERC20.deployed();

    amounts = ["5000", "5000", "5000"];

    await rds.issue(accounts[0], amounts[0]);
    await rds.issue(accounts[1], amounts[1]);
    await rds.issue(accounts[2], amounts[2]);
  })

  it("rds token bank", async function(){
    rds = await StdERC20.deployed();
    instance = await ERC20TokenBankFactory.deployed();

    tx = await instance.newERC20TokenBank("rds", rds.address, multisig.address, trustlist.address, {from:accounts[0]});

    //addr = getEventArgument(bank, "CreateERC20TokenBank", "addr");
    addr = tx.logs[0].args.addr;

    await rds.transfer(addr, 5000, {from:accounts[0]});
    bank_balance = (await rds.balanceOf(addr, {from:accounts[0]})).toNumber();
    expect(bank_balance).to.equal(5000);


    old_balance = (await rds.balanceOf(accounts[1])).toNumber();

    bank = await ERC20TokenBank.at(addr);
    await bank.transfer(1, accounts[1], 500, {from:accounts[0]});
    await bank.transfer(1, accounts[1], 500, {from:accounts[1]});
    new_balance = (await rds.balanceOf(accounts[1])).toNumber();
    expect(new_balance).to.equal(old_balance + 500);

    bank_balance = (await rds.balanceOf(addr, {from:accounts[0]})).toNumber();
    expect(bank_balance).to.equal(4500);

    await bank.issue(accounts[1], 4500, {from:accounts[3]});
    bank_balance = (await rds.balanceOf(addr, {from:accounts[0]})).toNumber();
    expect(bank_balance).to.equal(0);
  });

  it('usdt init ', async function() {
    rds = await USDT.deployed();

    amounts = ["5000", "5000", "5000"];

    await rds.issue(accounts[0], amounts[0]);
    await rds.issue(accounts[1], amounts[1]);
    await rds.issue(accounts[2], amounts[2]);
  });

  it("usdt token bank", async function(){
    rds = await USDT.deployed();
    instance = await ERC20TokenBankFactory.deployed();

    tx = await instance.newERC20TokenBank("usdt", rds.address, multisig.address, trustlist.address, {from:accounts[0]});

    //addr = getEventArgument(bank, "CreateTokenBank", "addr");
    addr = tx.logs[0].args.addr;

    await rds.transfer(addr, 500, {from:accounts[0]});
    bank_balance = (await rds.balanceOf(addr, {from:accounts[0]})).toNumber();
    expect(bank_balance).to.equal(500);


    old_balance = (await rds.balanceOf(accounts[1])).toNumber();

    bank = await ERC20TokenBank.at(addr);
    invoke_id = await multisig.get_unused_invoke_id("transfer", {from:accounts[0]});
    await bank.transfer(invoke_id, accounts[1], 500, {from:accounts[0]});
    await bank.transfer(invoke_id, accounts[1], 500, {from:accounts[1]});
    new_balance = (await rds.balanceOf(accounts[1])).toNumber();
    expect(new_balance).to.equal(old_balance + 500);
    bank_balance = (await rds.balanceOf(addr, {from:accounts[0]})).toNumber();
    expect(bank_balance).to.equal(0);
  });

  })

});
