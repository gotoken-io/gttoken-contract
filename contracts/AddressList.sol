pragma solidity >=0.4.21 <0.6.0;

import "./utils/Arrays.sol";
import "./MultiSigTools.sol";

contract AddressList{
  using AddressArray for address[];
  mapping(address => bool) private address_status;
  address[] public addresses;

  constructor() public{}

  function get_all_addresses() public view returns(address[] memory){
    return addresses;
  }

  function get_address(uint i) public view returns(address){
    require(i < addresses.length, "AddressList:get_address, out of range");
    return addresses[i];
  }

  function get_address_num() public view returns(uint){
    return addresses.length;
  }

  function is_address_exist(address addr) public view returns(bool){
    return address_status[addr];
  }

  function _add_address(address addr) internal{
    if(address_status[addr]) return;
    address_status[addr] = true;
    addresses.push(addr);
  }

  function _remove_address(address addr) internal{
    if(!address_status[addr]) return;
    address_status[addr] = false;
    addresses.remove(addr);
  }

  function _reset() internal{
    for(uint i = 0; i < addresses.length; i++){
      address_status[addresses[i]] = false;
    }
    delete addresses;
  }
}

contract TrustList is AddressList, MultiSigTools{

  event AddTrust(address addr);
  event RemoveTrust(address addr);

  constructor(address[] memory _list, address _multisig) public MultiSigTools(_multisig){
    for(uint i = 0; i < _list.length; i++){
      _add_address(_list[i]);
    }
  }

  function is_trusted(address addr) public view returns(bool){
    return is_address_exist(addr);
  }

  function get_trusted(uint i) public view returns(address){
    return get_address(i);
  }

  function get_trusted_num() public view returns(uint){
    return get_address_num();
  }

  function add_trusted(uint64 id, address addr) public
    only_signer is_majority_sig(id, "add_trusted"){
    _add_address(addr);
    emit AddTrust(addr);
  }
  function add_multi_trusted(uint64 id, address[] memory _list) public
    only_signer is_majority_sig(id, "add_multi_trusted"){
    for(uint i = 0; i < _list.length; i++){
      _add_address(_list[i]);
      emit AddTrust(_list[i]);
    }
  }

  function remove_trusted(uint64 id, address addr) public
    only_signer is_majority_sig(id, "remove_trusted"){
    _remove_address(addr);
    emit RemoveTrust(addr);
  }

  function remove_multi_trusted(uint64 id, address[] memory _list) public
  only_signer is_majority_sig(id, "remove_multi_trusted"){
    for(uint i = 0; i < _list.length; i++){
      _remove_address(_list[i]);
      emit RemoveTrust(_list[i]);
    }
  }
}

contract TrustListFactory{
  event NewTrustList(address addr, address[] list, address multisig);

  function createTrustList(address[] memory _list, address _multisig) public returns(address){
    TrustList tl = new TrustList(_list, _multisig);
    emit NewTrustList(address(tl), _list, _multisig);
    return address(tl);
  }
}

