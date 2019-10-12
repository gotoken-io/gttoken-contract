const GTTokenFactory=artifacts.require("GTTokenFactory")
const AddressArray = artifacts.require("AddressArray");

module.exports = function(deployer, network, accounts){
  deployer.deploy(AddressArray);
  deployer.link(AddressArray, GTTokenFactory);
  deployer.deploy(GTTokenFactory);
};
