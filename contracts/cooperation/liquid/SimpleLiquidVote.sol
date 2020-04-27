pragma solidity >=0.4.21 <0.6.0;
import "../../utils/Arrays.sol";
import "./LiquidDemocracyTools.sol";

contract LiquidVoteBase is LiquidDemocracyTools{
  address owner;

  struct vote_result_t{
    uint total;
    bool exist;
  }

  mapping (bytes32 => vote_result_t) public voteResults;
  bytes32[] public allChoice;

  constructor(address _addr) LiquidDemocracyTools(_addr) public{
    owner = msg.sender;
  }

  modifier isOwner{
    require(msg.sender == owner, "only owner can call this");
    _;
  }

  function transferOwner(address new_owner) public isOwner{
    require(new_owner != address(0x0), "transferOwner: invalid address");
    owner = new_owner;
  }

  function addChoice(bytes32 hash) public isOwner{
    voteResults[hash].total = 0;
    voteResults[hash].exist = true;
    allChoice.push(hash);
  }

  function getChoiceNumber() public view returns(uint){
    return allChoice.length;
  }

  function getChoiceVoteNumber(bytes32 hash) public returns(uint);

  function isChoiceExist(bytes32 hash) public view returns(bool){
    return voteResults[hash].exist;
  }

  function addVoteNumberForChoice(bytes32 hash, uint n) internal{
    require(voteResults[hash].exist, "addVoteNumberForChoice, choice not exist");
    voteResults[hash].total += n;
  }

  function reduceVoteNumberForChoice(bytes32 hash, uint n) internal{
    require(voteResults[hash].exist, "reduceVoteNumberForChoice, choice not exist");
    voteResults[hash].total -= n;
  }
}

contract SimpleLiquidVote is LiquidVoteBase{

  using AddressArray for address[];

  mapping(address => bytes32) voted_options;
  address[] public voted_voters;

  uint public last_cal_height;
  bool public enable_public_vote;

  constructor(address _delegation) LiquidVoteBase(_delegation) public {
    last_cal_height = block.number;
    enable_public_vote = true;
  }

  function _refreshAllVotes() internal{
    for(uint i = 0; i < allChoice.length; i++){
      voteResults[allChoice[i]].total = 0;
    }

    for(uint i = 0; i < voted_voters.length; i++){
      uint power = get_total_power(voted_voters[i]);
      voteResults[voted_options[voted_voters[i]]].total += power;
    }
    last_cal_height = block.number;
  }

  function _voteChoice(bytes32 option, address voter) internal{
    if(!voted_voters.exists(voter)){
      voted_voters.push(voter);
    }
    require(voteResults[option].exist, "no such choice");
    if(lastUpdateHeight() >= last_cal_height){
      _refreshAllVotes();
    }

    uint power = get_total_power(voter);
    bool voted_before = false;
    if(voted_options[voter] != bytes32(0x0)){
      voted_before = true;
      bytes32 old = voted_options[voter];
      if(old == option){
        return ;
      }else{
        reduceVoteNumberForChoice(old, power);
      }
    }

    addVoteNumberForChoice(option, power);
    voted_options[voter] = option;

    address parent = get_voted_parent(voter);
    if(!voted_before && parent != address(0x0)){
      bytes32 old = voted_options[parent];
      reduceVoteNumberForChoice(old, power);
    }
    last_cal_height = block.number;
  }

  function enablePublicVote(bool b) public isOwner{
    enable_public_vote = b;
  }
  function recordVoteChoice(bytes32 option, address voter) public isOwner{
    _voteChoice(option, voter);
  }

  function voteChoice(bytes32 option) public{
    require(enable_public_vote, "public vote is not enabled");
    _voteChoice(option, msg.sender);
  }

  event ChoiceVoteNumber(uint number);
  function getChoiceVoteNumber(bytes32 hash) public returns(uint){
    if(lastUpdateHeight() >= last_cal_height){
      _refreshAllVotes();
    }
    emit ChoiceVoteNumber(voteResults[hash].total);
    return voteResults[hash].total;
  }

  function get_total_power(address _addr) internal view returns(uint){
    address[] memory to_visit = new address[](getVoterCount());
    uint power = 0;
    uint index = 0;
    to_visit[index] = _addr;
    index ++;
    while(index != 0){
      index --;
      address last = to_visit[index];
      power += getWeight(last);
      address[] memory children = getDelegatee(last);
      for(uint i = 0; i < children.length; i++){
        if(voted_options[children[i]] == bytes32(0x0)){
          to_visit[index] = children[i];
          index ++;
        }
      }
    }
    return power;
  }

  function get_voted_parent(address _addr) internal view returns(address){
    require(_addr != address(0x0), "get_voted_parent: invalid address");
    address next = getDelegator(_addr);
    while(next != address(0x0)){
      if(voted_options[next] != bytes32(0x0)){
        return next;
      }
      next = getDelegator(next);
    }
    return address(0x0);
  }
  function getVoted(address from) public view returns(bytes32){
    return voted_options[from];
  }
}

contract SimpleLiquidVoteFactory{
  event NewLiquidVote(address addr);
  function createLiquidVote(address delegation)  public returns(address){
      SimpleLiquidVote sv = new SimpleLiquidVote(delegation);
      sv.transferOwner(msg.sender);
      emit NewLiquidVote(address(sv));
      return address (sv);
  }
}
