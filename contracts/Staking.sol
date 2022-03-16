// SPDX-License-Identifier: MIT
pragma solidity 0.8.10;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "./interfaces/IStaking.sol";
import "./MyToken.sol";

/// @title Staking
/// @author Applicature
/// @notice This is example of a contract that rewards users for staking their token.
/// @dev This is example of a contract that rewards users for staking their token.
contract Staking is IStaking, Ownable {
    using SafeERC20 for IERC20;

    /// @notice the constant that store decimals 18
    /// @dev the constant that store decimals 18
    uint256 public constant DECIMALS18 = 10**18;

    /// @notice Store the annual percentage yield
    /// @dev Store the annual percentage yield
    uint256 public apy;

    /// @notice Store the start date of stake
    /// @dev Store the start date of stake
    uint256 public startDate;

    /// @notice Store the finish date of stake
    /// @dev Store the finish date of stake
    uint256 public endDate;

    /// @notice Store the total supply of staked tokens
    /// @dev Store the total supply of staked tokens
    uint256 public totalSupply;

    /// @notice Store the ERC20 staking token
    /// @dev Store the ERC20 staking token
    IERC20 public stakingToken;

    /// @notice Store the ERC20 reward token
    /// @dev Store the ERC20 reward token
    IERC20 public rewardToken;

    /// @notice Store the info about staking
    /// @dev Store the info about staking
    StakingInfo public stakingInfo;

    /// @notice Store the users staked amount tokens
    /// @dev Store the users staked amount tokens
    mapping(address => uint256) public staked;

    /// @notice Store the users last staked time
    /// @dev Store the users last staked time
    mapping(address => uint256) public stakeTime;

    /// @notice Store the users reward tokens
    /// @dev Store the users reward tokens
    mapping(address => uint256) public rewards;

    /// @notice Initialize contract
    /// @dev Initialize contract, sets reward/staking token addresses & staking info
    /// @param rewardToken_ the reward token address
    /// @param stakingToken_ the staking token address
    constructor(address rewardToken_, address stakingToken_) {
        require(
            rewardToken_ != address(0) && stakingToken_ != address(0),
            "ERROR_INVALID_ADDRESS"
        );
        rewardToken = IERC20(rewardToken_);
        stakingToken = IERC20(stakingToken_);
        stakingInfo.feePercentage = 40;
        stakingInfo.cooldown = 10 days;
        stakingInfo.stakingPeriod = 60 days;
    }

    /// @notice Add reward to contract for a specific period
    /// @dev  Add reward to contract for a specific period
    /// @param _start the start date of stake
    /// @param _finish the finish date of stake
    /// @param _rewardsAmount the amount of reward tokens
    /// @param _apy the annual percentage yield
    function setRewards(
        uint256 _start,
        uint256 _finish,
        uint256 _rewardsAmount,
        uint256 _apy
    ) external virtual override onlyOwner {
        require(
            _start < _finish && block.timestamp < _start,
            "Incorrect dates"
        );
        require(_apy != 0 && _apy <= 10, "Incorrect apy");
        require(
            _rewardsAmount != 0 && _rewardsAmount / _apy == 50000 * DECIMALS18,
            "Incorrect amount of tokens"
        );

        rewardToken.safeTransferFrom(msg.sender, address(this), _rewardsAmount);
        startDate = _start;
        endDate = _finish;
        apy = _apy;
        emit SetRewards(_start, _finish, _rewardsAmount, _apy);
    }

    /// @notice Transfer the amount of tokens from the user account and register staking for him
    /// @dev Transfer the amount of tokens from the user account and register staking for him
    /// @param _amount the amount of staked tokens
    function stake(uint256 _amount) external virtual override {
        require(_amount > 0, "ERROR_AMOUNT_IS_ZERO");
        require(
            totalSupply + _amount <= 5_000_000 * DECIMALS18,
            "ERROR_MAX_TOTAL_SUPPLY"
        );
        require(
            block.timestamp > stakeTime[msg.sender] + stakingInfo.cooldown,
            "The cooldown has not been passed"
        );
        rewards[msg.sender] += calculateRewardTokens(
            msg.sender,
            staked[msg.sender]
        );
        stakeTime[msg.sender] = block.timestamp;
        staked[msg.sender] += _amount;
        totalSupply += _amount;
        stakingToken.safeTransferFrom(msg.sender, address(this), _amount);
        emit Stake(msg.sender, _amount);
    }

    /// @notice Transfer all staked tokens and rewards to the user account and update staking details for him
    /// @dev Transfer all staked tokens and rewards to the user account and update staking details for him
    function unstake() external virtual override {
        uint256 amountToTransfer = staked[msg.sender];
        require(amountToTransfer != 0, "There is no staked tokens");
        rewards[msg.sender] += calculateRewardTokens(
            msg.sender,
            amountToTransfer
        );
        staked[msg.sender] = 0;
        totalSupply -= amountToTransfer;
        stakingToken.safeTransfer(msg.sender, amountToTransfer);
        amountToTransfer = rewards[msg.sender];
        if (
            block.timestamp < stakeTime[msg.sender] + stakingInfo.stakingPeriod
        ) {
            amountToTransfer =
                (amountToTransfer * (100 - stakingInfo.feePercentage)) /
                100;
        }
        rewards[msg.sender] = 0;
        rewardToken.safeTransfer(msg.sender, amountToTransfer);
        emit Unstake(msg.sender, amountToTransfer);
    }

    /// @notice Calculate accrued reward tokens by staked tokens
    /// @dev Calculate accrued reward tokens by staked tokens
    /// @param amount_ the amount of staked tokens
    /// @return the accrued reward tokens
    function calculateRewardTokens(address sender_, uint256 amount_)
        internal
        view
        returns (uint256)
    {
        if (block.timestamp >= startDate) {
            uint256 stakeTimeSender = stakeTime[sender_] >= startDate
                ? stakeTime[sender_]
                : startDate;
            uint256 finishDate = block.timestamp <= endDate
                ? block.timestamp
                : endDate;
            if (finishDate < stakeTimeSender) return 0;
            uint256 rewardPerYear = (amount_ * (100 + apy)) / 100 - amount_;
            return (rewardPerYear * (finishDate - stakeTimeSender)) / 365 days;
        }
        return 0;
    }
}
