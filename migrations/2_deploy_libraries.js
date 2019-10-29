const AddressArray = artifacts.require("AddressArray");
const SafeMath = artifacts.require("SafeMath");

module.exports = function(deployer, network, accounts){
  deployer.deploy(AddressArray);
  deployer.deploy(SafeMath);
};
