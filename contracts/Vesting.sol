// SPDX-License-Identifier: MIT
pragma solidity 0.8.10;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/math/Math.sol";
import "./interfaces/IVesting.sol";
import "./MyToken.sol";

/// @title Vesting
/// @author Applicature
/// @notice This Smart Contract provides the vesting of tokens that will be unlocking until a certain date
/// @dev This Smart Contract provides the vesting of tokens that will be unlocking until a certain date
contract Vesting is IVesting, Ownable {
    using Math for uint256;

    /// @notice Store constant of percentage 100
    /// @dev Store constant of percentage 100
    uint256 public constant MAX_INITIAL_PERCENTAGE = 100;

    /// @notice Store the initial percentage by each vesting allocation
    /// @dev Store the initial percentage by each vesting allocation
    mapping(Allocation => uint256) public vestingInitialPercentage;

    /// @notice Store amount of tokens given per investors
    /// @dev Store amount of tokens given per investors
    mapping(address => uint256) public userTokens;

    /// @notice Store amounts of reward tokens that were paid to recipients
    /// @dev Store amounts of reward tokens that were paid to recipients
    mapping(address => uint256) public rewardsPaid;

    /// @notice Store the initial timestamp in unix
    /// @dev Store the initial timestamp in unix
    uint256 private _initialTimestamp;

    /// @notice Store the reward token
    /// @dev Store the reward token
    MyToken private _rewardToken;

    /// @notice Store the info about current vesting
    /// @dev Store the info about current vesting
    VestingInfo private _vestingInfo;

    /// @notice Initialize contract
    /// @dev Initialize contract, sets reward token address & vesting info
    /// @param token_ the reward token address
    constructor(address token_) {
        vestingInitialPercentage[Allocation.Seed] = 10;
        vestingInitialPercentage[Allocation.Private] = 15;

        _vestingInfo.cliffDuration = 10 minutes;
        _vestingInfo.periodDuration = 6 minutes;
        _rewardToken = MyToken(token_);
    }

    /// @notice Sets initial timestamp(the start date of vesting)
    /// @dev Sets initial timestamp by owner only once
    /// @param initialTimestamp_ the initial timestamp in unix
    function setInitialTimestamp(uint256 initialTimestamp_)
        external
        override
        onlyOwner
    {
        require(
            _initialTimestamp == 0,
            "The initial timestamp has already been initialized"
        );
        _initialTimestamp = initialTimestamp_;
        emit SetInitialTimestamp(initialTimestamp_);
    }

    /// @notice Mint tokens for vesting contract and store amount of tokens given per investors
    /// @dev Mint tokens for vesting contract and store amount of tokens given per investors
    /// @param _investors the array of investors
    /// @param _amounts the amount of tokens
    /// @param _allocationType thetype of vesting allocation
    function addInvestors(
        address[] calldata _investors,
        uint256[] calldata _amounts,
        Allocation _allocationType
    ) external override onlyOwner {
        uint256 length = _investors.length;
        require(
            length != 0 && _investors.length == _amounts.length,
            "Arrays different length"
        );
        _vestingInfo.allocation = _allocationType;
        uint256 totalAmount = 0;
        for (uint256 i; i < length; i++) {
            userTokens[_investors[i]] = _amounts[i];
            totalAmount += _amounts[i];
        }
        _rewardToken.mint(address(this), totalAmount);
        emit AddInvestors(_investors, _amounts, _allocationType);
    }

    /// @notice Transfer accrued reward tokens to investor
    /// @dev Transfer accrued reward tokens to investor
    function withdrawTokens() external override {
        require(
            _initialTimestamp != 0,
            "The initial timestamp wasn't initialize"
        );
        uint256 amountToTransfer = _calculateUnlock(msg.sender);
        require(amountToTransfer > 0, "Amount is zero");
        rewardsPaid[msg.sender] += amountToTransfer;
        _rewardToken.transferTokens(msg.sender, amountToTransfer);
        emit Harvest(msg.sender, amountToTransfer);
    }

    /// @notice Compute unlocking amount of reward tokens to recipient
    /// @dev Compute unlocking amount of reward tokens to recipient
    /// @param _addr the address of investor
    /// @return the unlocking amount of reward tokens
    function _calculateUnlock(address _addr) internal view returns (uint256) {
        uint256 tokenAmount = userTokens[_addr];
        uint256 oldRewards = rewardsPaid[_addr];

        if (block.timestamp > _initialTimestamp + _vestingInfo.cliffDuration) {
            uint256 countPeriod = MAX_INITIAL_PERCENTAGE -
                vestingInitialPercentage[_vestingInfo.allocation];
            uint256 initialUnlockAmount = (tokenAmount *
                vestingInitialPercentage[_vestingInfo.allocation]) /
                MAX_INITIAL_PERCENTAGE;
            uint256 passedPeriod = Math.min(
                (block.timestamp -
                    _initialTimestamp -
                    _vestingInfo.cliffDuration) / _vestingInfo.periodDuration,
                countPeriod
            );
            tokenAmount =
                (((tokenAmount - initialUnlockAmount) * passedPeriod) /
                    countPeriod) +
                initialUnlockAmount;
        } else {
            tokenAmount = 0;
        }
        return tokenAmount > oldRewards ? tokenAmount - oldRewards : 0;
    }
}
