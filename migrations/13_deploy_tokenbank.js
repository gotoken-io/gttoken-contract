const ERC20TokenBankFactory = artifacts.require("ERC20TokenBankFactory")

async function performMigration(deployer, network, accounts) {
    await deployer.deploy(ERC20TokenBankFactory);
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
