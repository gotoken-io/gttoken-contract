pragma solidity >=0.4.21 <0.6.0;
import "../MultiSigTools.sol";
import "../TrustListTools.sol";
import "../utils/TokenClaimer.sol";
//import "../utils/SafeMath.sol";

contract ERC20TokenBank is MultiSigTools, TokenClaimer, TrustListTools{

  string public token_name;
  address public erc20_token_addr;

  event withdraw_token(address to, uint256 amount);
  event issue_token(address to, uint256 amount);

  constructor(string memory name, address token_contract,
             address _multisig,
             address _tlist) MultiSigTools(_multisig) TrustListTools(_tlist) public{
    token_name = name;
    erc20_token_addr = token_contract;
  }

  function claimStdTokens(uint64 id, address _token, address payable to) public only_signer is_majority_sig(id, "claimStdTokens"){
    _claimStdTokens(_token, to);
  }

  function balance() public returns(uint){
    TransferableToken erc20_token = TransferableToken(erc20_token_addr);
    return erc20_token.balanceOf(address(this));
  }

  function token() public view returns(address, string memory){
    return (erc20_token_addr, token_name);
  }

  function transfer(uint64 id, address to, uint tokens)
    public
    only_signer
    is_majority_sig(id, "transfer")
  returns (bool success){
    require(tokens <= balance(), "not enough tokens");
    (bool status,) = erc20_token_addr.call(abi.encodeWithSignature("transfer(address,uint256)", to, tokens));
    require(status, "call failed");
    emit withdraw_token(to, tokens);
    return true;
  }

  function issue(address _to, uint _amount)
    public
    is_trusted(msg.sender)
    returns (bool success){
      require(_amount <= balance(), "not enough tokens");
      (bool status,) = erc20_token_addr.call(abi.encodeWithSignature("transfer(address,uint256)", _to, _amount));
      require(status, "call failed");
      emit issue_token(_to, _amount);
      return true;
    }
}


contract ERC20TokenBankFactory {
  event CreateERC20TokenBank(string name, address addr);

  function newERC20TokenBank(string memory name, address token_contract, address multisig, address tlist) public returns(ERC20TokenBank){
    ERC20TokenBank addr = new ERC20TokenBank(name, token_contract, multisig, tlist);
    emit CreateERC20TokenBank(name, address(addr));
    return addr;
  }
}
