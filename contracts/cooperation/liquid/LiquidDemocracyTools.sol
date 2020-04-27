pragma solidity >=0.4.21 <0.6.0;
import "./LiquidDemocracyInterface.sol";

contract LiquidDemocracyTools {
  LiquidDemocracyInterface public liquid_democracy_contract;
  constructor(address _addr) public{
    require(_addr != address(0x0), "invalid address");
    liquid_democracy_contract = LiquidDemocracyInterface(_addr);
  }
  function getVoterCount() public view returns(uint){
    return liquid_democracy_contract.getVoterCount();
  }
  function getWeight(address addr) public view returns(uint) {
    return liquid_democracy_contract.getWeight(addr);
  }
  function getDelegatee(address addr) public view returns (address [] memory){
    return liquid_democracy_contract.getDelegatee(addr);
  }
  function getDelegator(address addr) public view returns(address){
    return liquid_democracy_contract.getDelegator(addr);
  }
  function delegate(address _to) public returns(bool){
    return liquid_democracy_contract.delegate(_to);
  }
  function undelegate() public returns(bool){
    return liquid_democracy_contract.undelegate();
  }
  function setWeight(address addr, uint weight) public returns(bool){
    return liquid_democracy_contract.setWeight(addr, weight);
  }
  function removeVoter(address addr) public returns(bool){
    return liquid_democracy_contract.removeVoter(addr);
  }
  function lastUpdateHeight() public view returns(uint){
    return liquid_democracy_contract.lastUpdateHeight();
  }
}
