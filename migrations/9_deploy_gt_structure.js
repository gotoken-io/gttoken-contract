const AddressArray = artifacts.require("AddressArray")
const getBlockNumber = require('./blockNumber')(web3)
const InitIssueAndLockFactory = artifacts.require("InitIssueAndLockFactory")
const InitIssueAndLock = artifacts.require('InitIssueAndLock')
const GTTokenFactory = artifacts.require("GTTokenFactory");
const GTToken = artifacts.require('GTToken')
const MultiSigFactory = artifacts.require("MultiSigFactory");
const MultiSig = artifacts.require("MultiSig");
const TrustListFactory = artifacts.require("TrustListFactory");
const TrustList = artifacts.require("TrustList");
const FundAndDistributeFactory = artifacts.require("FundAndDistributeFactory");
const FundAndDistribute = artifacts.require("FundAndDistribute");

const USDT = artifacts.require("USDT")

async function performMigration(deployer, network, accounts) {

  funders = [];
  funder_amount = [30000000000, 10000000000, 10000000000];
  usdt_address = '';
  block_until = (await getBlockNumber()) + 100;

  results = {}
  if(network.includes("ropsten")){
    console.log("reset for ropsten")
    funders = ['0xC7f3e458A4EcFa84b37a2D00e6bA414bd57fDAa4', '0xD272Be26d62c0C2988Cfbd5Cb04EBcBe85bB5263', '0x7e2E17A940da45eF568410B1323bED161084455F'];
    usdt = await deployer.deploy(USDT)
    await usdt.issue("0xC7f3e458A4EcFa84b37a2D00e6bA414bd57fDAa4", 100000000);
    await usdt.issue("0xD272Be26d62c0C2988Cfbd5Cb04EBcBe85bB5263", 100000000);
    console.log("USDT: ", usdt.address);
    usdt_address = usdt.address;
    block_until = (await getBlockNumber()) + 100;
  }else if(network.includes("main")){
    console.log("reset for main")
    funders = ['0xe855B4cb17eA22CAE1be5FeB7fCDC0Ef67DCa84D', '0x3e6F107Fd4A95AF86108c1F44E502A6136AD386e', '0x57955d7AA271DbDDE92D67e0EF52D90c6E4089cA'];
    usdt_address = '0xdAC17F958D2ee523a2206206994597C13D831ec7';
    block_until = (await getBlockNumber()) + 6*185000;
  }else if(network.includes("ganache")){
    funders = accounts.slice(0, 3);
    await USDT.deployed();
    usdt_address = USDT.address;
  }
  results['usdt'] = usdt_address;

  console.log("network: ", network)
  console.log("signers: ", funders)

          multisig_factory = await MultiSigFactory.deployed();
          console.log("MultiSigFactory: ", multisig_factory.address)
          tokentx = await multisig_factory.createMultiSig(funders);
          multisig = await MultiSig.at(tokentx.logs[0].args.addr);
          console.log("MultiSig: ", multisig.address)
          results['multisig'] = multisig.address;

          trustlist_factory = await TrustListFactory.deployed();
          console.log("TrustListFactory: ", trustlist_factory.address)
          tokentx = await trustlist_factory.createTrustList([], multisig.address);
          token_trustlist = await TrustList.at(tokentx.logs[0].args.addr);
          console.log("GTToken TrustList: ", token_trustlist.address);
          results['gotoken_issuers'] = token_trustlist.address;

          tokentx = await trustlist_factory.createTrustList(funders, multisig.address);
          fund_trustlist = await TrustList.at(tokentx.logs[0].args.addr);
          console.log("FundAndDistribute TrustList: ", fund_trustlist.address);
          results["funders"] = fund_trustlist.address;

          token_factory = await GTTokenFactory.deployed();
          console.log("GTTokenFactory: ", token_factory.address);
          tokentx = await token_factory.createCloneToken('0x0000000000000000000000000000000000000000', 0, "GoToken", 6, "GOO", true, multisig.address, token_trustlist.address);
          gttoken = await GTToken.at(tokentx.logs[0].args._cloneToken);
          console.log("GTToken: ", gttoken.address);
          results["gotoken"] = gttoken.address;

      init_lock_factory = await InitIssueAndLockFactory.deployed();
      console.log("InitIssueAndLockFactory: ", init_lock_factory.address);
      tx = await init_lock_factory.createIssueAndLock(gttoken.address,
          block_until,
          funders,
          funder_amount,
          multisig.address);
      init_lock = await InitIssueAndLock.at(tx.logs[0].args.addr);
      console.log("InitIssueAndLock: ", init_lock.address);
      results["init_lock"] = init_lock.address;
      console.log('InitIssueAndLock lock until: ', block_until);


      fund_factory = await FundAndDistributeFactory.deployed();
      console.log("FundAndDistributeFactory: ", fund_factory.address);
      ctx = await fund_factory.createStdERC20TokenIssuer(gttoken.address,
          "USDT for GOO", "Only for Funders", usdt_address, multisig.address, fund_trustlist.address);
      fund = await FundAndDistribute.at(ctx.logs[0].args.addr);
      console.log("FundAndDistribute: ", fund.address);
      results["fund"] = fund.address;

      require('fs').writeFile (network + ".json", JSON.stringify(results), function(err) {
      if (err) throw err;
      console.log('complete');
    }
);
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
