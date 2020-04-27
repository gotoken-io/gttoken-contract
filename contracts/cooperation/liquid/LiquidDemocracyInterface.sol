pragma solidity >=0.4.21 <0.6.0;
contract LiquidDemocracyInterface{
  function setNoMajority(bool t) public ;
  function getVoterCount() public view returns(uint);
  function getWeight(address addr) public view returns(uint) ;
  function getDelegatee(address addr) public view returns (address [] memory);
  function getDelegator(address addr) public view returns(address);
  function delegate(address _to) public returns(bool);
  function undelegate() public returns(bool);
  function setWeight(address addr, uint weight) public returns(bool);
  function removeVoter(address addr) public returns(bool);
  function lastUpdateHeight() public view returns(uint);
}
