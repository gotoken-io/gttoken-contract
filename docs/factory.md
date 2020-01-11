工厂方法

======
本代码库中几乎所有的合约都包含了一个工厂方法，以[MultiSig.sol](../contracts/MultiSig.sol)为例，合约的结构如下：
```
contract MultiSig{
    //...
}

contract MultiSigFactory{
  event NewMultiSig(address addr, address[] signers);

  function createMultiSig(address[] memory _signers) public returns(address){
    MultiSig ms = new MultiSig(_signers);
    emit NewMultiSig(address(ms), _signers);
    return address(ms);
  }
}
```
因此，实际的合约都是通过对应的工厂合约创建，合约地址则通过调用工厂合约之后的event得到。
