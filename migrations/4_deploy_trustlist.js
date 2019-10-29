const TrustListFactory = artifacts.require("TrustListFactory")
const AddressArray = artifacts.require("AddressArray")

async function performMigration(deployer, network, accounts) {
    await AddressArray.deployed();
    await deployer.link(AddressArray, TrustListFactory);
  await deployer.deploy(TrustListFactory);
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
