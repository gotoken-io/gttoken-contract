const USDT = artifacts.require("USDT")
const FundAndDistributeFactory = artifacts.require("FundAndDistributeFactory")
const AddressArray = artifacts.require("AddressArray");

module.exports = function(deployer, network, accounts){
  deployer.deploy(USDT);
  deployer.deploy(AddressArray);
  deployer.link(AddressArray, FundAndDistributeFactory);
  deployer.deploy(FundAndDistributeFactory);
};
