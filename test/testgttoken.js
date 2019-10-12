const GTToken = artifacts.require("GTToken");
const GTTokenFactory = artifacts.require("GTTokenFactory");
const { BN, constants, expectEvent, expectRevert  } = require('openzeppelin-test-helpers');
const { expect  } = require('chai');
const getBlockNumber = require('./blockNumber')(web3)

contract('GTTokenFactory', (accounts) =>{
  let factory = {}
  let token = {}
  let clone1 = {}
  context('init', ()=>{
        it('init', async () => {
    factory = await GTTokenFactory.deployed();
    assert.ok(factory);
    tokentx = await factory.createCloneToken('0x0000000000000000000000000000000000000000', 0, "Test", 18, "tst", true, accounts.slice(0, 3));
    token = await GTToken.at(tokentx.logs[0].args._cloneToken);
    assert.ok(token);
        })
    //console.log('token is: ', token)
  })
    context('add trust issuer', () => {
        it('add trust issuer', async () => {
          //console.log(token);
          invoke_id = await token.get_unused_invoke_id("add_trusted_issuer", {from:accounts[0]});
          await token.add_trusted_issuer(invoke_id, accounts[3], {from:accounts[1]});
          await token.add_trusted_issuer(invoke_id, accounts[3], {from:accounts[0]});
    })
    });

  //for token itself, check testerc20.js, here we only test GTToken related features
    context('create, destroy, and claim tokens', ()=> {
        it('should generate tokens', async () => {
            await token.generateTokens(accounts[1], 100, {from: accounts[3]});
            assert.equal(await token.totalSupply(), 100, 'total supply generated should be 100')
            assert.equal(await token.balanceOf(accounts[1]), 100, 'accounts[1] balance should be 100')
        });

        it('should be able to destroy tokens', async () => {
            await token.destroyTokens(accounts[1], 20, {from:accounts[3]});

            let block = await getBlockNumber()
            console.log(block)

            assert.equal(await token.totalSupply(), 80, 'total supply should be at 80')
            assert.equal(await token.totalSupplyAt(block - 1), 100, 'total supply should be 100 in previous block')
            assert.equal(await token.balanceOf(accounts[1]), 80, 'should have destroyed 20 tokens from orignal amount')

            await expectRevert.unspecified(token.destroyTokens(accounts[2], 100))
        });

        it('approve tokens for spending', async () => {
            await token.generateTokens(accounts[0], 100, {from: accounts[3]});
            assert.ok(await token.approve(accounts[3], 10, {from:accounts[0]}))
            assert.equal(await token.allowance(accounts[0], accounts[3]), 10, 'account 3 should have an allowance')
            await token.transferFrom(accounts[0], accounts[4], 5, {from: accounts[3]})

            const newAllowance = await token.allowance(accounts[0], accounts[3])
            assert.equal(newAllowance, 5, 'should have an allowance of 5')
        })
    }),

    context('test all cloning', () => {
        it('should be able to clone token', async () => {
            // We create a clone token out of a past block
            const cloneTokenTx = await token.createCloneToken('MMT2', 18, 'MMT2', 0, true, accounts.slice(0, 3))
            const addr = cloneTokenTx.logs[0].args._cloneToken

            clone1 = await GTToken.at(addr)
          invoke_id = await clone1.get_unused_invoke_id("add_trusted_issuer", {from:accounts[0]});
          await clone1.add_trusted_issuer(invoke_id, accounts[4], {from:accounts[1]});
          await clone1.add_trusted_issuer(invoke_id, accounts[4], {from:accounts[0]});
        })

        it('has the same total supply than parent token', async () => {
            assert.equal((await token.totalSupply()).toNumber(), (await clone1.totalSupply()).toNumber(), 'tokens should have the same total supply')
        })

        it('keep main balances from parent token', async () => {
            assert.isAbove((await token.balanceOf(accounts[1])).toNumber(), 0, 'account 1 should own some tokens')

            assert.equal((await token.balanceOf(accounts[1])).toNumber(), (await clone1.balanceOf(accounts[1])).toNumber(), 'account balances should be the same')
        })

        it('should not have kept allowances from parent token', async () => {
            let tokenAllowance = await token.allowance(accounts[0], accounts[3])
            let cloneAllowance = await clone1.allowance(accounts[0], accounts[3])

            assert.equal(tokenAllowance, 5, 'should have an allowance of 5 for main token')
            assert.equal(cloneAllowance, 0, 'should have no allowance for clone token')
        })

        it('generate some clone tokens to account 5', async () => {
            await clone1.generateTokens(accounts[5], 1000, {from: accounts[4]})

            let block = await getBlockNumber()
            console.log("account 5 balance is: ", (await clone1.balanceOf(accounts[5])).toNumber())

            assert.equal(await clone1.balanceOfAt(accounts[5], block), 1000, 'should have balance of 1000')
            assert.equal(await clone1.balanceOfAt(accounts[5], block - 1), 0, 'should have previous balance of 0')
        })

        it('cloned token transfers from account 5 to account 6', async () => {
            await clone1.transfer(accounts[6], 100, {from:accounts[5]})

            let block = await getBlockNumber()

            assert.equal(await clone1.balanceOf(accounts[5]), 900, 'should only have 900 tokens after transfer')
            assert.equal(await clone1.balanceOfAt(accounts[5], block - 1), 1000, 'should have 1000 in the past block')
            assert.equal(await clone1.balanceOf(accounts[6]), 100, 'transferee should have balance of 100')
            assert.equal(await clone1.balanceOfAt(accounts[6], block - 1), 0, 'transferee should have previous balance of 0')
        })
    })
}

);

