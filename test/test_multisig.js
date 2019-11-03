const { BN, constants, expectEvent, expectRevert  } = require('openzeppelin-test-helpers');
const { expect  } = require('chai');
const getBlockNumber = require('./blockNumber')(web3)

const MultiSigFactory = artifacts.require("MultiSigFactory");
const MultiSig = artifacts.require("MultiSig");
const MultiSigTools = artifacts.require("MultiSigTools");

contract('MultiSig', (accounts) => {
  let multisig_factory = {}

  let multisig = {}
  let instance = {}

    it("init", async() =>{
          multisig_factory = await MultiSigFactory.deployed();
          assert.ok(multisig_factory);
          tokentx = await multisig_factory.createMultiSig(accounts.slice(0, 5));
          multisig = await MultiSig.at(tokentx.logs[0].args.addr);
          assert.ok(multisig);
      instance = multisig;

    });

  it('a signer to call reform', async function(){
    invoke_id = await instance.get_unused_invoke_id("reform_signers", {from:accounts[0]});
    //invoke_id += 1;

    console.log('invoke_id: ', invoke_id);
    console.log('too less signers...');
    await expectRevert(instance.reform_signers(invoke_id.toNumber(), accounts.slice(5, 6), {from:accounts[0]}), "the number of signers must be >=3");
    console.log('too less signers done');

    console.log('enough signers...');
    const {logs} = await instance.reform_signers(invoke_id.toNumber(), accounts.slice(5, 10), {from:accounts[0]});
    expectEvent.inLogs(logs, "valid_function_sign", {name:"reform_signers", id:new BN(invoke_id.toString()), current_signed_number: new BN("1")});

    console.log('enough signers done');

    console.log('repeat enough signers...');
    await expectRevert(instance.reform_signers(invoke_id.toNumber(), accounts.slice(5, 10), {from:accounts[0]}), "you already called this method");
    console.log('repeat enough signers done');
  });

  it('3 signers to call reform with enough signers', async function(){
    invoke_id = await instance.get_unused_invoke_id("reform_signers", {from:accounts[0]});
    console.log('invoke_id: ', invoke_id);

    const {logs} = await instance.reform_signers(invoke_id.toNumber(), accounts.slice(5, 10), {from:accounts[0]});
    expectEvent.inLogs(logs, "valid_function_sign", {name:"reform_signers", id:new BN(invoke_id.toString()), current_signed_number: new BN("1")});

    const {logs:logs1}= await instance.reform_signers(invoke_id.toNumber(), accounts.slice(5, 10), {from:accounts[1]});
    expectEvent.inLogs(logs1, "valid_function_sign", {name:"reform_signers", id:new BN(invoke_id.toString()), current_signed_number: new BN("2")});

    const {logs:logs2} = await instance.reform_signers(invoke_id.toNumber(), accounts.slice(5, 10), {from:accounts[2]});
    expectEvent.inLogs(logs2, "valid_function_sign", {name:"reform_signers", id:invoke_id, current_signed_number: new BN("3")});
    expectEvent.inLogs(logs2, "function_called", {name:"reform_signers", id:invoke_id});

    await expectRevert(instance.reform_signers(invoke_id.toNumber(), accounts.slice(5, 10), {from:accounts[3]}), "only a signer can call this");

    new_invoke_id = await instance.get_unused_invoke_id("reform_signers", {from:accounts[0]});
    expect(new_invoke_id).to.be.bignumber.equal((invoke_id.toNumber() + 1).toString());

    signers = await instance.get_signers({from:accounts[0]});
    console.log(signers);
  });

  it('reform with passed signers', async function(){
    invoke_id = await instance.get_unused_invoke_id("reform_signers", {from:accounts[0]});
    console.log('invoke_id: ', invoke_id);

    //two singers choose to reform to [0, 5)
    const {logs} = await instance.reform_signers(invoke_id.toNumber(), accounts.slice(0, 5), {from:accounts[8]});
    expectEvent.inLogs(logs, "valid_function_sign", {name:"reform_signers", id:new BN(invoke_id.toString()), current_signed_number: new BN("1")});

    const {logs:logs1}= await instance.reform_signers(invoke_id.toNumber(), accounts.slice(0, 5), {from:accounts[9]});
    expectEvent.inLogs(logs1, "valid_function_sign", {name:"reform_signers", id:new BN(invoke_id.toString()), current_signed_number: new BN("2")});

    //The other 3 signers choose to reform to [3, 8)
    prev_invoke_id = invoke_id;
    invoke_id = await instance.get_unused_invoke_id("reform_signers", {from:accounts[0]});
    const {logs:logs2} = await instance.reform_signers(invoke_id.toNumber(), accounts.slice(3, 8), {from:accounts[7]});
    expectEvent.inLogs(logs2, "valid_function_sign", {name:"reform_signers", id:invoke_id, current_signed_number: new BN("1")});

    const {logs:logs3} = await instance.reform_signers(invoke_id.toNumber(), accounts.slice(3, 8), {from:accounts[8]});
    expectEvent.inLogs(logs3, "valid_function_sign", {name:"reform_signers", id:invoke_id, current_signed_number: new BN("2")});

    const {logs:logs4} = await instance.reform_signers(invoke_id.toNumber(), accounts.slice(3, 8), {from:accounts[9]});
    expectEvent.inLogs(logs4, "valid_function_sign", {name:"reform_signers", id:invoke_id, current_signed_number: new BN("3")});
    expectEvent.inLogs(logs4, "function_called", {name:"reform_signers", id:invoke_id});

    //The new joined signers now try to agree to reform to [0, 5) with previous invoke_id,
    await expectRevert(instance.reform_signers(prev_invoke_id.toNumber(), accounts.slice(0, 5), {from:accounts[3]}),
        "this proposal is already exist before you become a signer");

    //The old 3 signers can agree to reform to [0, 5)
    const {logs:logs5} = await instance.reform_signers(prev_invoke_id.toNumber(), accounts.slice(0, 5), {from:accounts[5]});
    expectEvent.inLogs(logs5, "valid_function_sign", {name:"reform_signers", id:new BN(prev_invoke_id.toString()), current_signed_number: new BN("1")});

    const {logs:logs6}= await instance.reform_signers(prev_invoke_id.toNumber(), accounts.slice(0, 5), {from:accounts[6]});
    expectEvent.inLogs(logs6, "valid_function_sign", {name:"reform_signers", id:new BN(prev_invoke_id.toString()), current_signed_number: new BN("2")});

    const {logs:logs7} = await instance.reform_signers(prev_invoke_id.toNumber(), accounts.slice(0, 5), {from:accounts[7]});
    expectEvent.inLogs(logs7, "valid_function_sign", {name:"reform_signers", id:new BN(prev_invoke_id.toString()), current_signed_number: new BN("3")});
    expectEvent.inLogs(logs7, "function_called", {name:"reform_signers", id:prev_invoke_id});


    new_invoke_id = await instance.get_unused_invoke_id("reform_signers", {from:accounts[0]});
    expect(new_invoke_id).to.be.bignumber.equal((invoke_id.toNumber() + 1).toString());

    signers = await instance.get_signers({from:accounts[0]});
    console.log(signers);
  });

  it('call with too big invoke_id', async function(){
    invoke_id = await instance.get_unused_invoke_id("reform_signers", {from:accounts[0]});
    console.log('invoke_id: ', invoke_id);

    invoke_id = invoke_id.toNumber() + 2;

    //two singers choose to reform to [0, 5)
    await expectRevert(instance.reform_signers(invoke_id, accounts.slice(0, 5), {from:accounts[4]}),
      "you're using a too big id.");

  });

});

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
