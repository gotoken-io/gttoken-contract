const { BN, constants, expectEvent, expectRevert  } = require('openzeppelin-test-helpers');
const { expect  } = require('chai');
const getBlockNumber = require('./blockNumber')(web3)

const MultiSigFactory = artifacts.require("MultiSigFactory");
const MultiSig = artifacts.require("MultiSig");
const MultiSigTools = artifacts.require("MultiSigTools");

const GTProjectFactory = artifacts.require("GTProjectFactory");
const GTProject = artifacts.require("GTProject");


contract('GTProjectFactory', (accounts) =>{
  let multisig_factory = {}

  let multisig = {}
  let instance = {}
  context('init', ()=>{
    it("init", async() =>{
          multisig_factory = await MultiSigFactory.deployed();
          assert.ok(multisig_factory);
          tokentx = await multisig_factory.createMultiSig(accounts.slice(0, 5));
          multisig = await MultiSig.at(tokentx.logs[0].args.addr);
          assert.ok(multisig);

      up_factory = await GTProjectFactory.deployed();
      tx = await up_factory.createGTProject("name", "intro", "logo", "reserve", multisig.address, multisig.address);
      instance = await GTProject.at(tx.logs[0].args._addr);
      assert.ok(instance);
    })

    it("change items", async() =>{
      invoke_id = await multisig.get_unused_invoke_id("changeProjectName", {from:accounts[0]});
      await instance.changeProjectName(invoke_id, "name1", {from:accounts[0]});
      await instance.changeProjectName(invoke_id, "name1", {from:accounts[1]});
      await instance.changeProjectName(invoke_id, "name1", {from:accounts[2]});


      invoke_id = await multisig.get_unused_invoke_id("changeProjectLogo", {from:accounts[0]});
      await instance.changeProjectLogo(invoke_id, "logo1", {from:accounts[0]});
      await instance.changeProjectLogo(invoke_id, "logo1", {from:accounts[1]});
      await instance.changeProjectLogo(invoke_id, "logo1", {from:accounts[2]});


      invoke_id = await multisig.get_unused_invoke_id("changeProjectIntro", {from:accounts[0]});
      await instance.changeProjectIntro(invoke_id, "intro1", {from:accounts[0]});
      await instance.changeProjectIntro(invoke_id, "intro1", {from:accounts[1]});
      await instance.changeProjectIntro(invoke_id, "intro1", {from:accounts[2]});

      invoke_id = await multisig.get_unused_invoke_id("changeProjectReserve", {from:accounts[0]});
      await instance.changeProjectReserve(invoke_id, "reserve1", {from:accounts[0]});
      await instance.changeProjectReserve(invoke_id, "reserve1", {from:accounts[1]});
      await instance.changeProjectReserve(invoke_id, "reserve1", {from:accounts[2]});

      name = await instance.project_name();
      intro = await instance.project_intro();
      logo = await instance.project_logo();
      reserve = await instance.project_reserve();
      expect(name == "name1");
      expect(intro == "intro1");
      expect(logo == "logo1");
      expect(reserve == "reserve1");

    })

    it('extra contracts', async() =>{
      invoke_id = await multisig.get_unused_invoke_id("addExtraContract", {from:accounts[0]});
      await instance.addExtraContract(invoke_id, "test", multisig.address, {from:accounts[0]});
      await instance.addExtraContract(invoke_id, "test", multisig.address, {from:accounts[1]});
      await instance.addExtraContract(invoke_id, "test", multisig.address, {from:accounts[2]});

      num = (await instance.getExtraContractNumber()).toNumber();
      expect(num == 1);
      const {name, addr} = await instance.getExtraContractInfo(0);
      expect(name == "test");
      expect(addr == multisig.address);

      invoke_id = await multisig.get_unused_invoke_id("addExtraContract", {from:accounts[0]});
      await instance.addExtraContract(invoke_id, "test", multisig.address, {from:accounts[0]});
      await instance.addExtraContract(invoke_id, "test", multisig.address, {from:accounts[1]});
      await expectRevert(instance.addExtraContract(invoke_id, "test", multisig.address, {from:accounts[2]}),
        "already exist");

      invoke_id = await multisig.get_unused_invoke_id("removeExtraContract", {from:accounts[0]});
      await instance.removeExtraContract(invoke_id, "test", {from:accounts[0]});
      await instance.removeExtraContract(invoke_id, "test", {from:accounts[1]});
      await instance.removeExtraContract(invoke_id, "test", {from:accounts[2]});

      num = (await instance.getExtraContractNumber()).toNumber();
      expect(num == 0);


    })



  })
});
