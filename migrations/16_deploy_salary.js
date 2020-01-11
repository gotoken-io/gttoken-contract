const ERC20SalaryFactory = artifacts.require("ERC20SalaryFactory")
const AddressArray = artifacts.require("AddressArray")
const SafeMath = artifacts.require("SafeMath")

async function performMigration(deployer, network, accounts) {
  await deployer.link(SafeMath, ERC20SalaryFactory);
  await deployer.link(AddressArray, ERC20SalaryFactory);
  await deployer.deploy(ERC20SalaryFactory);
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
