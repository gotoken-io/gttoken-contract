const FundAndDistributeFactory = artifacts.require("FundAndDistributeFactory")
const SafeMath = artifacts.require("SafeMath");

async function performMigration(deployer, network, accounts) {
    await SafeMath.deployed();
    await deployer.link(SafeMath, FundAndDistributeFactory);
  await deployer.deploy(FundAndDistributeFactory);

    //await deployer.link(AddressArray, StdFundAndDistribute);
    //await deployer.link(TokenClaimer, StdFundAndDistribute);
    //await deployer.link(SafeMath, StdFundAndDistribute);
    //await deployer.link(TMultiSig, StdFundAndDistribute);
  //await deployer.deploy(StdFundAndDistribute);
}
module.exports = function(deployer, network, accounts){
deployer
    .then(function() {
      return performMigration(deployer, network, accounts)
    })
    .catch(error => {
      console.log(error)
      process.exit(1)
    })
};
