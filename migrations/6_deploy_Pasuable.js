const Pausable = artifacts.require("Pausable")
const TestPausable = artifacts.require("TestPausable")

module.exports = function(deployer, network, accounts){
	deployer.deploy(Pausable);
	deployer.link(Pausable, TestPausable);
	deployer.deploy(TestPausable);
}