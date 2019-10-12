const TestERC20 = artifacts.require("TestERC20");
const TestAddressList = artifacts.require("TestAddressList");
const TestPausable = artifacts.require("TestPausable");
const AddressArray = artifacts.require("AddressArray");

module.exports = function(deployer, network, accounts){
  deployer.deploy(AddressArray);
  deployer.deploy(TestPausable);
  deployer.link(AddressArray, TestAddressList);
  deployer.deploy(TestAddressList);
  addr = "0x0000000000000000000000000000000000000000";
  deployer.deploy(TestERC20, addr, 0, "TEST", 18, "TST", true);
};
