pragma solidity >=0.4.21 <0.6.0;

import "../MultiSigTools.sol";
import "../utils/TokenClaimer.sol";
import "../utils/SafeMath.sol";

contract SimpleMultiSigVote is MultiSigTools, TokenClaimer{

  struct InternalData{
    bool exist;
    bool determined;
    uint start_height;
    uint end_height;
    address owner;
    string announcement;
    string value;
  }

  mapping (bytes32 => InternalData) public vote_status;
  uint public determined_vote_number;
  uint public created_vote_number;

  constructor(address _multisig) MultiSigTools(_multisig) public{
    determined_vote_number = 0;
    created_vote_number = 0;
  }

  event VoteCreate(bytes32 _hash, uint _start_height, uint _end_height);
  event VoteChange(bytes32 _hash, uint _start_height, uint _end_height, string announcement);
  event VotePass(bytes32 _hash, string _value);

  modifier vote_exist(bytes32 _hash){
    require(vote_status[_hash].exist, "vote not exist");
    _;
  }

  function createVote(bytes32 _hash, uint _start_height, uint _end_height)
    public
    returns (bool){
    require(!vote_status[_hash].exist, "already exist");
    require(_end_height > block.number, "end height too small");
    require(_end_height > _start_height, "end height should be greater than start height");
    if(_start_height == 0){
      _start_height = block.number;
    }
    InternalData storage d = vote_status[_hash];

    d.exist = true;
    d.determined = false;
    d.start_height = _start_height;
    d.end_height = _end_height;
    d.owner = msg.sender;
    created_vote_number += 1;
    emit VoteCreate(_hash, _start_height, _end_height);
    return true;
  }

  function changeVoteInfo(bytes32 _hash, uint _start_height, uint _end_height, string memory announcement) public
    vote_exist(_hash)
    returns (bool){
    InternalData storage d = vote_status[_hash];
    require(d.owner == msg.sender, "only creator can change vote info");

    if(_end_height != 0){
      require(_end_height > block.number, "end height too small");
      d.end_height = _end_height;
    }
    require(d.start_height > block.number, "already start, cannot change start height");
    if(_start_height != 0){
      require(_start_height >= block.number, "start block too small");
      d.start_height = _start_height;
    }

    require(d.end_height > d.start_height, "end height should be greater than start height");

    d.announcement = announcement;
    emit VoteChange(_hash, _start_height, _end_height, announcement);
    return true;
  }

  function vote(uint64 id, bytes32 _hash, string memory _value) public
    vote_exist(_hash)
    only_signer
    is_majority_sig(id, "vote")
    returns (bool){
    InternalData storage d = vote_status[_hash];
    require(d.start_height <= block.number, "vote not start yet");
    require(d.end_height >= block.number, "vote already end");

    d.value = _value;
    d.determined = true;
    emit VotePass(_hash, _value);
    determined_vote_number += 1;
    return true;
  }

  function isVoteDetermined(bytes32 _hash) public view returns (bool){
    return vote_status[_hash].determined;
  }

  function checkVoteValue(bytes32 _hash) public view returns(string memory value){
    require(vote_status[_hash].exist, "not exist");
    require(vote_status[_hash].determined, "not determined");

    value = vote_status[_hash].value;
  }

  function voteInfo(bytes32 _hash) public
  vote_exist(_hash)
  view returns(bool determined, uint start_height, uint end_height, address owner, string memory announcement, string memory value){

    InternalData storage d = vote_status[_hash];
    return (d.determined, d.start_height, d.end_height, d.owner, d.announcement, d.value);
  }

  function claimStdTokens(uint64 id, address _token, address payable to) public only_signer is_majority_sig(id, "claimStdTokens"){
    _claimStdTokens(_token, to);
  }
}

contract SimpleMultiSigVoteFactory {
  event NewSimpleMultiSigVote(address addr);

  function createSimpleMultiSigVote(address _multisig) public returns(address){
    SimpleMultiSigVote smsv = new SimpleMultiSigVote(_multisig);

    emit NewSimpleMultiSigVote(address(smsv));
    return address(smsv);
  }
}
