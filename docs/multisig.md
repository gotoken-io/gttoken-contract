多签合约
=======

多签是指多人共同管理的能力，多签合约提供了这种能力，并且能够很方便的将这种能力扩展到不同的场景中，例如，通过多签管理链上的资产，通过多签进行决议。

此处提供了两种多签，无权重的多签以及有权重的多签，均使用相应的[工厂方法](./factory.md)创建。

## 无权重的多签合约
### 介绍
无权重的多签合约定义了一组多签人，对于某一个决议，多签的人数超过总人数的一半时，则决议生效。假设多签人数为5人，对于某一个决议，有3个人通过了同一个决议，则决议通过。

多签合约能够同时处理多个决议，并且对于每个决议，每个多签人都能独立的发起表决，而无需依赖于任何决议的发起方。举个例子，假设一笔资产使用了多签进行管理，多签人分别为A，B，C，D，E，目前存在一个决议，需要将某个数量的资产转移到某个地址，则多签人可能独立的发起如下的表决：
```
    A: transfer(id1, amount1, addr1);
    B: transfer(id1, amount1, addr1);
    C: transfer(id1, amount2, addr1);
    D: transfer(id1, amount2, addr1);
    E: transfer(id1, amount2, addr1);
```
注意：每次多签进行表决时都需要提供一个唯一的id，作为待表决事项的标识，这是因为对于同一个表决事项每个多签人的输入可能不同，对于不同表决事项，输入又可能相同。关于如何获得相应的id，请参见`get_unused_invoke_id`。

### 方法
多签合约提供了一些方法，最主要的方法有以下三个：
#### 修改多签人
```
function reform_signers(uint64 id, address[] calldata s);
```
参数为多签id及新的多签人列表。

注意，调用该方法时需要注意可能的失败，即对于最先表决的大多数，该方法能够调用成功并生效，而对于后面参与表决的调用，如果已经被移出新的多签人列表，则相应的调用失败。

#### 查看多签id
```
function get_unused_invoke_id(string memory name) public view returns(uint64);
```
参数为函数名。
#### 查看多签人列表
```
function get_signers() public view returns(address[] memory);
```

### 使用
由于受到代码大小的限制，不建议直接使用多签合约，而是通过如下的封装使用，
```

contract MultiSigInterface{
  function update_and_check_reach_majority(uint64 id, string memory name, bytes32 hash, address sender) public returns (bool);
  function is_signer(address addr) public view returns(bool);
}

contract MultiSigTools{
  MultiSigInterface public multisig_contract;
  constructor(address _contract) public{
    require(_contract!= address(0x0));
    multisig_contract = MultiSigInterface(_contract);
  }

  modifier only_signer{
    require(multisig_contract.is_signer(msg.sender), "only a signer can call in MultiSigTools");
    _;
  }

  modifier is_majority_sig(uint64 id, string memory name) {
    bytes32 hash = keccak256(abi.encodePacked(msg.sig, msg.data));
    if(multisig_contract.update_and_check_reach_majority(id, name, hash, msg.sender)){
      _;
    }
  }

  event TransferMultiSig(address _old, address _new);

  function transfer_multisig(uint64 id, address _contract) public only_signer
  is_majority_sig(id, "transfer_multisig"){
    require(_contract != address(0x0));
    address old = address(multisig_contract);
    multisig_contract = MultiSigInterface(_contract);
    emit TransferMultiSig(old, _contract);
  }
}

contract MyContract is MultiSigTools{
  //...
  constructor(address multisig) MultiSigTools(multisig){
      //...
  }
  function myMethod(uint64 id, param uint) public only_signer is_majority_sig(id, "myMethod"){
      //...
    }
}
```
其中MyContract中的构造函数中包含了多签合约的地址，`myMethod`则是一个多签方法，当用同样的参数调用该方法的人数超过半数时，则该方法被执行，否则不会被执行。

上述封装还包含了另一个方法，`transfer_multisig`，用于更换多签合约。注意，如果更换的合约不是一个有效的多签合约，则所有多签方法都会失效，所以，格外小心！

## 有权重的多签合约
类似无权重的多签合约，不同是每个多签人都有对应的权重，当表决的权重超过半数的权重时，则多签生效，具体参见[WeightMultiSig.sol](../contracts/cooperation/WeightMultiSig.sol)。

## 总结
多签合约要求每个多签人都独立的调用合约进行表决，而不是通过对已有提案进行签名的方式，这看似十分冗余。其背后的考量是尽可能让每个多签人知晓每次表决的内容。相对的，如果只是对一个提案进行表决，多签人很有可能在表决时错过某些重要的提案信息，从而造成损失。
