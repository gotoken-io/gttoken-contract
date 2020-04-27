const { BN, constants, expectEvent, expectRevert  } = require('openzeppelin-test-helpers');
const { expect  } = require('chai');
const getBlockNumber = require('./blockNumber')(web3)

const LiquidDemocracyFactory = artifacts.require("LiquidDemocracyFactory");
const LiquidDemocracy = artifacts.require("LiquidDemocracy");

contract('LiquidDemocracy', (accounts)=>{
  let factory = {}
  let democracy = {}

  it("init", async() =>{
    factory = await LiquidDemocracyFactory.deployed();
    assert.ok(factory);
    tokentx = await factory.createLiquidDemocracy({from:accounts[0]});
    democracy = await LiquidDemocracy.at(tokentx.logs[0].args.addr);
    assert.ok(democracy);
  });

  it("transfer", async function(){
    await expectRevert(democracy.transferOwner(accounts[1], {from:accounts[1]}),
      "only owner can call this");
    await democracy.transferOwner(accounts[1], {from:accounts[0]});
  });
    it("set weight", async function(){
      await expectRevert(democracy.setWeight(accounts[1], 1, {from:accounts[0]}),
      "only owner can call this");

      await expectRevert(democracy.setWeight(accounts[1], 0, {from:accounts[1]}),
      "invalid weight");

      await democracy.setWeight(accounts[0], 1, {from:accounts[1]});
      await democracy.setWeight(accounts[1], 1, {from:accounts[1]});
      await democracy.setWeight(accounts[2], 1, {from:accounts[1]});
      await democracy.setWeight(accounts[3], 1, {from:accounts[1]});
      await democracy.setWeight(accounts[4], 1, {from:accounts[1]});

      w = (await democracy.getWeight(accounts[0], {from:accounts[1]})).toNumber();
      expect(w).to.equal(1);

      w = (await democracy.getWeight(accounts[5], {from:accounts[0]})).toNumber();
      expect(w).to.equal(0);

      w = (await democracy.getTotalPower(accounts[0], {from:accounts[0]})).toNumber();
      expect(w).to.equal(5);
    });

  it("delegate/undelegate", async function(){

    await expectRevert(democracy.delegate(accounts[0], {from:accounts[0]}),
      "cannot be self");
    await expectRevert(democracy.delegate(accounts[6], {from:accounts[0]}),
      "no _to");

    await expectRevert(democracy.delegate(accounts[0], {from:accounts[6]}),
      "no sender");

    await democracy.delegate(accounts[1], {from:accounts[0]});
    w = (await democracy.getVoterTotalPower(accounts[1])).toNumber();
    expect(w).to.equal(2);

    await expectRevert(democracy.delegate(accounts[2], {from:accounts[1]}),
      'this delegate causes a majority, call getFinalDelegator(...) to know the potential majority');
    //await democracy.delegate(accounts[2], {from:accounts[1]});

    await democracy.delegate(accounts[4], {from:accounts[3]});

    await democracy.undelegate({from:accounts[3]});

    d1 = await democracy.getDelegator(accounts[3]);
    expect(d1).to.equal('0x0000000000000000000000000000000000000000');
  });

    it("delegate with circle", async function(){
    await expectRevert(democracy.delegate(accounts[0], {from:accounts[1]}),
      "cannot have delegate circle");
    });

  it("remove", async function(){
      await democracy.setWeight(accounts[5], 1, {from:accounts[1]});
      await democracy.setWeight(accounts[6], 1, {from:accounts[1]});
      await democracy.setWeight(accounts[7], 1, {from:accounts[1]});
      await democracy.setWeight(accounts[8], 1, {from:accounts[1]});

    await democracy.delegate(accounts[4], {from:accounts[3]});
    await democracy.delegate(accounts[4], {from:accounts[6]});
    await democracy.delegate(accounts[6], {from:accounts[7]});

    d2 = await democracy.getFinalDelegator(accounts[7], {from:accounts[0]})
    expect(d2).to.equal(accounts[4])

    await democracy.removeVoter(accounts[4], {from:accounts[1]});
    d2 = await democracy.getFinalDelegator(accounts[7], {from:accounts[0]})
    expect(d2).to.equal(accounts[6])

    await democracy.removeVoter(accounts[7], {from:accounts[1]});

    await democracy.removeVoter(accounts[4], {from:accounts[1]});
    await democracy.removeVoter(accounts[0], {from:accounts[1]});
  });
})
