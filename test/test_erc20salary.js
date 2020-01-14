const ERC20 = artifacts.require("USDT");
const ERC20Salary = artifacts.require("ERC20Salary");
const ERC20SalaryFactory = artifacts.require("ERC20SalaryFactory");
const ERC20TokenBankFactory = artifacts.require("ERC20TokenBankFactory");
const ERC20TokenBank = artifacts.require("ERC20TokenBank");

const { BN, constants, expectEvent, expectRevert  } = require('openzeppelin-test-helpers');
const { expect  } = require('chai');

const getBlockNumber = require('./blockNumber')(web3)

const MultiSigFactory = artifacts.require("MultiSigFactory");
const MultiSig = artifacts.require("MultiSig");
const MultiSigTools = artifacts.require("MultiSigTools");
const TrustListFactory = artifacts.require("TrustListFactory");
const TrustList = artifacts.require("TrustList");

contract('ERC20Salary', (accounts) =>{
  let multisig_factory = {}
  let multisig = {}
  let trustlist_factory = {}
  let trustlist = {}
  let token = {}
  let bank_factory = {}
  let bank = {}
  let salary_factory = {}
  let salary = {}

  let addr0 = "0x0000000000000000000000000000000000000000";
  context('init', ()=>{
        it('init', async () => {
          multisig_factory = await MultiSigFactory.deployed();
          assert.ok(multisig_factory);
          tokentx = await multisig_factory.createMultiSig(accounts.slice(0, 4));
          multisig = await MultiSig.at(tokentx.logs[0].args.addr);

          trustlist_factory = await TrustListFactory.deployed();
          assert.ok(trustlist_factory);
          tokentx = await trustlist_factory.createTrustList([], multisig.address);
          trustlist = await TrustList.at(tokentx.logs[0].args.addr);

          token = await ERC20.deployed();

          bank_factory = await ERC20TokenBankFactory.deployed();
          assert.ok(bank_factory);
          tx = await bank_factory.newERC20TokenBank("ERC20 for all", token.address, multisig.address, trustlist.address);
          bank = await ERC20TokenBank.at(tx.logs[0].args.addr);

          salary_factory = await ERC20SalaryFactory.deployed();

          tx = await salary_factory.createERC20Salary("ERC20 salary", bank.address, multisig.address, {from:accounts[0]});
          salary = await ERC20Salary.at(tx.logs[0].args.addr);

          await token.issue(bank.address, 1000000);

          invoke_id = await multisig.get_unused_invoke_id("add_trusted");
          await trustlist.add_trusted(invoke_id, salary.address, {from:accounts[0]});
          await trustlist.add_trusted(invoke_id, salary.address, {from:accounts[1]});
          await trustlist.add_trusted(invoke_id, salary.address, {from:accounts[2]});

        })
  //})
  //context('op', ()=>{
    it('admin op', async function(){
      cur = (await web3.eth.getBlock("latest")).number;

      //await salary.admin_init_employee(accounts[0], cur, 0, 10, 500, 0, 0, accounts[0], {from:accounts[0]});
      await salary.admin_init_employee(accounts[0], cur, "0", "10", "500", "0", "0", accounts[0], {from:accounts[0]});
      await salary.admin_init_employee(accounts[0], cur, 0, 20, 500, 0, 0, accounts[0], {from:accounts[0]});

      await expectRevert(salary.admin_init_employee(accounts[0], cur, 0, "20", "500", 0, 0, addr0, {from:accounts[1]}),
        "not owner");

      num = (await salary.get_employee_count({from:accounts[0]})).toNumber();
      expect(num).to.equal(1);
      await expectRevert(salary.admin_remove_employee(accounts[0], {from:accounts[1]}),
        "not owner");
      await salary.admin_remove_employee(accounts[0], {from:accounts[0]});

      num = (await salary.get_employee_count({from:accounts[0]})).toNumber();
      expect(num ).to.equal(0);

      await salary.stop_admin_mode();

      await expectRevert.unspecified(salary.get_employee_info_with_account(accounts[0]));

      await expectRevert(salary.admin_init_employee(accounts[0], cur, 0, "20", "500", 0, 0, addr0, {from:accounts[0]}),
        "not admin mode");

      await expectRevert(salary.admin_remove_employee(accounts[0], {from:accounts[0]}),
        "not admin mode");
    })

  it('add employee', async function(){

    invoke_id = await multisig.get_unused_invoke_id("add_employee", {from:accounts[0]});
    cur = (await web3.eth.getBlock("latest")).number;
    await salary.add_employee(invoke_id, accounts[0], cur, "10", "500",addr0, {from:accounts[0]});
    await salary.add_employee(invoke_id, accounts[0], cur, "10", "500", addr0, {from:accounts[1]});
    await salary.add_employee(invoke_id, accounts[0], cur, "10", "500", addr0, {from:accounts[2]});
    await salary.add_employee(invoke_id, accounts[0], cur, "10", "500", addr0, {from:accounts[3]});

    invoke_id = await multisig.get_unused_invoke_id("add_employee", {from:accounts[0]});
    await salary.add_employee(invoke_id, accounts[1], cur, "10", "500", accounts[0], {from:accounts[0]});
    await salary.add_employee(invoke_id, accounts[1], cur, "10", "500", accounts[0], {from:accounts[1]});
    await salary.add_employee(invoke_id, accounts[1], cur, "10", "500", accounts[0], {from:accounts[2]});

    invoke_id = await multisig.get_unused_invoke_id("add_employee", {from:accounts[0]});
    await salary.add_employee(invoke_id, accounts[2], cur, "10", "500", accounts[1], {from:accounts[0]});
    await salary.add_employee(invoke_id, accounts[2], cur, "10", "500", accounts[1], {from:accounts[1]});
    await salary.add_employee(invoke_id, accounts[2], cur, "10", "500", accounts[1], {from:accounts[2]});

    invoke_id = await multisig.get_unused_invoke_id("add_employee", {from:accounts[0]});
    await salary.add_employee(invoke_id, accounts[3], cur, "10", "500", accounts[2], {from:accounts[0]});
    await salary.add_employee(invoke_id, accounts[3], cur, "10", "500", accounts[2], {from:accounts[1]});
    await salary.add_employee(invoke_id, accounts[3], cur, "10", "500", accounts[2], {from:accounts[2]});

    num = (await salary.get_employee_count({from:accounts[0]})).toNumber();
    expect(num).to.equal(4);

    info = await salary.get_employee_info_with_account(accounts[0], {from:accounts[0]});
    expect(info.salary.toNumber()).to.equal(500);
    expect(info.period.toNumber()).to.equal(10);
    expect(info.last_claim_block_num.toNumber()).to.equal(cur);
    i = cur;
    while(i < cur + 30){
      //Ganache will increase block number for each transaction
      await token.transfer(accounts[0], 0, {from:accounts[0]});
      i = (await web3.eth.getBlock("latest")).number;
    }
  })

    it('check salary 1', async function(){
      await salary.unclaimed_amount();
      s0 = await salary.get_employee_info_with_account(accounts[0])
      s1 = await salary.get_employee_info_with_account(accounts[1])
      s2 = await salary.get_employee_info_with_account(accounts[2])
      s3 = await salary.get_employee_info_with_account(accounts[3])
      expect(s0.total.toNumber()).to.equal(1500);
      expect(s0.total.toNumber()).to.equal(s1.total.toNumber());
      expect(s0.total.toNumber()).to.equal(s2.total.toNumber());
      expect(s0.total.toNumber()).to.equal(s3.total.toNumber());
    })

    it('employee claim salary', async function(){
      await salary.claim_salary(accounts[9], 500, {from:accounts[0]});
      s0 = await salary.get_employee_info_with_account(accounts[0])
      expect(s0.total.toNumber()).to.equal(1500);
      expect(s0.claimed.toNumber()).to.equal(500);
      balance = (await token.balanceOf(accounts[9], {from:accounts[9]})).toNumber();
      expect(balance).to.equal(500);
      balance = (await token.balanceOf(bank.address, {from:accounts[9]})).toNumber();
      expect(balance).to.equal(1000000 - 500);
    })

    it('pause', async function(){
      invoke_id = await multisig.get_unused_invoke_id("change_employee_status", {from:accounts[0]});
      await salary.change_employee_status(invoke_id, accounts[0], true, {from:accounts[0]});
      await salary.change_employee_status(invoke_id, accounts[0], true, {from:accounts[1]});
      await salary.change_employee_status(invoke_id, accounts[0], true, {from:accounts[2]});
      await salary.change_employee_status(invoke_id, accounts[0], true, {from:accounts[3]});

      await salary.update_salary(accounts[0], {from:accounts[0]});
      s0 = await salary.get_employee_info_with_account(accounts[0])

      cur = await web3.eth.getBlock("latest");
    i = cur;
    while(i < cur + 30){
      //Ganache will increase block number for each transaction
      await token.transfer(accounts[0], 0, {from:accounts[0]});
      i = (await web3.eth.getBlock("latest")).number;
    }
      await salary.update_salary(accounts[0], {from:accounts[0]});
      s00 = await salary.get_employee_info_with_account(accounts[0])
      expect(s0.total.toNumber()).to.equal(s00.total.toNumber());
      expect(s0.last_claim_block_num.toNumber()).to.equal(s00.last_claim_block_num.toNumber());
      expect(s00.paused).to.equal(true);
    })

    it('check salary 2', async function(){
      await salary.unclaimed_amount();
      s0 = await salary.get_employee_info_with_account(accounts[0])
      s1 = await salary.get_employee_info_with_account(accounts[1])
      s2 = await salary.get_employee_info_with_account(accounts[2])
      s3 = await salary.get_employee_info_with_account(accounts[3])
      expect(s0.total.toNumber()).to.equal(1500);

      expect(s0.total.toNumber()).to.not.equal(s3.total.toNumber());
      expect(s2.total.toNumber()).to.equal(s1.total.toNumber());
      expect(s3.total.toNumber()).to.equal(s2.total.toNumber());
    })

    it('unpause', async function(){
      invoke_id = await multisig.get_unused_invoke_id("change_employee_status", {from:accounts[0]});
      await salary.change_employee_status(invoke_id, accounts[0], false, {from:accounts[0]});
      await salary.change_employee_status(invoke_id, accounts[0], false, {from:accounts[1]});
      await salary.change_employee_status(invoke_id, accounts[0], false, {from:accounts[2]});
      await salary.change_employee_status(invoke_id, accounts[0], false, {from:accounts[3]});

      await salary.update_salary(accounts[0], {from:accounts[0]});
      s0 = await salary.get_employee_info_with_account(accounts[0])

      cur = (await web3.eth.getBlock("latest")).number;
    i = cur;
    while(i < cur + 30){
      //Ganache will increase block number for each transaction
      await token.transfer(accounts[0], 0, {from:accounts[0]});
      i = (await web3.eth.getBlock("latest")).number;
    }

      await salary.update_salary(accounts[0], {from:accounts[0]});
      s00 = await salary.get_employee_info_with_account(accounts[0])
      expect(s0.total.toNumber() + 1500).to.equal(s00.total.toNumber());
      expect(s0.last_claim_block_num.toNumber()).to.not.equal(s00.last_claim_block_num.toNumber());
      expect(s00.paused).to.equal(false);

    })

    it('change_employee_xx', async function(){
      invoke_id = await multisig.get_unused_invoke_id("change_employee_period");
      await salary.change_employee_period(invoke_id, accounts[1], 20, {from:accounts[0]});
      await salary.change_employee_period(invoke_id, accounts[1], 20, {from:accounts[1]});
      await salary.change_employee_period(invoke_id, accounts[1], 20, {from:accounts[2]});
      await salary.change_employee_period(invoke_id, accounts[1], 20, {from:accounts[3]});

      invoke_id = await multisig.get_unused_invoke_id("change_employee_salary");
      await salary.change_employee_salary(invoke_id, accounts[1], 100, {from:accounts[0]});
      await salary.change_employee_salary(invoke_id, accounts[1], 100, {from:accounts[1]});
      await salary.change_employee_salary(invoke_id, accounts[1], 100, {from:accounts[2]});
      await salary.change_employee_salary(invoke_id, accounts[1], 100, {from:accounts[3]});

      invoke_id = await multisig.get_unused_invoke_id("change_employee_leader");
      await salary.change_employee_leader(invoke_id, accounts[1], accounts[2], {from:accounts[0]});
      await salary.change_employee_leader(invoke_id, accounts[1], accounts[2], {from:accounts[1]});
      await salary.change_employee_leader(invoke_id, accounts[1], accounts[2], {from:accounts[2]});
      await salary.change_employee_leader(invoke_id, accounts[1], accounts[2], {from:accounts[3]});

      s = await salary.get_employee_info_with_account(accounts[1]);
      expect(s.period.toNumber()).to.equal(20);
      expect(s.salary.toNumber()).to.equal(100);
      expect(s.leader).to.equal(accounts[2]);
    })

    it('change_subordinate_xx', async function(){
      await salary.change_subordinate_period(accounts[1], 30, {from:accounts[2]});
      await salary.change_subordinate_salary(accounts[1], 200,{from:accounts[2]});
      await salary.change_subordinate_status(accounts[1], true,{from:accounts[2]});

      await expectRevert(salary.change_subordinate_period(accounts[1], 30, {from:accounts[1]}),
        "not your subordinate");
      await expectRevert(salary.change_subordinate_salary(accounts[1], 200,{from:accounts[1]}),
        "not your subordinate");
      await expectRevert(salary.change_subordinate_status(accounts[1], true,{from:accounts[1]}),
        "not your subordinate");
    })

    it('remove and add meta', async function(){
      await salary.claim_salary(accounts[6], 987, {from:accounts[2]});
      await salary.claim_salary(accounts[7], 987, {from:accounts[3]});

      s2 = await salary.get_employee_info_with_account(accounts[2]);
      invoke_id = await multisig.get_unused_invoke_id("remove_employee");
      await salary.remove_employee(invoke_id, accounts[2], {from:accounts[0]});
      await salary.remove_employee(invoke_id, accounts[2], {from:accounts[1]});
      await salary.remove_employee(invoke_id, accounts[2], {from:accounts[2]});
      await salary.remove_employee(invoke_id, accounts[2], {from:accounts[3]});
      await expectRevert.unspecified(salary.get_employee_info_with_account(accounts[2]));

      cur = await web3.eth.getBlock("latest");
      i = cur;
      while(i < cur + 30){
        //Ganache will increase block number for each transaction
        await token.transfer(accounts[0], 0, {from:accounts[0]});
        i = (await web3.eth.getBlock("latest")).number;
      }


      invoke_id = await multisig.get_unused_invoke_id("add_employee_with_meta");
      await salary.add_employee_with_meta(invoke_id, accounts[2], s2.last_claim_block_num,
        s2.paused_block_num, s2.paused, s2.period, s2.salary, s2.total, s2.claimed, s2.leader, {from:accounts[0]});
      await salary.add_employee_with_meta(invoke_id, accounts[2], s2.last_claim_block_num,
        s2.paused_block_num, s2.paused, s2.period, s2.salary, s2.total, s2.claimed, s2.leader, {from:accounts[1]});
      await salary.add_employee_with_meta(invoke_id, accounts[2], s2.last_claim_block_num,
        s2.paused_block_num, s2.paused, s2.period, s2.salary, s2.total, s2.claimed, s2.leader, {from:accounts[2]});

      cur = (await web3.eth.getBlock("latest")).number;
      i = cur;
      while(i < cur + 30){
        //Ganache will increase block number for each transaction
        await token.transfer(accounts[0], 0, {from:accounts[0]});
        i = (await web3.eth.getBlock("latest")).number;
      }

      await salary.claim_salary(accounts[6], 987, {from:accounts[2]});
      await salary.claim_salary(accounts[7], 987, {from:accounts[3]});
      s2 = await salary.get_employee_info_with_account(accounts[2]);
      s3 = await salary.get_employee_info_with_account(accounts[3]);
      expect(s2.total.toNumber()).to.equal(s3.total.toNumber());
      expect(s3.last_claim_block_num.toNumber()).to.equal(s2.last_claim_block_num.toNumber());
      expect(s2.claimed.toNumber()).to.equal(s3.claimed.toNumber());
    })

    it('pause/unpause salary', async function(){
      invoke_id = await multisig.get_unused_invoke_id("add_employee", {from:accounts[0]});
      start_cur = (await web3.eth.getBlock("latest")).number;
      start_balance = (await token.balanceOf(accounts[5], {from:accounts[9]})).toNumber();
      await salary.add_employee(invoke_id, accounts[5], start_cur, "100", "500", accounts[1], {from:accounts[0]});
      await salary.add_employee(invoke_id, accounts[5], start_cur, "100", "500", accounts[1], {from:accounts[1]});
      await salary.add_employee(invoke_id, accounts[5], start_cur, "100", "500", accounts[1], {from:accounts[2]});
      await salary.add_employee(invoke_id, accounts[5], start_cur, "100", "500", accounts[1], {from:accounts[3]});

      cur = (await web3.eth.getBlock("latest")).number;
      i = cur;
      while(i < cur + 90){
        //Ganache will increase block number for each transaction
        await token.transfer(accounts[0], 0, {from:accounts[0]});
        i = (await web3.eth.getBlock("latest")).number;
      }

      //pause
      await salary.change_subordinate_status(accounts[5], true, {from:accounts[1]});

      cur = (await web3.eth.getBlock("latest")).number;
      i = cur;
      while(i < cur + 90){
        //Ganache will increase block number for each transaction
        await token.transfer(accounts[0], 0, {from:accounts[0]});
        i = (await web3.eth.getBlock("latest")).number;
      }

      await salary.update_salary(accounts[5], {from:accounts[0]});
      s0 = await salary.get_employee_info_with_account(accounts[5]);
      expect(s0.total.toNumber()).to.equal(0);

      //unpause
      await salary.change_subordinate_status(accounts[5], false, {from:accounts[1]});

      cur = (await web3.eth.getBlock("latest")).number;
      i = cur;
      while(i < cur + 30){
        //Ganache will increase block number for each transaction
        await token.transfer(accounts[0], 0, {from:accounts[0]});
        i = (await web3.eth.getBlock("latest")).number;
      }

      await salary.update_salary(accounts[5], {from:accounts[0]});
      s1 = await salary.get_employee_info_with_account(accounts[5]);
      expect(s1.total.toNumber()).to.equal(500);
      console.log("after pause: ", s1);

      //pause
      await salary.change_subordinate_status(accounts[5], true, {from:accounts[1]});

      cur = (await web3.eth.getBlock("latest")).number;
      i = cur;
      while(i < cur + 90){
        //Ganache will increase block number for each transaction
        await token.transfer(accounts[0], 0, {from:accounts[0]});
        i = (await web3.eth.getBlock("latest")).number;
      }

      await salary.update_salary(accounts[5], {from:accounts[0]});
      s2 = await salary.get_employee_info_with_account(accounts[5]);
      expect(s2.total.toNumber()).to.equal(500);

      //unpause
      await salary.change_subordinate_status(accounts[5], false, {from:accounts[1]});

      cur = (await web3.eth.getBlock("latest")).number;
      i = cur;
      while(i < cur + 80){
        //Ganache will increase block number for each transaction
        await token.transfer(accounts[0], 0, {from:accounts[0]});
        i = (await web3.eth.getBlock("latest")).number;
      }

      await salary.update_salary(accounts[5], {from:accounts[0]});
      s3 = await salary.get_employee_info_with_account(accounts[5]);
      expect(s3.total.toNumber()).to.equal(1000);
      console.log("after pause: ", s3);

    })

  })


})
