const TestTokenClaimer = artifacts.require("TestTokenClaimer");
//const TransferableTokenA = artifacts.require("TransferableTokenA");
//const TransferableTokenB = artifacts.require("TransferableTokenB");
const USDT = artifacts.require("USDT")
const StdERC20= artifacts.require("StdERC20")
const { BN, constants, expectEvent, expectRevert } = require('openzeppelin-test-helpers');
const { expect } = require('chai');
const Web3 = require('web3');

let web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:7545"));


contract("TESTTOKENCLAIMER", (accounts) => {
	let claimer = {}
	let usdt = {}
	let demo = {}
	context('init', async() => {
		claimer = await TestTokenClaimer.deployed();
		usdt = await USDT.deployed();
		demo = await StdERC20.deployed();
		assert.ok(claimer);
		assert.ok(usdt);
		assert.ok(demo);
	})

	context('claim Std Tokens', () => {

		it('_token = 0x0', async() =>{
			let before_balance = await web3.eth.getBalance(accounts[1])
			await claimer.claimStdTokens("0x0000000000000000000000000000000000000000", accounts[1])
//			assert.equal(await web3.eth.getBalance(accounts[1]), 0, "the balance in accounts[1] should be equal to that before")

			let account = accounts[1]
			let claimer_address = claimer.address
//			assert.notEqual(claimer_address, "0x7ec5144665d7406945505DA10fE8443eA68B3b29","address should be equal")
			let data = {
				'from': accounts[1],
				'to': claimer_address,
//				'to': accounts[2],
				'value': '1000000000000000000'
//				'value': 99646777960000000000
			}
// 			await web3.eth.sendTransaction(data).on('error', console.error)
			let after_balance = await web3.eth.getBalance(accounts[1])
			// assert.equal(after_balance, '0', "after balance")
			before_balance = await web3.eth.getBalance(accounts[1])
			await claimer.claimStdTokens("0x0000000000000000000000000000000000000000", accounts[1])
			assert.ok((await web3.eth.getBalance(accounts[1]) - before_balance >= 0), "the balance in accounts[1] should be bigger than that before")

		});
		it('using demo to test', async () =>{
			let demo_address = demo.address;
			let claimer_address = claimer.address;
			await demo.issue(claimer_address, 600000000);
			let balance = await demo.balanceOf(claimer_address)
			assert.equal(balance.toNumber(), 600000000, "the claimer_address's balance should be 600000000");
			await claimer.claimStdTokens(demo_address, accounts[1]);
			balance = await demo.balanceOf(accounts[1])
			assert.equal(balance.toNumber(), 600000000, "the accounts[1]'s balance should be 600000000 after claimStdTokens()");
		});
	}),

	context('claim USDT Tokens', () => {
		// it('_token = 0x0', async() =>{
		// 	let before_balance = await web3.eth.getBalance(accounts[1])
		// 	await claimer.claimUSDTStyleTokens(0x0000000000000000000000000000000000000000, accounts[1])
		// 	assert.equal(await web3.eth.getBalance(accounts[1]), before_balance, "the balance in accounts[1] should be equal to that before")

		// 	let account = accounts[1]
		// 	let claimer_address = claimer.address
		// 	let data = {
		// 		'from': account,
		// 		'to': claimer_address,
		// 		'value': '1000000000000000000'
		// 	}
		// 	await web3.eth.sendTransaction(data)
		// 	await claimer.claimUSDTStyleTokens("0x0000000000000000000000000000000000000000", accounts[1])
		// 	assert.equal(await web3.eth.getBalance(accounts[1]), before_balance, "the balance in accounts[1] should be bigger than that before")

		// });

		it('using USDT to test', async () =>{
			let usdt_address = usdt.address;
			let claimer_address = claimer.address;
			await usdt.issue(claimer_address, 400000000);
			let balance = await usdt.balanceOf(claimer_address)
			assert.equal(balance.toNumber(), 400000000, "the claimer_address's balance should be 300000000");
			await claimer.claimStdTokens(usdt_address, accounts[1]);
			balance = await usdt.balanceOf(accounts[1])
			assert.equal(balance.toNumber(), 400000000, "the accounts[1]'s balance should be 300000000 after claimStdTokens()");
		});
	})
});
