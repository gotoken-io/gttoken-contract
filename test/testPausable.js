const TestPausable = artifacts.require("TestPausable")
const { BN, constants, expectEvent, expectRevert } = require('openzeppelin-test-helpers');
const { expect } = require('chai')

contract('TESTPAUSABLE', (accounts) => {
	let pausable = {}

	context('init', async () => {
		pausable = await TestPausable.deployed()
		assert.ok(pausable)
	})

	context('check DEFAULT status', () => {
		it('', async() => {
			assert.equal(await pausable.is_not_paused(), true, 'bool initilizing in solidity is false')
		});
	}),

	context('change DEFAULT status', async () => {
		//bool in solidity will be initilzed as false
		it('try to unpause while the DEFAULT is unpause', async () => {
			await expectRevert.unspecified(pausable.unpause())
			assert.equal(await pausable.is_not_paused(), true, "the item is not paused, so its status should not be changed")
		});

		it('pause the DEFAULT', async () => {
			await pausable.pause()
			assert.equal(await pausable.is_paused(), true, "the DEFAULT should be paused")
		});

		it('try to pause the DEFAULT while DEFAULT is paused', async () =>{
			await expectRevert.unspecified(pausable.pause())
			assert.ok(await pausable.is_paused(), "the DEFAULT has been paused so its status should not be changed")
		});

		it('unpause the DEFAULT', async () =>{
			await pausable.unpause()
			assert.ok(await pausable.is_not_paused(), "the DEFAULT should be unpaused")
		});
	}),

	context('change item status and check', async () => {
		let addr_1 = accounts[1]

		it("try to unpause item while it isn't paused", async () => {
			await expectRevert.unspecified(pausable.unpause_item(addr_1))
			assert.equal(await pausable.is_item_not_paused(addr_1), true, "the item is not paused, so its status should not be changed")
		});

		it("pause item while it isn't paused", async () =>{
			await pausable.pause_item(addr_1)
			assert.ok(await pausable.is_item_paused(addr_1), "the item should be paused")
		});

		it("try to pause item while it is still in paused", async() => {
			await expectRevert.unspecified(pausable.pause_item(addr_1))
			assert.equal(await pausable.is_item_paused(addr_1), true, 'the item has been paused, so its status should not be changed')
		});
		console.log()

		it("unpause item", async () => {
			await pausable.unpause_item(addr_1)
			assert.ok(await pausable.is_item_not_paused(addr_1), "the item has been unpaused")
		});
	})
});
