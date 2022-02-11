// SPDX-License-Identifier: MIT
pragma solidity 0.8.10;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/cryptography/draft-EIP712.sol";
import "./interfaces/IAirdrop.sol";

contract Airdrop is IAirdrop, Ownable, EIP712 {
    IERC20 public rewardToken;
    mapping(address => uint256) public userTokens;
    mapping(address => uint256) public userEthers;

    bytes32 private constant _CONTAINER_TYPEHASE =
        keccak256("Container(address sender,uint256 deadline)");

    /// #if_succeeds {:msg "the reward token must be initialized correctly"} rewardToken == IERC20(_token);
    constructor(address _token) EIP712("Airdrop", "v1") {
        require(_token != address(0), "ERROR_INVALID_ADDRESS");
        rewardToken = IERC20(_token);
    }

    function canDropFunds(
        uint256 _deadline,
        uint8 _v,
        bytes32 _r,
        bytes32 _s
    ) internal view returns (bool) {
        require(_deadline > block.timestamp, "ERROR_TIME_OUT");
        bytes32 structHash = keccak256(
            abi.encode(_CONTAINER_TYPEHASE, msg.sender, _deadline)
        );
        bytes32 hash = _hashTypedDataV4(structHash);
        address messageSigner = ECDSA.recover(hash, _v, _r, _s);

        return messageSigner == owner();
    }

    /// #if_succeeds {:msg "the balance must increase by amount"} rewardToken.balanceOf(address(this)) ==
    /// old(rewardToken.balanceOf(address(this)) + _amount);
    /// @notice Transfers tokens from owner to smart contract
    /// @dev Transfers tokens from owner to smart contract
    /// @param _amount the amount of tokens
    function depositTokens(uint256 _amount) external override onlyOwner {
        require(_amount > 0, "ERROR_WRONG_AMOUNT");
        rewardToken.transferFrom(msg.sender, address(this), _amount);
        emit Deposit(msg.sender, _amount);
    }

    function depositEther() external payable override onlyOwner {}

    function dropTokens(
        address[] calldata _recipients,
        uint256[] calldata _amounts,
        uint256 _deadline,
        uint8 _v,
        bytes32 _r,
        bytes32 _s
    ) external override onlyOwner {
        require(canDropFunds(_deadline, _v, _r, _s), "Invalid signer");
        uint256 length = _recipients.length;
        require(
            length != 0 && _recipients.length == _amounts.length,
            "Arrays different length"
        );
        for (uint256 i; i < length; i++) {
            userTokens[_recipients[i]] = _amounts[i];
        }
    }

    function dropEther(
        address[] calldata _recipients,
        uint256[] calldata _amounts,
        uint256 _deadline,
        uint8 _v,
        bytes32 _r,
        bytes32 _s
    ) external override onlyOwner {
        require(canDropFunds(_deadline, _v, _r, _s), "Invalid signer");
        uint256 length = _recipients.length;
        require(
            length != 0 && _recipients.length == _amounts.length,
            "Arrays different length"
        );
        for (uint256 i; i < _recipients.length; i++) {
            userEthers[_recipients[i]] = _amounts[i];
        }
    }

    function updateTokenAddress(address _token) external override onlyOwner {
        require(_token != address(0), "ERROR_INVALID_ADDRESS");
        rewardToken = IERC20(_token);
    }

    /// #if_succeeds {:msg "the amount of tokens must be zero"} rewardToken.balanceOf(address(this)) == 0;
    function withdrawTokens() external override onlyOwner {
        uint256 amount = rewardToken.balanceOf(address(this));
        require(amount > 0, "ERROR_WRONG_AMOUNT");
        rewardToken.transfer(msg.sender, amount);
    }

    /// #if_succeeds {:msg "the amount of ethers must be zero"} address(this).balance == 0;
    function withdrawEther() external override onlyOwner {
        uint256 amount = address(this).balance;
        require(amount > 0, "ERROR_WRONG_AMOUNT");
        (bool sent, ) = msg.sender.call{value: amount}("");
        require(sent, "Failed to send Ether");
    }

    /// #if_succeeds {:msg "the amount of user tokens must be zero"} userTokens[msg.sender] == 0;
    function claimToken() external override {
        uint256 amount = userTokens[msg.sender];
        require(amount > 0, "The user don't have tokens");
        require(
            rewardToken.balanceOf(address(this)) >= amount,
            "Not enough tokens on the contract"
        );
        userTokens[msg.sender] = 0;
        rewardToken.transfer(msg.sender, amount);
        emit ClaimToken(msg.sender, amount);
    }

    /// #if_succeeds {:msg "the amount of user ether must be zero"} userEthers[msg.sender] == 0;
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
}
