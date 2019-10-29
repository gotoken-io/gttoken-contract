const { BN, constants, expectEvent, expectRevert  } = require('openzeppelin-test-helpers');
const { expect  } = require('chai');
const getBlockNumber = require('./blockNumber')(web3)
const GTToken = artifacts.require('GTToken')
const InitIssueAndLockFactory = artifacts.require("InitIssueAndLockFactory")
const InitIssueAndLock = artifacts.require('InitIssueAndLock')
const GTTokenFactory = artifacts.require("GTTokenFactory");

const MultiSigFactory = artifacts.require("MultiSigFactory");
const MultiSig = artifacts.require("MultiSig");
const TrustListFactory = artifacts.require("TrustListFactory");
const TrustList = artifacts.require("TrustList");

contract('InitIssueAndLockFactory', (accounts) =>{
  let gttoken = {}
  let init= {}
  let lock_until = {}

  context('init', ()=>{
    it("init", async() =>{
          multisig_factory = await MultiSigFactory.deployed();
          assert.ok(multisig_factory);
          tokentx = await multisig_factory.createMultiSig(accounts.slice(0, 3));
          multisig = await MultiSig.at(tokentx.logs[0].args.addr);
          assert.ok(multisig);

          trustlist_factory = await TrustListFactory.deployed();
          assert.ok(trustlist_factory);
          tokentx = await trustlist_factory.createTrustList([], multisig.address);
          trustlist = await TrustList.at(tokentx.logs[0].args.addr);
          assert.ok(trustlist);

      f = await GTTokenFactory.deployed();
      tokentx = await f.createCloneToken('0x0000000000000000000000000000000000000000', 0, "Test", 3, "tst", true, multisig.address, trustlist.address);
      gttoken = await GTToken.at(tokentx.logs[0].args._cloneToken);
      assert.ok(gttoken);


      block_until = (await getBlockNumber()) + 100;
      issue_factory = await InitIssueAndLockFactory.deployed();
      tx = await issue_factory.createIssueAndLock(gttoken.address,
          block_until,
          accounts.slice(8, 10),
          [12345, 67890],
          multisig.address);
      init = await InitIssueAndLock.at(tx.logs[0].args.addr);
      assert.ok(init);

      invoke_id = await multisig.get_unused_invoke_id("add_trusted", {from:accounts[0]});
      await trustlist.add_trusted(invoke_id, init.address, {from:accounts[1]});
      await trustlist.add_trusted(invoke_id, init.address, {from:accounts[0]});
  })
  })

  context('init_lock', ()=>{
      it('replace', async ()=>{
      invoke_id = await multisig.get_unused_invoke_id("replace", {from:accounts[0]});
        await init.replace(invoke_id, accounts[8], accounts[7], {from:accounts[0]})
        await init.replace(invoke_id, accounts[8], accounts[7], {from:accounts[1]})
      });
  }),

  context('init_lock', ()=>{
      it('issue fail', async() =>{
        await expectRevert(init.issue({from:accounts[0]}), "not ready to unlock")
      }),

      it('issue success', async() =>{

        cur_block = getBlockNumber();
        i = 0;
        while(i < 100){
          await gttoken.transfer(accounts[0], 0, {from:accounts[0]});
          i += 1;
        }
        a7 = (await gttoken.balanceOf(accounts[7], {from:accounts[0]})).toNumber();
        a9 = (await gttoken.balanceOf(accounts[9], {from:accounts[0]})).toNumber();

        console.log('a7 ', accounts[7], ' old: ', a7);
        await init.issue({from:accounts[0]});

        a7_new = (await gttoken.balanceOf(accounts[7], {from:accounts[0]})).toNumber();
        a9_new = (await gttoken.balanceOf(accounts[9], {from:accounts[0]})).toNumber();

        console.log('a7 new: ', a7_new);
        assert(a7 + 12345 == a7_new);
        assert(a9 + 67890 == a9_new);

        await expectRevert(init.issue({from:accounts[0]}), "issued already")

      });
    })

});
