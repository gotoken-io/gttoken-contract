投票
=====

投票是指对一个提案进行表决的过程，投票的模型有很多，计票方法也有很多，未来代码库中会包含更多的投票模型。

目前的投票合约为[SimpleMultiSigVote.sol](../contracts/cooperation/SimpleMultiSigVote.sol)，这是一种使用多签（有权重或无权重）进行投票的方法。

所有投票合约使用相应的[工厂方法](./factory.md)创建。

## SimpleMultiSigVote
[SimpleMultiSigVote](../contracts/cooperation/SimpleMultiSigVote.sol)合约的构造函数包含了一个多签合约的地址，这个地址可以是一个有权重的多签合约地址，也可以是一个无权重的多签合约地址，根据多签合约地址的不同，投票行为也不尽相同。

#### 创建投票
```
function createVote(bytes32 _hash, uint _start_height, uint _end_height) public returns (bool);
```
任何人都可以创建一个投票，参数为投票内容的hash，投票开始高度以及投票结束高度。

#### 修改投票
```
function changeVoteInfo(bytes32 _hash, uint _start_height, uint _end_height, string memory announcement) public returns (bool);
```
只有投票的创建人可以修改投票内容，投票开始后无法修改。

#### 投票
```
function vote(uint64 id, bytes32 _hash, string memory _value) public returns (bool);
```
只有多签地址对应的多签人可以进行投票，参数中的多签id需要通过多签合约获得。

#### 投票结果是否超过半数
```
function isVoteDetermined(bytes32 _hash) public view returns (bool)
```
当对同一个结果进行的表决的人数过半时，则返回true，否则返回false。

#### 投票结果
```
function checkVoteValue(bytes32 _hash) public view returns(string memory value);
```
当投票结束或同一个结果进行的表决的人数过半时，返回投票结果。

#### 查看投票情况
```
function voteInfo(bytes32 _hash) public
  view returns(bool determined, uint start_height, uint end_height, address owner, string memory announcement, string memory value);
```