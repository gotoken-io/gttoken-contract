const { BN, constants, expectEvent, expectRevert  } = require('openzeppelin-test-helpers');
const { expect  } = require('chai');
const getBlockNumber = require('./blockNumber')(web3)

const LiquidMultiSigFactory = artifacts.require("LiquidMultiSigFactory");
const LiquidMultiSig = artifacts.require("LiquidMultiSig");
const LiquidDemocracyFactory = artifacts.require("LiquidDemocracyFactory");
const LiquidDemocracy = artifacts.require("LiquidDemocracy");
const SimpleLiquidVoteFactory = artifacts.require("SimpleLiquidVoteFactory");

contract('LiquidMultiSig', (accounts) => {
  let multisig_factory = {}

  let multisig = {}
  let democracy = {}
  let instance = {}

    it("init", async() =>{
      multisig_factory = await LiquidMultiSigFactory.deployed();
      assert.ok(multisig_factory);
      delegate_factory = await LiquidDemocracyFactory.deployed();
      vote_factory = await SimpleLiquidVoteFactory.deployed();

      tokentx = await multisig_factory.createMultiSig(accounts.slice(0, 5), delegate_factory.address, vote_factory.address);
      multisig = await LiquidMultiSig.at(tokentx.logs[0].args.addr);
      assert.ok(multisig);
      democracy = await LiquidDemocracy.at(await multisig.liquid_delegate());
      assert.ok(democracy);
      instance = multisig;
    });
});
