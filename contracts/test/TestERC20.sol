pragma solidity >=0.4.21 <0.6.0;


import "../ERC20Impl.sol";

contract TestERC20 is ERC20Base{

    constructor(
        ERC20Base _parentToken,
        uint _parentSnapShotBlock,
        string memory _tokenName,
        uint8 _decimalUnits,
        string memory _tokenSymbol,
        bool _transfersEnabled
    )  public ERC20Base(_parentToken, _parentSnapShotBlock, _tokenName,
    _decimalUnits, _tokenSymbol, _transfersEnabled){}

  function generateTokens(address _owner, uint _amount) public returns(bool){
    return _generateTokens(_owner, _amount);
  }
  function destroyTokens(address _owner, uint _amount) public returns(bool){
    return _destroyTokens(_owner, _amount);
  }
  function enableTransfers(bool _transfersEnabled) public {
    _enableTransfers(_transfersEnabled);
  }
}
