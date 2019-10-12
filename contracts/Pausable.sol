pragma solidity >=0.4.21 <0.6.0;

contract Pausable{
  /* Hardcoded constants to save gas
   *     bytes32 private constant DEFAULT = keccak256("_internal_default_status");
   *         */
  bytes32 private constant DEFAULT = 0xe55fa852ec66688fa70405e771908c66cc3036301008016aac1cf4f9d2cfd27e;

  mapping (bytes32 => bool) private pause_status;

  event Paused(bytes32 item);
  event Unpaused(bytes32 item);

  constructor() public{
  }

  modifier when_paused(){
    require(pause_status[DEFAULT]== true, "require paused");
    _;
  }
  modifier when_item_paused(bytes32 item){
    require(pause_status[item]== true, "require item paused");
    _;
  }

  modifier when_not_paused(){
    require(pause_status[DEFAULT]== false, "require not paused");
    _;
  }
  modifier when_item_not_paused(bytes32 item){
    require(pause_status[item]== false, "require item not paused");
    _;
  }

  function is_paused() public view returns(bool){
    return pause_status[DEFAULT];
  }

  function is_item_paused(bytes32 item) public view returns(bool){
    return pause_status[item];
  }

  function is_not_paused() public view returns (bool){
    return !pause_status[DEFAULT];
  }

  function is_item_not_paused(bytes32 item) public view returns (bool){
    return !pause_status[item];
  }

  function _pause() internal when_not_paused {
    pause_status[DEFAULT] = true;
    emit Paused(DEFAULT);
  }

  function _pause_item(bytes32 item) internal when_item_not_paused(item) {
    pause_status[item] = true;
    emit Paused(item);
  }

  function _unpause() internal when_paused{
    pause_status[DEFAULT] = false;
    emit Unpaused(DEFAULT);
  }

  function _unpause_item(bytes32 item) internal when_item_paused(item) {
    pause_status[item] = false;
    emit Unpaused(item);
  }
}

