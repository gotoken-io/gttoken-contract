pragma solidity >=0.4.21 <0.6.0;
import "./utils/TokenClaimer.sol";
import "./MultiSigTools.sol";
import "./utils/Arrays.sol";

contract GTTokenInterface is TransferableToken{
    function destroyTokens(address _owner, uint _amount) public returns (bool);
    function generateTokens(address _owner, uint _amount) public returns (bool);
}

contract InitIssueAndLock is MultiSigTools{
  using AddressArray for address[];

  uint public unlock_block_number;
  uint[] public amounts;
  address[] public addrs;
  bool public issued;
  address public gt_contract;

  event Issue(uint total, address[] addrs, uint[] amounts);

  constructor(address _gt_contract, uint _unlock_block_number, address[] memory _addrs, uint[] memory _amounts, address _multisig) MultiSigTools(_multisig) public {
    require(_amounts.length == _addrs.length);
    require(_unlock_block_number > block.number);
    for(uint i = 0; i < _addrs.length; i++){
      addrs.push(_addrs[i]);
      amounts.push(_amounts[i]);
    }
    issued = false;
    unlock_block_number = _unlock_block_number;
    gt_contract = _gt_contract;
  }

  function issue() public{
    require(issued == false, "issued already");
    require(unlock_block_number <= block.number, "not ready to unlock");

    GTTokenInterface token = GTTokenInterface(gt_contract);

    uint total = 0;
    for(uint i = 0; i < addrs.length; i++){
      token.generateTokens(addrs[i], amounts[i]);
      total = total + amounts[i];
    }
    issued = true;
    emit Issue(total, addrs, amounts);
  }

  function replace(uint64 id, address old_addr, address new_addr) public only_signer is_majority_sig(id, "replace"){
    require(issued == false, "issued already");
    addrs.replace(old_addr, new_addr);
  }

  function get_number_of_addrs() public view returns(uint){
    return addrs.length;
  }

  function get_addr_amount(uint i) public view returns(address addr, uint amount){
    addr = addrs[i];
    amount = amounts[i];
  }

  function get_init_and_lock_status() public view returns(address[] memory , uint[] memory ){
    return (addrs, amounts);
  }
}

contract InitIssueAndLockFactory{

  event NewIssueAndLock(address addr);

  function createIssueAndLock(address _gt_contract,
                              uint _unlock_block_number,
                              address[] memory _addrs,
                             uint[] memory _amounts,
                             address _multisig) public returns(InitIssueAndLock){
    InitIssueAndLock c = new InitIssueAndLock(_gt_contract,
                                             _unlock_block_number,
                                             _addrs,
                                             _amounts,
                                             _multisig);
    emit NewIssueAndLock(address(c));
    return c;
  }
}
