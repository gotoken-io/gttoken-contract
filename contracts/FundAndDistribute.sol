pragma solidity >=0.4.21 <0.6.0;

import "./utils/TokenClaimer.sol";
import "./MultiSig.sol";
import "./utils/SafeMath.sol";
import "./AddressList.sol";
import "./Pausable.sol";

contract GTTokenInterface is TransferableTokenA{
    function destroyTokens(address _owner, uint _amount) public returns (bool);
    function generateTokens(address _owner, uint _amount) public returns (bool);
}

contract FunderList is AddressList{
  event AddFunder(address addr);
  event RemoveFunder(address addr);

  constructor() public{}

  modifier is_funder(address addr){
    require(is_address_exist(addr), "not a trusted issuer");
    _;
  }

  function is_trusted_funder(address addr) public view returns(bool){
    return is_address_exist(addr);
  }

  function get_trusted_funder(uint i) public view returns(address){
    return get_address(i);
  }

  function get_trusted_funder_num() public view returns(uint){
    return get_address_num();
  }

  function _add_trusted_funder(address addr) internal{
    _add_address(addr);
    emit AddFunder(addr);
  }
  function _remove_trusted_funder(address addr) internal{
    _remove_address(addr);
    emit RemoveFunder(addr);
  }
}

contract FDInterface{
  function exchange(uint amount) public returns(bool);
  function fund(uint amount) public returns (bool);
}

contract FundAndDistributeBase is FDInterface, MultiSig, TokenClaimer, SafeMath, FunderList, Pausable{
  string public name;
  string public desc;
  address public token_contract;
  uint public tokens_per_k_gt;
  uint public exchange_ratio; //actual is 10/exchange_ratio
  GTTokenInterface gt_token;

  event Fund(address addr, address token, uint cost_amount, uint remain, uint got_amount);
  event Exchange(address addr, address token, uint cost_amout, uint remain, uint got_amount);

  constructor(address _gt_token,
              string memory _name,
              string memory _desc,
              address _token_contract,
              address[] memory _signers) MultiSig(_signers) public{
    gt_token = GTTokenInterface(_gt_token);
    name = _name;
    desc = _desc;
    token_contract = _token_contract;
    tokens_per_k_gt = 1000000;
    exchange_ratio = 20; //1/2
  }

  function balance() public returns(uint){
      TransferableTokenA token = TransferableTokenA(address(gt_token));
      return token.balanceOf(address(this));
  }
  function transfer(uint64 id, address to, uint amount)
    public
    only_signer
    is_majority_sig(id, "transfer")
  returns (bool success){
      TransferableTokenA token = TransferableTokenA(address(gt_token));
      token.transfer(to, amount);
      return true;
  }

    function claimStdTokens(uint64 id, address _token, address payable to) public only_signer is_majority_sig(id, "claimStdTokens"){
      _claimStdTokens(_token, to);
    }
    function claimUSDTStyleTokens(uint64 id, address _token, address payable to) public only_signer is_majority_sig(id, "claimUSDTStyleTokens"){
      _claimUSDTStyleTokens(_token, to);
    }
    function pause(uint64 id) public only_signer is_majority_sig(id, "pause"){
      _pause();
    }
    function unpause(uint64 id) public only_signer is_majority_sig(id, "unpause"){
      _unpause();
    }

    function set_param(uint64 id, uint _tokens_per_k_gt, uint _exchange_ratio) public only_signer is_majority_sig(id, "set_param"){
      require(_tokens_per_k_gt > 0);
      require(_exchange_ratio > 0);
      tokens_per_k_gt = _tokens_per_k_gt;
      exchange_ratio = _exchange_ratio;
    }

    function add_funders(uint64 id, address[] memory s) public only_signer is_majority_sig(id, "add_funders"){
      for(uint i = 0; i < s.length; i++){
        _add_trusted_funder(s[i]);
      }
    }

    function remove_funder(uint64 id, address s) public only_signer is_majority_sig(id, "remove_funder"){
      _remove_trusted_funder(s);
    }

    function distribute(uint64 id, address to, uint amount) public only_signer is_majority_sig(id, "distribute"){
      TransferableTokenA token = TransferableTokenA(address(gt_token));
      token.transfer(to, amount);
    }

    /* @_amount: in token_contract unit, like USDT
     */
    function _fund(uint _amount) internal returns(uint remain){
      uint v = safeDiv(_amount, tokens_per_k_gt);
      uint cost = safeMul(v, tokens_per_k_gt);
      remain = safeSub(_amount, cost);
      v = safeMul(v, 1000);
      gt_token.generateTokens(msg.sender, v);
      gt_token.generateTokens(address(this), v);
      emit Fund(msg.sender, token_contract, cost, remain, v);
    }

    /* @_amount: in GTToken unit
     * @remain_token: in token_contract unit, like USDT
     */
    function _exchange(uint _amount) internal returns(uint remain_token){
      require(_amount > 0, "fund should be > 0");
      GTTokenInterface token = GTTokenInterface(address(gt_token));
      uint old_balance = token.balanceOf(msg.sender);
      require(old_balance >= _amount, "not enough amout");

      uint k_gts = safeDiv(_amount, 1000);
      uint cost = safeMul(k_gts, 1000);
      uint r = safeSub(_amount, cost);
      uint burn = _amount - r;
      if(burn > 0){
        token.destroyTokens(msg.sender, burn);
      }
      remain_token = safeMul(k_gts, tokens_per_k_gt);
      remain_token = safeDiv(safeMul(remain_token, 10), exchange_ratio);
      emit Exchange(msg.sender, token_contract,cost, r, remain_token);
    }
}


