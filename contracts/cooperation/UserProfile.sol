pragma solidity >=0.4.21 <0.6.0;

import "../MultiSigTools.sol";
import "../utils/TokenClaimer.sol";

contract UserProfile is MultiSigTools, TokenClaimer{
  struct UProfileData{
    bool exists;
    string name;
    string email;
    string avatar;
    string intro;
  }

  mapping (address => UProfileData) public user_data;
  uint public total_user_number;
  uint public removed_user_number;

  bool public on_service;

  event AddUser(address _addr, string _name, string _email, string _avatar, string _intro);
  event RemoveUser(address _addr);
  event ChangeItem(address _addr, string _item, string _old, string _new);
  event Pause();
  event Unpause();


  constructor(address _multisig) MultiSigTools(_multisig) public {
    total_user_number = 0;
    on_service = true;
  }

  function addUser(string memory _name,
                  string memory _email,
                  string memory _avatar,
                  string memory _intro) public returns(bool){
    require(on_service, "not on service");
    require(!user_data[msg.sender].exists, "already exist");

    UProfileData storage upd = user_data[msg.sender];
    upd.name = _name;
    upd.email = _email;
    upd.avatar = _avatar;
    upd.intro = _intro;
    upd.exists = true;

    emit AddUser(msg.sender, _name, _email, _avatar, _intro);
    total_user_number += 1;
    return true;
  }

  function removeUser() public returns(bool){
    require(user_data[msg.sender].exists, "not exist");
    emit RemoveUser(msg.sender);
    delete user_data[msg.sender];
    total_user_number -= 1;
    removed_user_number += 1;
    return true;
  }

  function changeName(string memory _name) public returns(bool){
    require(on_service, "not on service");
    require(user_data[msg.sender].exists, "not exist");
    UProfileData storage upd = user_data[msg.sender];
    string memory oldName = upd.name;
    upd.name = _name;
    emit ChangeItem(msg.sender, "name", oldName, _name);
    return true;
  }

  function changeEmail(string memory _email) public returns(bool){
    require(on_service, "not on service");
    require(user_data[msg.sender].exists, "not exist");

    UProfileData storage upd = user_data[msg.sender];
    string memory oldEmail = upd.email;
    upd.email= _email;
    emit ChangeItem(msg.sender, "email", oldEmail, _email);
    return true;
  }
  function changeAvatar(string memory _avatar) public returns(bool){
    require(on_service, "not on service");
    require(user_data[msg.sender].exists, "not exist");

    UProfileData storage upd = user_data[msg.sender];
    string memory oldAvatar = upd.avatar;
    upd.avatar = _avatar;
    emit ChangeItem(msg.sender, "avatar", oldAvatar, _avatar);
    return true;
  }
  function changeIntro(string memory _intro) public returns(bool){
    require(on_service, "not on service");
    require(user_data[msg.sender].exists, "not exist");

    UProfileData storage upd = user_data[msg.sender];
    string memory oldIntro = upd.intro;
    upd.intro= _intro;
    emit ChangeItem(msg.sender, "intro", oldIntro, _intro);
    return true;
  }

  function userExists(address _addr) public view returns(bool){
    return user_data[_addr].exists;
  }
  function userInfo(address _addr) public view returns(string memory name, string memory email, string memory avatar, string memory intro){
    require(user_data[_addr].exists, "not exist");
    UProfileData storage upd = user_data[_addr];
    return (upd.name, upd.email, upd.avatar, upd.intro);
  }

  function claimStdTokens(uint64 id, address _token, address payable to) public only_signer is_majority_sig(id, "claimStdTokens"){
    _claimStdTokens(_token, to);
  }
  function pauseService(uint64 id) public only_signer is_majority_sig(id, "pauseService"){
    on_service = false;
    emit Pause();
  }
  function unpauseService(uint64 id) public only_signer is_majority_sig(id, "unpauseService"){
    on_service = true;
    emit Unpause();
  }
}

contract UserProfileFactory{
  event NewUserProfileContract(address addr);

  function createUserProfile(address _multisig) public returns(address addr){
    UserProfile up = new UserProfile(_multisig);
    emit NewUserProfileContract(address(up));
    return address(up);
  }
}
