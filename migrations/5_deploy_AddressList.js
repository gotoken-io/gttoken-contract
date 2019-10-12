const TestAddressList = artifacts.require("TestAddressList")
//const AddressList = artifacts.require("AddressList")
const AddressArray = artifacts.require("AddressArray")

module.exports = function(deployer, network, accounts){
	deployer.deploy(AddressArray);
	deployer.link(AddressArray, TestAddressList);
	deployer.deploy(TestAddressList);
}