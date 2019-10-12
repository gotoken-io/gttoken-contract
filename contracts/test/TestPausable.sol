pragma solidity >=0.4.21 <0.6.0;

import "../Pausable.sol";

contract TestPausable is Pausable{

  function pause() public {
    _pause();
  }

  function pause_item(bytes32 item) public {
    _pause_item(item);
  }

  function unpause() public {
    _unpause();
  }

  function unpause_item(bytes32 item) public {
    _unpause_item(item);
  }
}
