const TestAddressList = artifacts.require("TestAddressList");
const { BN, constants, expectEvent, expectRevert } = require('openzeppelin-test-helpers');
const { expect } = require('chai');
const getBlockNumber = require('./blockNumber')(web3)


contract('TESTADDRESSLIST', (accounts) => {

	let addr = {};

	context('init', async () => {
		addr = await TestAddressList.deployed();
		assert.ok(addr)
	})

	context('add address, is_address_exist, and get_address', async () =>{
		it('add addresses into contract', async () =>{
			await addr.add_address(accounts[1]);
			assert.ok(await addr.is_address_exist(accounts[1]), "accounts[1] should be add into addresses, and status is true");
			assert.equal(await addr.get_address_num(), 1, "account num in address should be 1");
			await addr.add_address(accounts[2]);
			assert.ok(await addr.is_address_exist(accounts[2]), "accounts[2] should be add into addresses, and status is true");
			assert.equal(await addr.get_address_num(), 2, "account num in address should be 2");
		});

		it('get address from addresses', async () => {
			let address = accounts[1];	//the address's order is according to the input order?
			assert.ok(await addr.is_address_exist(address), "the accounts[1] should be added into the addresses");
			assert.equal(await addr.get_address(0), address, "accounts[1] should be the first account add into addresses")
		});

		it("try to input the number out of range", async () => {
			await expectRevert.unspecified(addr.get_address(await addr.get_address_num() + 1))
		});
	}),

	context("remove address from contract", () => {
		let address = accounts[2]
		it('try to remove the accounts[2]', async () => {
			await addr.remove_address(address)
			assert.equal(await addr.is_address_exist(address), false, "accounts[2] should be remove")
			assert.equal(await addr.get_address_num(), 1, "accounts[2] should be remove")
		});
	}),

	context("reset the contract", () => {
		it('try to reset the contract', async () => {
			await addr.add_address(accounts[2])
			await addr.add_address(accounts[3])

			await addr.reset()
			assert.equal(await addr.get_address_num(), 0, "all the addresses should be delete")
			assert.equal(await addr.is_address_exist(accounts[1]), false, 'all the addresses should be delete')
			assert.equal(await addr.is_address_exist(accounts[2]), false, 'all the addresses should be delete')
			assert.equal(await addr.is_address_exist(accounts[3]), false, 'all the addresses should be delete')

		});
	})
});
