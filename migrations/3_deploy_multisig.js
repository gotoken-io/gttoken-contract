const MultiSigFactory = artifacts.require("MultiSigFactory")

async function performMigration(deployer, network, accounts) {
  await deployer.deploy(MultiSigFactory);
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
