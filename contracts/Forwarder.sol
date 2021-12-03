// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/cryptography/draft-EIP712.sol";
import "hardhat/console.sol";

contract Forwarder is EIP712, Ownable {
    address public _kycSigner;

    bytes32 private constant FORWARD_CONTAINER_TYPEHASE =
        keccak256(
            "Container(address from,address to,uint256 amount,uint256 nonce,string data)"
        );

    mapping(address => bool) private _senderWhitelist;
    mapping(address => uint256) private _nonces;

    event LogForwarded(
        address indexed from,
        address to,
        uint256 amount,
        string data
    );

    constructor() EIP712("Forward", "v1") {}

    function forward(
        address payable _to,
        uint256 _nonce,
        string memory _data,
        uint8 _v,
        bytes32 _r,
        bytes32 _s
    ) external payable {
        require(_to != address(0), "forward to the zero address");
        require(
            isForwardPassed(
                msg.sender,
                _to,
                msg.value,
                _nonce,
                _data,
                _v,
                _r,
                _s
            ),
            "Invalid messageSigner"
        );
        (bool sent, ) = _to.call{value: msg.value}("");
        require(sent, "Failed to send Ether");
        emit LogForwarded(msg.sender, _to, msg.value, _data);
    }

    function setKycSigner(address kycSigner_) external onlyOwner {
        _kycSigner = kycSigner_;
    }

    function isForwardPassed(
        address _from,
        address _to,
        uint256 _amount,
        uint256 _nonce,
        string memory _data,
        uint8 _v,
        bytes32 _r,
        bytes32 _s
    ) public view returns (bool) {
        if (_senderWhitelist[_from]) {
            return true;
        } else {
            bytes32 structHash = keccak256(
                abi.encode(
                    FORWARD_CONTAINER_TYPEHASE,
                    _from,
                    _to,
                    _amount,
                    _nonce,
                    keccak256(bytes(_data))
                )
            );
            bytes32 hash = _hashTypedDataV4(structHash);
            address messageSigner = ECDSA.recover(hash, _v, _r, _s);
            return _nonces[_kycSigner] == _nonce && messageSigner == _kycSigner;
        }
    }

    function addSenderToWhitelist(address sender) external onlyOwner {
        require(
            !isWhitelisted(sender),
            "Sender address is already whitelisted"
        );
        _senderWhitelist[sender] = true;
    }

    function isWhitelisted(address sender) public view returns (bool) {
        return _senderWhitelist[sender];
    }

    function getNonce() public view returns (uint256) {
        return _nonces[msg.sender];
    }
}
