const TestERC20 = artifacts.require("TestERC20");
const { BN, constants, expectEvent, expectRevert  } = require('openzeppelin-test-helpers');
const { expect  } = require('chai');
const getBlockNumber = require('./blockNumber')(web3)

contract('TESTERC20', (accounts) =>{

  let token = {}

  context('init', async()=>{
    token = await TestERC20.deployed()
    assert.ok(token)
  })

    context('create, destroy, and claim tokens', async () => {
        it('should generate tokens', async () => {
            await token.generateTokens(accounts[1], 100)
            assert.equal(await token.totalSupply(), 100, 'total supply generated should be 100')
            assert.equal(await token.balanceOf(accounts[1]), 100, 'accounts[1] balance should be 100')
        });

        it('should be able to destroy tokens', async () => {
            await token.destroyTokens(accounts[1], 20)

            let block = await getBlockNumber()
            console.log(block)

            assert.equal(await token.totalSupply(), 80, 'total supply should be at 80')
            assert.equal(await token.totalSupplyAt(block - 1), 100, 'total supply should be 100 in previous block')
            assert.equal(await token.balanceOf(accounts[1]), 80, 'should have destroyed 20 tokens from orignal amount')

            await expectRevert.unspecified(token.destroyTokens(accounts[2], 100))
        });

    }),

    context('test multi-transfer and disabling', () => {
        it('token should be able to transfer from account 1 to account 2', async () => {
            await token.approve(accounts[3], 10, {from: accounts[1]})

            console.log('account 1 has balance before transferFrom ', (await token.balanceOf(accounts[1])).toNumber())
            await token.transferFrom(accounts[1], accounts[2], 10, {from:accounts[3]})

            let block = await getBlockNumber()
            console.log('account 1 has balance ', (await token.balanceOf(accounts[1])).toNumber())

            assert.equal(await token.totalSupply(), 80, 'total supply should still be at 80')
            assert.equal(await token.balanceOf(accounts[1]), 70, 'accounts[1] should have updated balance of 60')
            assert.equal(await token.balanceOf(accounts[2]), 10, 'accounts[2] should have a balance of 10')
            assert.equal(await token.balanceOfAt(accounts[1], block - 1), 80, 'accounts[1] balance should be 80 in previous block')
        });

        it('token should be able to transfer from account 2 to account 3', async () => {
          await token.approve(accounts[1], 5, {from:accounts[2]})

            await token.transferFrom(accounts[2], accounts[3], 5, {from:accounts[1]})

            let block = await getBlockNumber()

            assert.equal(await token.totalSupply(), 80, 'total supply should still be at 80')
            assert.equal(await token.balanceOf(accounts[2]), 5, 'accounts[2] should have updated balance of 5')
            assert.equal(await token.balanceOf(accounts[3]), 5, 'accounts[3] should have a balance of 5')
            assert.equal(await token.balanceOfAt(accounts[2], block - 1), 10, 'accounts[2] balance should be 10 in previous block')
        })

        //it('claim tokens', async () => {
            //assert.ok(await token.claimTokens(0x0))
            //assert.ok(await token.claimTokens(token.address))
            //await expectRevert.unspecified(token.transfer(token.address, 5))
        //})

        it('disable transfers', async () => {
            await token.enableTransfers(false)
            await expectRevert.unspecified(token.transfer(accounts[3], 5))
        })

        it('re-enable transfers', async () => {
            await token.enableTransfers(true)
        })

        it('approve tokens for spending', async () => {
            assert.ok(await token.approve(accounts[3], 10))
            assert.equal(await token.allowance(accounts[0], accounts[3]), 10, 'account 3 should have an allowance')
            await token.transferFrom(accounts[0], accounts[4], 5, {from: accounts[3]})

            const newAllowance = await token.allowance(accounts[0], accounts[3])
            assert.equal(newAllowance, 5, 'should have an allowance of 5')
        })

        it('refuse new allowances if transfer are disabled', async () => {
            await token.enableTransfers(false)
            await expectRevert.unspecified(token.approve(accounts[2], 10))
        })
    })
});
