const MultiSigFactory = artifacts.require("MultiSigFactory")
const OldMultiSigFactory = artifacts.require("OldMultiSigFactory")

async function performMigration(deployer, network, accounts) {
  await deployer.deploy(MultiSigFactory);
  if(network.includes("ganache")){
    await deployer.deploy(OldMultiSigFactory);
  }
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
