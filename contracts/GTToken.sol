pragma solidity >=0.4.21 <0.6.0;

import "./ERC20Impl.sol";
import "./utils/TokenClaimer.sol";
import "./TrustListTools.sol";
import "./MultiSigTools.sol";

contract GTToken is ERC20Base, MultiSigTools, TrustListTools, TokenClaimer{

  GTTokenFactory public tokenFactory;

  event NewCloneToken(address indexed _cloneToken, uint _snapshotBlock);

  constructor(
        GTTokenFactory _tokenFactory,
        ERC20Base _parentToken,
        uint _parentSnapShotBlock,
        string memory _tokenName,
        uint8 _decimalUnits,
        string memory _tokenSymbol,
        bool _transfersEnabled,
        address multisig,
        address _tlist)
    ERC20Base(_parentToken,
    _parentSnapShotBlock,
    _tokenName,
    _decimalUnits,
    _tokenSymbol,
    _transfersEnabled) MultiSigTools(multisig) TrustListTools(_tlist) public{
      tokenFactory = _tokenFactory;
    }

    function claimStdTokens(uint64 id, address _token, address payable to) public only_signer is_majority_sig(id, "claimStdTokens"){
      _claimStdTokens(_token, to);
    }

    function createCloneToken(
        string memory _cloneTokenName,
        uint8 _cloneDecimalUnits,
        string memory _cloneTokenSymbol,
        uint _snapshotBlock,
        bool _transfersEnabled,
        address _multisig,
        address _tlist
    )public returns(GTToken){

        uint256 snapshot = _snapshotBlock == 0 ? block.number - 1 : _snapshotBlock;
        GTToken cloneToken = tokenFactory.createCloneToken(this, snapshot,
            _cloneTokenName,
            _cloneDecimalUnits,
            _cloneTokenSymbol,
            _transfersEnabled,
            _multisig,
            _tlist
          );
        emit NewCloneToken(address(cloneToken), snapshot);
        return cloneToken;
    }

    function generateTokens(address _owner, uint _amount)
    public
    is_trusted(msg.sender)
    returns (bool){
      return _generateTokens(_owner, _amount);
    }

    function destroyTokens(address _owner, uint _amount)
    public
    is_trusted(msg.sender)
    returns (bool) {
      return _destroyTokens(_owner, _amount);
    }

    function enableTransfers(uint64 id, bool _transfersEnabled)
    public only_signer
    is_majority_sig(id, "enableTransfers"){
      _enableTransfers(_transfersEnabled);
    }
}

/// @dev This contract is used to generate clone contracts from a contract.
///  In solidity this is the way to create a contract from a contract of the
///  same class
contract GTTokenFactory {
  event NewToken(address indexed _cloneToken, uint _snapshotBlock);

    /// @notice Update the DApp by creating a new token with new functionalities
    ///  the msg.sender becomes the controller of this clone token
    /// @param _parentToken Address of the token being cloned
    /// @param _snapshotBlock Block of the parent token that will
    ///  determine the initial distribution of the clone token
    /// @param _tokenName Name of the new token
    /// @param _decimalUnits Number of decimals of the new token
    /// @param _tokenSymbol Token Symbol for the new token
    /// @param _transfersEnabled If true, tokens will be able to be transferred
    /// @return The address of the new token contract
    function createCloneToken(
        GTToken _parentToken,
        uint _snapshotBlock,
        string memory _tokenName,
        uint8 _decimalUnits,
        string memory _tokenSymbol,
        bool _transfersEnabled,
        address _multisig,
        address _tlist
    ) public returns (GTToken)
    {
        GTToken newToken = new GTToken(
            this,
            _parentToken,
            _snapshotBlock,
            _tokenName,
            _decimalUnits,
            _tokenSymbol,
            _transfersEnabled,
            _multisig,
            _tlist
        );
        emit NewToken(address(newToken), _snapshotBlock);

        return newToken;
    }
}
