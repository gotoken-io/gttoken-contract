const InitIssueAndLockFactory = artifacts.require("InitIssueAndLockFactory")
const AddressArray = artifacts.require("AddressArray");

module.exports = function(deployer, network, accounts){
  deployer.deploy(AddressArray);
  deployer.link(AddressArray, InitIssueAndLockFactory);
  deployer.deploy(InitIssueAndLockFactory);
}

