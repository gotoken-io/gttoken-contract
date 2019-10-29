const { BN, constants, expectEvent, expectRevert  } = require('openzeppelin-test-helpers');
const { expect  } = require('chai');
const getBlockNumber = require('./blockNumber')(web3)

const MultiSigFactory = artifacts.require("MultiSigFactory");
const MultiSig = artifacts.require("MultiSig");
const MultiSigTools = artifacts.require("MultiSigTools");


contract('InitIssueAndLockFactory', (accounts) =>{

  let multisig_factory = {}

  let multisig = {}
  let ms_tool = {}

  context('init', ()=>{
    it("init", async() =>{
          multisig_factory = await MultiSigFactory.deployed();
          assert.ok(multisig_factory);
          tokentx = await multisig_factory.createMultiSig(accounts.slice(0, 3));
          multisig = await MultiSig.at(tokentx.logs[0].args.addr);
          assert.ok(multisig);

          ms_tool = await MultiSigTools.new(multisig.address);

    })
      it('transfer', async ()=>{
          tokentx = await multisig_factory.createMultiSig(accounts.slice(5, 8));
          new_multisig = await MultiSig.at(tokentx.logs[0].args.addr);
          assert.ok(new_multisig);

        invoke_id = await multisig.get_unused_invoke_id("transfer_multisig", {from:accounts[0]});
        await ms_tool.transfer_multisig(invoke_id, new_multisig.address, {from:accounts[0]});
        await ms_tool.transfer_multisig(invoke_id, new_multisig.address, {from:accounts[1]});

        await expectRevert(ms_tool.transfer_multisig(invoke_id, new_multisig.address, {from:accounts[1]}), "only a signer can call in MultiSigTools");
      });
  })


});
