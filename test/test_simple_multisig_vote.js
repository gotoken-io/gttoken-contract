const { BN, constants, expectEvent, expectRevert  } = require('openzeppelin-test-helpers');
const { expect  } = require('chai');
const getBlockNumber = require('./blockNumber')(web3)

const MultiSigFactory = artifacts.require("MultiSigFactory");
const MultiSig = artifacts.require("MultiSig");
const MultiSigTools = artifacts.require("MultiSigTools");

const WeightMultiSigFactory = artifacts.require("WeightMultiSigFactory");
const WeightMultiSig = artifacts.require("WeightMultiSig");

const SimpleMultiSigVoteFactory = artifacts.require("SimpleMultiSigVoteFactory");
const SimpleMultiSigVote = artifacts.require("SimpleMultiSigVote");

contract('SimpleMultiSigVote', (accounts) =>{
  let multisig_factory = {}

  let multisig = {}

  let wmultisig_factory = {}

  let wmultisig = {}
  let instance = {}
  context('with MultiSig', ()=>{
    it("init", async() =>{
          multisig_factory = await MultiSigFactory.deployed();
          assert.ok(multisig_factory);
          tokentx = await multisig_factory.createMultiSig(accounts.slice(0, 5));
          multisig = await MultiSig.at(tokentx.logs[0].args.addr);
          assert.ok(multisig);

      up_factory = await SimpleMultiSigVoteFactory.deployed();
      tx = await up_factory.createSimpleMultiSigVote(multisig.address);
      instance = await SimpleMultiSigVote.at(tx.logs[0].args.addr);
      assert.ok(instance);
    })

    it("create/chage vote", async() =>{
      hash = web3.utils.keccak256("test1");
      block_until = (await getBlockNumber()) + 100;
      await expectRevert(instance.createVote(hash, 0, block_until-100),
        "end height too small");
      await expectRevert(instance.createVote(hash, block_until, block_until - 1),
        "end height should be greater than start height");

      await instance.createVote(hash, 0, block_until, {from:accounts[8]});
      await expectRevert(instance.createVote(hash, 0, block_until), "already exist");

      const {determined:d1, vote_id:v1, start_height:s1,
        end_height:e1, owner:owner1, announcement:ann1, value: value1} = await instance.voteInfo(hash);
      expect(d1 == false);
      expect(v1 == 1);
      expect(s1 != 0);
      expect(e1 == block_until);
      expect(owner1 == accounts[8]);
      expect(value1 == "");
      expect(ann1== "");


      await expectRevert(instance.changeVoteInfo(hash, 0, block_until + 100, "xtest", {from:accounts[6]}), "only creator can change vote info")
      await expectRevert(instance.changeVoteInfo(hash, 0, block_until + 100, "xtest", {from:accounts[8]}), "already start, cannot change start height");
    })

    let start_height = 0;
    it("create/chage vote", async() =>{
      hash = web3.utils.keccak256("test");
      block_until = (await getBlockNumber()) + 100;
      await expectRevert(instance.createVote(hash, 0, block_until-100),
        "end height too small");
      await expectRevert(instance.createVote(hash, block_until, block_until - 1),
        "end height should be greater than start height");

      start_height = block_until;
      await instance.createVote(hash, block_until , block_until + 100, {from:accounts[8]});
      await expectRevert(instance.createVote(hash, 0, block_until), "already exist");

      const {determined:d1, start_height:s1,
        end_height:e1, owner:owner1, announcement:ann1, value: value1} = await instance.voteInfo(hash);
      expect(d1 == false);
      expect(s1 != 0);
      expect(e1 == block_until);
      expect(owner1 == accounts[8]);
      expect(value1 == "");
      expect(ann1== "");


      await instance.changeVoteInfo(hash, 0, block_until + 101, "xtest", {from:accounts[8]});
      const {determined:d2, start_height:s2,
        end_height:e2, owner:owner2, announcement:ann2, value:value2}= await instance.voteInfo(hash);

      expect(d2 == false);
      expect(s1 == s2);
      expect(e2 == block_until + 100);
      expect(owner2 == accounts[8]);
      expect(value2 == "");
      expect(ann2== "xtest");
    })

    it("vote status", async() =>{
      hash = web3.utils.keccak256("test");
      e = await instance.isVoteDetermined(hash);
      expect(!e);
      await expectRevert(instance.checkVoteValue(hash), "not determined");
      hash = web3.utils.keccak256("test2");
      await expectRevert(instance.checkVoteValue(hash), "not exist");
    })

    it("vote", async() =>{
      hash = web3.utils.keccak256("test");
      invoke_id = await multisig.get_unused_invoke_id("vote", {from:accounts[0]});
      await instance.vote(invoke_id, hash, "yes", {from:accounts[0]});
      await instance.vote(invoke_id, hash, "yes", {from:accounts[1]});
      await expectRevert(instance.vote(invoke_id, hash, "yes", {from:accounts[2]}), "vote not start yet");
      block_until = await getBlockNumber() ;
      while(block_until < start_height){
        invoke_id = await multisig.get_unused_invoke_id("vote", {from:accounts[0]});
        await instance.vote(invoke_id, hash, "yes", {from:accounts[0]});

        block_until = await getBlockNumber() ;
      }

      invoke_id = await multisig.get_unused_invoke_id("vote", {from:accounts[0]});
      await instance.vote(invoke_id, hash, "yes", {from:accounts[0]});
      await instance.vote(invoke_id, hash, "yes", {from:accounts[1]});
    })

    it("vote status after vote ", async() =>{
      hash = web3.utils.keccak256("test");
      e = await instance.isVoteDetermined(hash);
      expect(!e);
      await expectRevert(instance.checkVoteValue(hash), "not determined");
      hash = web3.utils.keccak256("test2");
      await expectRevert(instance.checkVoteValue(hash), "not exist");
    })

    it("vote again", async() =>{
      hash = web3.utils.keccak256("test");
      invoke_id = await multisig.get_unused_invoke_id("vote", {from:accounts[0]});
      await instance.vote(invoke_id, hash, "yes", {from:accounts[0]});
      await instance.vote(invoke_id, hash, "yes", {from:accounts[1]});
      await instance.vote(invoke_id, hash, "yes", {from:accounts[2]});
      await instance.vote(invoke_id, hash, "yes", {from:accounts[3]});
      await instance.vote(invoke_id, hash, "yes", {from:accounts[4]});

      e = await instance.isVoteDetermined(hash);
      expect(e);
      v = await instance.checkVoteValue(hash);
      expect(v == "yes");
    })

    it("vote revert", async() =>{
      hash = web3.utils.keccak256("test");
      invoke_id = await multisig.get_unused_invoke_id("vote", {from:accounts[0]});
      await expectRevert(instance.vote(invoke_id, hash, "yes", {from:accounts[5]}), "only a signer can call in MultiSigTools");
    })

  })

  context('with WeightMultiSig', ()=>{
    it("init", async() =>{
          wmultisig_factory = await WeightMultiSigFactory.deployed();
          assert.ok(wmultisig_factory);
          tokentx = await wmultisig_factory.createWeightMultiSig(accounts.slice(0, 5), [12, 3, 29, 1, 12]);
          wmultisig = await WeightMultiSig.at(tokentx.logs[0].args.addr);
          assert.ok(wmultisig);

      up_factory = await SimpleMultiSigVoteFactory.deployed();
      tx = await up_factory.createSimpleMultiSigVote(wmultisig.address);
      instance = await SimpleMultiSigVote.at(tx.logs[0].args.addr);
      assert.ok(instance);
    })

    it("create/chage vote", async() =>{
      hash = web3.utils.keccak256("test1");
      block_until = (await getBlockNumber()) + 100;
      await expectRevert(instance.createVote(hash, 0, block_until-100),
        "end height too small");
      await expectRevert(instance.createVote(hash, block_until, block_until - 1),
        "end height should be greater than start height");

      await instance.createVote(hash, 0, block_until, {from:accounts[8]});
      await expectRevert(instance.createVote(hash, 0, block_until), "already exist");

      const {determined:d1, vote_id:v1, start_height:s1,
        end_height:e1, owner:owner1, announcement:ann1, value: value1} = await instance.voteInfo(hash);
      expect(d1 == false);
      expect(v1 == 1);
      expect(s1 != 0);
      expect(e1 == block_until);
      expect(owner1 == accounts[8]);
      expect(value1 == "");
      expect(ann1== "");


      await expectRevert(instance.changeVoteInfo(hash, 0, block_until + 100, "xtest", {from:accounts[6]}), "only creator can change vote info")
      await expectRevert(instance.changeVoteInfo(hash, 0, block_until + 100, "xtest", {from:accounts[8]}), "already start, cannot change start height");
    })

    let start_height = 0;
    it("create/chage vote", async() =>{
      hash = web3.utils.keccak256("test");
      block_until = (await getBlockNumber()) + 100;
      await expectRevert(instance.createVote(hash, 0, block_until-100),
        "end height too small");
      await expectRevert(instance.createVote(hash, block_until, block_until - 1),
        "end height should be greater than start height");

      start_height = block_until;
      await instance.createVote(hash, block_until , block_until + 100, {from:accounts[8]});
      await expectRevert(instance.createVote(hash, 0, block_until), "already exist");

      const {determined:d1, start_height:s1,
        end_height:e1, owner:owner1, announcement:ann1, value: value1} = await instance.voteInfo(hash);
      expect(d1 == false);
      expect(s1 != 0);
      expect(e1 == block_until);
      expect(owner1 == accounts[8]);
      expect(value1 == "");
      expect(ann1== "");


      await instance.changeVoteInfo(hash, 0, block_until + 101, "xtest", {from:accounts[8]});
      const {determined:d2, start_height:s2,
        end_height:e2, owner:owner2, announcement:ann2, value:value2}= await instance.voteInfo(hash);

      expect(d2 == false);
      expect(s1 == s2);
      expect(e2 == block_until + 100);
      expect(owner2 == accounts[8]);
      expect(value2 == "");
      expect(ann2== "xtest");
    })

    it("vote status", async() =>{
      hash = web3.utils.keccak256("test");
      e = await instance.isVoteDetermined(hash);
      expect(!e);
      await expectRevert(instance.checkVoteValue(hash), "not determined");
      hash = web3.utils.keccak256("test2");
      await expectRevert(instance.checkVoteValue(hash), "not exist");
    })

    it("vote with 4, yet still not enough", async() =>{
      hash = web3.utils.keccak256("test");
      invoke_id = await wmultisig.get_unused_invoke_id("vote", {from:accounts[0]});
      await instance.vote(invoke_id, hash, "yes", {from:accounts[0]});
      await instance.vote(invoke_id, hash, "yes", {from:accounts[1]});
      await expectRevert(instance.vote(invoke_id, hash, "yes", {from:accounts[2]}), "vote not start yet");
      block_until = await getBlockNumber() ;
      while(block_until < start_height){
        invoke_id = await wmultisig.get_unused_invoke_id("vote", {from:accounts[0]});
        await instance.vote(invoke_id, hash, "yes", {from:accounts[0]});

        block_until = await getBlockNumber() ;
      }

      invoke_id = await wmultisig.get_unused_invoke_id("vote", {from:accounts[0]});
      await instance.vote(invoke_id, hash, "yes", {from:accounts[0]});
      await instance.vote(invoke_id, hash, "yes", {from:accounts[1]});
      await instance.vote(invoke_id, hash, "yes", {from:accounts[3]});
      await instance.vote(invoke_id, hash, "yes", {from:accounts[4]});
    })

    it("vote status after vote ", async() =>{
      hash = web3.utils.keccak256("test");
      e = await instance.isVoteDetermined(hash);
      expect(!e);
      await expectRevert(instance.checkVoteValue(hash), "not determined");
      hash = web3.utils.keccak256("test2");
      await expectRevert(instance.checkVoteValue(hash), "not exist");
    })

    it("vote again with 1, yet enough", async() =>{
      hash = web3.utils.keccak256("test");
      invoke_id = await wmultisig.get_unused_invoke_id("vote", {from:accounts[0]});
      await instance.vote(invoke_id, hash, "yes", {from:accounts[2]});

      e = await instance.isVoteDetermined(hash);
      expect(e);
      v = await instance.checkVoteValue(hash);
      expect(v == "yes");
    })

    it("vote revert", async() =>{
      hash = web3.utils.keccak256("test");
      invoke_id = await wmultisig.get_unused_invoke_id("vote", {from:accounts[0]});
      await expectRevert(instance.vote(invoke_id, hash, "yes", {from:accounts[5]}), "only a signer can call in MultiSigTools");
    })

  })
});