contract StdFundAndDistribute is FundAndDistributeBase{
  constructor(address _gt_token, string memory _name, string memory _desc, address _token_contract, address[] memory _signers)
  FundAndDistributeBase(_gt_token, _name, _desc, _token_contract, _signers) public{}

  function fund(uint amount) public when_not_paused is_funder(msg.sender) returns (bool){
    require(amount > 0, "fund should be > 0");
    TransferableTokenA token = TransferableTokenA(token_contract);
    uint old_balance = token.balanceOf(address(this));
    bool ret = token.transferFrom(msg.sender, address(this), amount);
    require(ret, "StdFundAndDistribute:fund, transferFrom return false");
    uint new_balance = token.balanceOf(address(this));
    require(new_balance == old_balance + amount, "StdFundAndDistribute:fund, invalid transfer");
    uint remain = _fund(amount);
    if(remain > 0){
      token.transfer(msg.sender, remain);
    }
    return true;
  }

  function exchange(uint amount) public when_not_paused returns(bool){
    TransferableTokenA etoken = TransferableTokenA(address(token_contract));
    uint ret_token_amount = _exchange(amount);
    if(ret_token_amount > 0){
      etoken.transfer(msg.sender, ret_token_amount);
    }
    return true;
  }
}

contract USDTStyleFundAndDistribute is FundAndDistributeBase{
  constructor(address _gt_token, string memory _name, string memory _desc, address _token_contract, address[] memory _signers)
  FundAndDistributeBase(_gt_token, _name, _desc, _token_contract, _signers) public{}

  event Log(uint i);
  function fund(uint amount) public when_not_paused is_funder(msg.sender) returns (bool){
    emit Log(0);
    require(amount > 0, "fund should be > 0");
    TransferableTokenB token = TransferableTokenB(token_contract);
    emit Log(1);
    uint old_balance = token.balanceOf(address(this));
    token.transferFrom(msg.sender, address(this), amount);
    uint new_balance = token.balanceOf(address(this));
    emit Log(2);
    require(new_balance == old_balance + amount, "USDTStyleFundAndDistribute:fund, invalid transfer");
    emit Log(3);
    uint remain = _fund(amount);
    emit Log(4);
    if(remain > 0){
      emit Log(5);
      token.transfer(msg.sender, remain);
      emit Log(6);
    }
    return true;
  }

  function exchange(uint amount) public when_not_paused returns(bool){
    TransferableTokenB etoken = TransferableTokenB(address(token_contract));
    uint ret_token_amount = _exchange(amount);
    if(ret_token_amount > 0){
      etoken.transfer(msg.sender, ret_token_amount);
    }
    return true;
  }
}


contract FundAndDistributeFactory{
  //function createETHTokenIssuer(address _gt_token, string memory _name, string memory _desc, address _pool, address[] memory _signer) public returns(address){
  //}

  event NewFund(address addr);

  function createStdERC20TokenIssuer(address _gt_token,
                                     string memory _name,
                                     string memory _desc,
                                     address _token_contract,
                                     address[] memory _signer) public returns(address){
    StdFundAndDistribute c = new StdFundAndDistribute(_gt_token, _name, _desc, _token_contract, _signer);
    emit NewFund(address(c));
    return address(c);
  }

  function createUSDTSytelERC20TokenIssuers(address _gt_token,
                                            string memory _name,
                                            string memory _desc,
                                            address _token_contract,
                                            address[] memory _signer
                                           ) public returns(address){

    USDTStyleFundAndDistribute c = new USDTStyleFundAndDistribute(_gt_token, _name, _desc, _token_contract, _signer);
    emit NewFund(address(c));
    return address(c);
  }
}
