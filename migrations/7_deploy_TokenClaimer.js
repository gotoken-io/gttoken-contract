const TokenClaimer = artifacts.require("TokenClaimer");
const TestTokenClaimer = artifacts.require("TestTokenClaimer");
const USDT = artifacts.require("USDT")
const StdERC20 = artifacts.require("StdERC20")

module.exports = function(deployer, network, accounts){
	deployer.deploy(TokenClaimer);
	deployer.deploy(TestTokenClaimer);
	deployer.deploy(USDT);
	deployer.deploy(StdERC20);
}
