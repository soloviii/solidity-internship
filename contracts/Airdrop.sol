// SPDX-License-Identifier: MIT
pragma solidity 0.8.10;

import "./interfaces/IAirdrop.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/cryptography/draft-EIP712.sol";

/// @title Airdrop
/// @author Applicature
/// @notice This smart contract is used for sending coins or tokens to wallet addresses
/// @dev This smart contract is used for sending coins or tokens to wallet addresses
contract Airdrop is IAirdrop, Ownable, EIP712 {
    using SafeERC20 for IERC20;

    /// @notice the address of reward token
    /// @dev the address of reward token
    IERC20 public rewardToken;

    /// @notice the accrued reward tokens per users
    /// @dev the accrued reward tokens per users
    mapping(address => uint256) public userTokens;

    /// @notice the accrued ether per users
    /// @dev the accrued ether per users
    mapping(address => uint256) public userEthers;

    /// @notice Store nonces of recipients
    /// @dev Store nonces of recipients
    mapping(address => mapping(uint256 => bool)) internal _nonces;

    /// @notice Store hash to sign drop transaction
    /// @dev Store computed 256 bit keccak hash
    bytes32 private constant _CONTAINER_TYPEHASE =
        keccak256(
            "Container(address sender,address[] recipients,uint256[] amounts,uint256 deadline,uint256 nonce)"
        );

    /// #if_succeeds {:msg "the reward token must be initialized correctly"} rewardToken == IERC20(_token);
    /// @notice Initialize contract
    /// @dev Initialize contract, sets reward token address
    /// @param _token the reward token address
    constructor(address _token) EIP712("Airdrop", "v1") {
        require(_token != address(0), "ERROR_INVALID_ADDRESS");
        rewardToken = IERC20(_token);
    }

    /// #if_succeeds {:msg "the balance must increase by amount"} rewardToken.balanceOf(address(this)) ==
    /// old(rewardToken.balanceOf(address(this)) + _amount);
    /// @notice Transfers tokens from owner to smart contract
    /// @dev Transfers tokens from owner to smart contract
    /// @param _amount the amount of tokens
    function depositTokens(uint256 _amount) external override onlyOwner {
        require(_amount > 0, "ERROR_WRONG_AMOUNT");
        rewardToken.safeTransferFrom(msg.sender, address(this), _amount);
        emit DepositTokens(msg.sender, _amount);
    }

    /// #if_succeeds {:msg "the balance ether must increase by amount"} address(this).balance == old(address(this).balance + msg.value);
    /// @notice Transfers ethers from owner to smart contract
    /// @dev Transfers ethers from owner to smart contract
    function depositEther() external payable override onlyOwner {
        emit DepositEther(msg.sender, msg.value);
    }

    /// #if_succeeds {:msg "nonce should be broken"} old(_nonces[msg.sender][_nonce]) == true;
    /// @notice Sets eligible token amounts to recipients
    /// @dev Sets eligible token amounts to recipients by owner
    /// @param _recipients the addresses of recipients
    /// @param _amounts the amounts of tokens to send for each recipient
    /// @param _nonce the counters that keeps track of the number of transactions sent by an account
    /// @param _deadline the deadline of signature
    /// @param _v Signature parameter
    /// @param _r Signature parameter
    /// @param _s Signature parameter
    function dropTokens(
        address[] calldata _recipients,
        uint256[] calldata _amounts,
        uint256 _nonce,
        uint256 _deadline,
        uint8 _v,
        bytes32 _r,
        bytes32 _s
    ) external override onlyOwner {
        require(!_nonces[msg.sender][_nonce], "Nonce used before");
        require(
            _canDropFunds(_recipients, _amounts, _nonce, _deadline, _v, _r, _s),
            "Invalid signer"
        );
        uint256 length = _recipients.length;
        require(
            length != 0 && _recipients.length == _amounts.length,
            "Arrays different length"
        );
        _nonces[msg.sender][_nonce] = true;
        for (uint256 i; i < length; i++) {
            require(
                rewardToken.balanceOf(address(this)) >= _amounts[i],
                "Not enough tokens on the contract"
            );
            userTokens[_recipients[i]] = _amounts[i];
        }
    }

    /// #if_succeeds {:msg "nonce should be broken"} old(_nonces[msg.sender][_nonce]) == true;
    /// @notice Sets eligible ether amount to recipients
    /// @dev Sets eligible ether amount to recipients by owner
    /// @param _recipients the addresses of recipients
    /// @param _amounts the amounts of ether to send for each recipient
    /// @param _nonce the counters that keeps track of the number of transactions sent by an account
    /// @param _deadline the deadline of signature
    /// @param _v Signature parameter
    /// @param _r Signature parameter
    /// @param _s Signature parameter
    function dropEther(
        address[] calldata _recipients,
        uint256[] calldata _amounts,
        uint256 _nonce,
        uint256 _deadline,
        uint8 _v,
        bytes32 _r,
        bytes32 _s
    ) external override onlyOwner {
        require(!_nonces[msg.sender][_nonce], "Nonce used before");
        require(
            _canDropFunds(_recipients, _amounts, _nonce, _deadline, _v, _r, _s),
            "Invalid signer"
        );
        uint256 length = _recipients.length;
        require(
            length != 0 && _recipients.length == _amounts.length,
            "Arrays different length"
        );
        _nonces[msg.sender][_nonce] = true;
        for (uint256 i; i < _recipients.length; i++) {
            require(
                address(this).balance >= _amounts[i],
                "Not enough ethers on the contract"
            );
            userEthers[_recipients[i]] = _amounts[i];
        }
    }

    /// #if_succeeds {:msg "the reward token must be initialized correctly"} rewardToken == IERC20(_token);
    /// @notice Update reward token address
    /// @dev Update reward token address by owner
    /// @param _token the reward token address
    function updateTokenAddress(address _token) external override onlyOwner {
        require(_token != address(0), "ERROR_INVALID_ADDRESS");
        rewardToken = IERC20(_token);
    }

    /// #if_succeeds {:msg "the amount of tokens must be zero"} rewardToken.balanceOf(address(this)) == 0;
    /// @notice Withdraws all reward tokens that remaining on SC
    /// @dev Withdraws all reward tokens that remaining on SC by owner
    function withdrawTokens() external override onlyOwner {
        uint256 amount = rewardToken.balanceOf(address(this));
        require(amount > 0, "ERROR_WRONG_AMOUNT");
        rewardToken.safeTransfer(msg.sender, amount);
    }

    /// #if_succeeds {:msg "the amount of ethers must be zero"} address(this).balance == 0;
    /// @notice Withdraws all ethers that remaining on SC
    /// @dev Withdraws all ethers that remaining on SC by owner
    function withdrawEther() external override onlyOwner {
        uint256 amount = address(this).balance;
        require(amount > 0, "ERROR_WRONG_AMOUNT");
        (bool sent, ) = msg.sender.call{value: amount}("");
        require(sent, "Failed to send Ether");
    }

    /// #if_succeeds {:msg "the amount of user tokens must be zero"} userTokens[msg.sender] == 0;
    /// @notice Withdraws all accrued reward tokens for user
    /// @dev Withdraws all accrued reward tokens for user
    function claimToken() external override {
        uint256 amount = userTokens[msg.sender];
        require(amount > 0, "The user don't have tokens");
        require(
            rewardToken.balanceOf(address(this)) >= amount,
            "Not enough tokens on the contract"
        );
        userTokens[msg.sender] = 0;
        rewardToken.safeTransfer(msg.sender, amount);
        emit ClaimToken(msg.sender, amount);
    }

    /// #if_succeeds {:msg "the amount of user ether must be zero"} userEthers[msg.sender] == 0;
    /// @notice Withdraws all accrued ether for user
    /// @dev Withdraws all accrued ether for user
    function claimEther() external override {
        uint256 amount = userEthers[msg.sender];
        require(amount > 0, "The user don't have ethers");
        require(
            address(this).balance >= amount,
            "Not enough ethers on the contract"
        );
        userEthers[msg.sender] = 0;
        (bool sent, ) = msg.sender.call{value: amount}("");
        require(sent, "Failed to send Ether");
        emit ClaimEther(msg.sender, amount);
    }

    /// @notice Checks whether the sender sign transaction
    /// @dev Checks whether the sender sign transaction
    /// @param _recipients the addresses of recipients
    /// @param _amounts the amounts of funds to send for each recipient
    /// @param _nonce the counters that keeps track of the number of transactions sent by an account
    /// @param _deadline the deadline of signature
    /// @param _v Signature parameter
    /// @param _r Signature parameter
    /// @param _s Signature parameter
    function _canDropFunds(
        address[] calldata _recipients,
        uint256[] calldata _amounts,
        uint256 _nonce,
        uint256 _deadline,
        uint8 _v,
        bytes32 _r,
        bytes32 _s
    ) internal view returns (bool) {
        require(_deadline > block.timestamp, "ERROR_TIME_OUT");
        bytes32 structHash = keccak256(
            abi.encode(
                _CONTAINER_TYPEHASE,
                msg.sender,
                keccak256(abi.encodePacked(_recipients)),
                keccak256(abi.encodePacked(_amounts)),
                _deadline,
                _nonce
            )
        );
        bytes32 hash = _hashTypedDataV4(structHash);
        address messageSigner = ECDSA.recover(hash, _v, _r, _s);

        return messageSigner == owner();
    }
}
