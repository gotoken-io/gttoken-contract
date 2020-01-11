const DoubleCurveFundFactory = artifacts.require("DoubleCurveFundFactory")
const SafeMath = artifacts.require("SafeMath")

async function performMigration(deployer, network, accounts) {
  await deployer.link(SafeMath, DoubleCurveFundFactory);
  await deployer.deploy(DoubleCurveFundFactory);
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
