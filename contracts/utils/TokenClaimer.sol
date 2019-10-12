pragma solidity >=0.4.21 <0.6.0;

contract TransferableTokenA{
    function balanceOf(address _owner) public returns (uint256 balance) ;
    function transfer(address _to, uint256 _amount) public returns (bool success) ;
    function transferFrom(address _from, address _to, uint256 _amount) public returns (bool success) ;
}

contract TransferableTokenB{
    function balanceOf(address _owner) public returns (uint256 balance) ;
    function transfer(address _to, uint256 _amount) public ;
    function transferFrom(address _from, address _to, uint256 _amount) public;
}

contract TokenClaimer{

    event ClaimedTokens(address indexed _token, address indexed _to, uint _amount);
    /// @notice This method can be used by the controller to extract mistakenly
    ///  sent tokens to this contract.
    /// @param _token The address of the token contract that you want to recover
    ///  set to 0 in case you want to extract ether.
  function _claimStdTokens(address _token, address payable to) internal{
        if (_token == address(0x0)) {
            to.transfer(address(this).balance);
            return;
        }
        TransferableTokenA token = TransferableTokenA(_token);
        uint balance = token.balanceOf(address(this));
        token.transfer(to, balance);
        emit ClaimedTokens(_token, to, balance);
  }

    /// @notice This method can be used by the controller to extract mistakenly
    ///  sent tokens to this contract.
    /// @param _token The address of the token contract that you want to recover
    ///  set to 0 in case you want to extract ether.
  function _claimUSDTStyleTokens(address _token, address payable to) internal{
        if (_token == address(0x0)) {
            to.transfer(address(this).balance);
            return;
        }
        TransferableTokenB token = TransferableTokenB(_token);
        uint balance = token.balanceOf(address(this));
        token.transfer(to, balance);
        emit ClaimedTokens(_token, to, balance);
  }
}
