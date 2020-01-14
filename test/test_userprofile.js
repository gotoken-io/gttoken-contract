const { BN, constants, expectEvent, expectRevert  } = require('openzeppelin-test-helpers');
const { expect  } = require('chai');
const getBlockNumber = require('./blockNumber')(web3)

const UserProfileFactory = artifacts.require("UserProfileFactory")
const UserProfile = artifacts.require("UserProfile")

const MultiSigFactory = artifacts.require("MultiSigFactory");
const MultiSig = artifacts.require("MultiSig");


contract('UserProfileFactory', (accounts) =>{
  let multisig_factory = {}

  let multisig = {}
  let instance = {}
  context('init', ()=>{
    it("init", async() =>{
      console.log("1");
          multisig_factory = await MultiSigFactory.deployed();
      console.log("2");
          assert.ok(multisig_factory);
      console.log("3");
          tokentx = await multisig_factory.createMultiSig(accounts.slice(0, 5));
      console.log("4");
          multisig = await MultiSig.at(tokentx.logs[0].args.addr);
      console.log("5");
          assert.ok(multisig);
      console.log("6");

      up_factory = await UserProfileFactory.deployed();
      console.log("7");
      tx = await up_factory.createUserProfile(multisig.address);
      console.log("8");
      instance = await UserProfile.at(tx.logs[0].args.addr);
      console.log("9");
      assert.ok(instance);
      console.log("10");
    })


  it('add/edit/remove user', async() =>{
    const {logs:log1} = await instance.addUser("gttoken", "test@gt.io", "avatar", "intro", {from:accounts[8]});
    expectEvent.inLogs(log1, "AddUser", {_addr:accounts[8], _name:"gttoken", _email:"test@gt.io", _avatar:"avatar", _intro:"intro"});
    await expectRevert(instance.addUser("1", "1", "1", "1", {from:accounts[8]}), "already exist");

    e = await instance.userExists(accounts[8]);
    expect(e).to.equal(true);
    const{name, email, avatar, intro} = await instance.userInfo(accounts[8]);
    expect(name).to.equal("gttoken");
    expect(email).to.equal("test@gt.io");
    expect(avatar).to.equal("avatar");
    expect(intro).to.equal("intro");

    const {logs:log2} = await instance.changeName("gttoken1", {from:accounts[8]});
    expectEvent.inLogs(log2, "ChangeItem", {_addr:accounts[8], _item:"name", _old:"gttoken", _new:"gttoken1"});
    const {logs:log3} = await instance.changeEmail("test@gt.io1", {from:accounts[8]});
    expectEvent.inLogs(log3, "ChangeItem", {_addr:accounts[8], _item:"email", _old:"test@gt.io", _new:"test@gt.io1"});
    const {logs:log4} = await instance.changeAvatar("avatar1", {from:accounts[8]});
    expectEvent.inLogs(log4, "ChangeItem", {_addr:accounts[8], _item:"avatar", _old:"avatar", _new:"avatar1"});
    const {logs:log5} = await instance.changeIntro("intro1", {from:accounts[8]});
    expectEvent.inLogs(log5, "ChangeItem", {_addr:accounts[8], _item:"intro", _old:"intro", _new:"intro1"});

    const {name:n1, email:e1, avatar:a1, intro:i1} = await instance.userInfo(accounts[8]);
    expect(n1).to.equal("gttoken1");
    expect(e1).to.equal("test@gt.io1");
    expect(a1).to.equal("avatar1");
    expect(i1).to.equal("intro1");

    const {logs:log6} = await instance.removeUser({from:accounts[8]});
    expectEvent.inLogs(log6, "RemoveUser", {_addr:accounts[8]});

    e = await instance.userExists(accounts[8]);
    expect(e).to.equal(false);
  })

    it('pause / unpause', async() =>{

    invoke_id = await multisig.get_unused_invoke_id("pauseService", {from:accounts[0]});
    console.log('invoke_id: ', invoke_id);
    const {logs} = await instance.pauseService(invoke_id.toNumber(), {from:accounts[0]});

    const {logs:logs1} = await instance.pauseService(invoke_id.toNumber(), {from:accounts[1]});

    const {logs:logs2} = await instance.pauseService(invoke_id.toNumber(), {from:accounts[2]});
    expectEvent.inLogs(logs2, "Pause", {});

    await expectRevert(instance.addUser("1", "1", "1", "1", {from:accounts[8]}), "not on service");


    invoke_id = await multisig.get_unused_invoke_id("unpauseService", {from:accounts[0]});
    console.log('invoke_id: ', invoke_id);
    const {logs:logs5} = await instance.unpauseService(invoke_id.toNumber(), {from:accounts[0]});

    const {logs:logs6} = await instance.unpauseService(invoke_id.toNumber(), {from:accounts[1]});

    const {logs:logs7} = await instance.unpauseService(invoke_id.toNumber(), {from:accounts[2]});
    expectEvent.inLogs(logs7, "Unpause", {});

    })

  })
});
