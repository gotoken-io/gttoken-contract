const ERC20 = artifacts.require("USDT");
const TestERC20 = artifacts.require("TestERC20");
const DoubleCurveFundFactory = artifacts.require("DoubleCurveFundFactory");
const DoubleCurveFund = artifacts.require("DoubleCurveFund");

const { BN, constants, expectEvent, expectRevert  } = require('openzeppelin-test-helpers');
const { expect  } = require('chai');

const getBlockNumber = require('./blockNumber')(web3)

const MultiSigFactory = artifacts.require("MultiSigFactory");
const MultiSig = artifacts.require("MultiSig");
const MultiSigTools = artifacts.require("MultiSigTools");

const getEvents = ({ logs = []  }, event) => logs.filter(l => l.event === event)
const getEventAt = (receipt, event, index = 0) => getEvents(receipt, event)[index]
const getEventArgument = (receipt, event, arg, index = 0) => getEventAt(receipt, event, index).args[arg]

contract('DoubleCurveFund', (accounts) =>{
  let multisig_factory = {}
  let multisig = {}
  let exchange_token = {}
  let native_token = {}
  let dc_factory = {}
  let dc = {}

  context('init', ()=>{
    it('init', async() =>{

      multisig_factory = await MultiSigFactory.deployed();
      assert.ok(multisig_factory);
      tokentx = await multisig_factory.createMultiSig(accounts.slice(0, 4));
      multisig = await MultiSig.at(tokentx.logs[0].args.addr);

      exchange_token = await ERC20.deployed();

      native_token = await TestERC20.deployed();

      for(i = 0; i < accounts.length; i++){
        await exchange_token.issue(accounts[i], 1000000000);
      }

      dc_factory = await DoubleCurveFundFactory.deployed();
      assert.ok(dc_factory);
      tokentx = await dc_factory.createDoubleCurveFund(native_token.address, exchange_token.address, multisig.address, 1000000, 1000000000, 9000);
      dc = await DoubleCurveFund.at(tokentx.logs[0].args.addr);
      assert.ok(dc);
      for(i = 0; i < accounts.length; i++){
        await exchange_token.approve(dc.address, 100000000000, {from:accounts[i]});
      }
    })

    it('simple fund/exchange', async() =>{
      let total = 10000;
      tx = await dc.fund(total, {from:accounts[0]});
      fund_remain = getEventArgument(tx, "Fund", "remain").toNumber();
      fund_got_amount = getEventArgument(tx, "Fund", "got_amount").toNumber();
      fund_amount = getEventArgument(tx, "Fund", "amount").toNumber();
      console.log("fund, total: ", total, "remain: ", fund_remain, ", got: ", fund_got_amount);

      tx = await dc.exchange(fund_got_amount, {from:accounts[0]});
      xchg_remain = getEventArgument(tx, "Exchange", "remain");
      xchg_got_amount = getEventArgument(tx, "Exchange", "got_amount");
      xchg_amount = getEventArgument(tx, "Exchange", "amount");
      console.log("exchange, total: ", fund_got_amount, ", got: ", xchg_got_amount);
    })

    it('random fund / exchange', async() =>{

      let total_fund = 0;
      let total_exchange = 0;

      for(i = 0; i < 10; i++){
        account = accounts[(Math.floor(Math.random() * accounts.length) + 1) % accounts.length ]  ;

        flag = Math.random() > 0.5;
        if(flag){ //do fund
          exchange_balance = (await exchange_token.balanceOf(account)).toNumber();
          to_exchange_amount = Math.floor(Math.random() * exchange_balance);
          console.log("to fund amount: ", to_exchange_amount);
          succ = false
          try{
            tx = await dc.fund(to_exchange_amount, {from:account});
            remain = getEventArgument(tx, "Fund", "remain").toNumber();
            got_amount = getEventArgument(tx, "Fund", "got_amount").toNumber();
            amount = getEventArgument(tx, "Fund", "amount").toNumber();
            expect(amount == to_exchange_amount);
            total_fund += (amount - remain);
          }
          catch(error){
            console.log(error);
            console.log('ignore ...');
          }

        }else{ //do exchange
          native_balance = (await native_token.balanceOf(account)).toNumber();
          to_exchange_amount = Math.floor(Math.random() * native_balance);
          console.log("to exchange amount: ", to_exchange_amount);
          try{
            tx = await dc.exchange(to_exchange_amount, {from:account});
            remain = getEventArgument(tx, "Exchange", "remain").toNumber();
            got_amount = getEventArgument(tx, "Exchange", "got_amount").toNumber();
            amount = getEventArgument(tx, "Exchange", "amount").toNumber();

            total_exchange += got_amount;
          }catch(error){
            console.log(error);
            expect(false);
          }
        }
        console.log("total fund: ", total_fund);
        console.log("total xchg: ", total_exchange);
      }

      //Finally exchange all
      for(i = 0; i < accounts.length; i++){
        account = accounts[i];
        native_balance = (await native_token.balanceOf(account)).toNumber();
        to_exchange_amount = native_balance;
        console.log("final to exchange amount: ", to_exchange_amount);
        try{
            tx = await dc.exchange(to_exchange_amount, {from:account});
            remain = getEventArgument(tx, "Exchange", "remain").toNumber();
            got_amount = getEventArgument(tx, "Exchange", "got_amount").toNumber();
            amount = getEventArgument(tx, "Exchange", "amount").toNumber();

            total_exchange += got_amount;
          }catch(error){
            console.log(error);
            expect(false);
          }
      }
      console.log("final total fund: ", total_fund);
      console.log("final total xchg: ", total_exchange);
      total_supply = (await native_token.totalSupply()).toNumber();
      expect(total_supply).to.eq(0);
      console.log("total supply: ", total_supply);

      profit = (await dc.profit()).toNumber();

      console.log("final profit: ", profit);

      old_exchange_balance = (await exchange_token.balanceOf(accounts[9])).toNumber();
      await dc.withdraw_profit(1, accounts[9], profit, {from:accounts[0]});
      await dc.withdraw_profit(1, accounts[9], profit, {from:accounts[1]});
      await dc.withdraw_profit(1, accounts[9], profit, {from:accounts[2]});
      await dc.withdraw_profit(1, accounts[9], profit, {from:accounts[3]});

      new_exchange_balance = (await exchange_token.balanceOf(accounts[9])).toNumber();
      expect(new_exchange_balance).to.eq(old_exchange_balance + profit);
    })


  });

});
