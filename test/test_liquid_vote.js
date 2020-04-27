const { BN, constants, expectEvent, expectRevert  } = require('openzeppelin-test-helpers');
const { expect  } = require('chai');
const getBlockNumber = require('./blockNumber')(web3)

const LiquidDemocracyFactory = artifacts.require("LiquidDemocracyFactory");
const LiquidDemocracy = artifacts.require("LiquidDemocracy");
const SimpleLiquidVoteFactory = artifacts.require("SimpleLiquidVoteFactory");
const SimpleLiquidVote = artifacts.require("SimpleLiquidVote");

contract("SimpleLiquidVote", (accounts) =>{
  let vote_factory = {}
  let vote = {}
  let factory = {}
  let democracy = {}
  let option1 = {}
  let option2 = {}

  it("init", async function(){
    factory = await LiquidDemocracyFactory.deployed();
    assert.ok(factory);
    tokentx = await factory.createLiquidDemocracy({from:accounts[0]});
    democracy = await LiquidDemocracy.at(tokentx.logs[0].args.addr);
    assert.ok(democracy);

    vote_factory = await SimpleLiquidVoteFactory.deployed();
    assert.ok(vote_factory);
    tokentx = await vote_factory.createLiquidVote(democracy.address);
    vote = await SimpleLiquidVote.at(tokentx.logs[0].args.addr);
    assert.ok(vote);
    option1= "0x2a1acd26847576a128e3dba3aa984feafffdf81f7c7b23bdf51e7bec1c15944c";
    option2= "0x3a1acd26847576a128e3dba3aa984feafffdf81f7c7b23bdf51e7bec1c15944c";
  });

  it("add accounts, choice, and create delegation", async function(){

    democracy.setNoMajority(false, {from:accounts[0]});

    for(i = 0; i < 10; ++i){
      democracy.setWeight(accounts[i], i + 1, {from:accounts[0]});
      if(i >0){
        democracy.delegate(accounts[i], {from:accounts[i - 1]});
      }
    }

    vote.addChoice(option1, {from:accounts[0]});
    vote.addChoice(option2, {from:accounts[0]});

  });

  it("vote", async function() {
    await vote.voteChoice(option1, {from:accounts[9]});
    tx = await vote.getChoiceVoteNumber(option1);
    w = (tx.logs[0].args.number).toNumber();
    expect(w).to.equal(55);

    await vote.voteChoice(option1, {from:accounts[0]});
    tx = await vote.getChoiceVoteNumber(option1);
    w = (tx.logs[0].args.number).toNumber();
    expect(w).to.equal(55);

    await vote.voteChoice(option2, {from:accounts[5]});
    tx = await vote.getChoiceVoteNumber(option1);
    w = (tx.logs[0].args.number).toNumber();
    expect(w).to.equal(35);
    tx = await vote.getChoiceVoteNumber(option2);
    w = (tx.logs[0].args.number).toNumber();
    expect(w).to.equal(20);

    await vote.voteChoice(option2, {from:accounts[9]});
    tx = await vote.getChoiceVoteNumber(option2);
    w = (tx.logs[0].args.number).toNumber();
    expect(w).to.equal(54);
  });

  it("vote and then change delegate", async function(){
    await vote.voteChoice(option1, {from:accounts[9]});
    tx = await vote.getChoiceVoteNumber(option1);
    w = (tx.logs[0].args.number).toNumber();
    expect(w).to.equal(35);

    await democracy.undelegate({from:accounts[8]});
    await vote.voteChoice(option1, {from:accounts[9]});
    tx = await vote.getChoiceVoteNumber(option1);
    w = (tx.logs[0].args.number).toNumber();
    expect(w).to.equal(11);
  });
});


