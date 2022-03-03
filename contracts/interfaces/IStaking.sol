// SPDX-License-Identifier: MIT
pragma solidity 0.8.10;

/// @title IVesting
/// @author Applicature
/// @notice There is an interface for Staking Smart Contract
/// @dev There is an interface for Staking Smart Contract
interface IStaking {
    /// @notice Structured data type for variables that store information about staking
    /// @dev Structured data type for variables that store information about staking
    struct StakingInfo {
        uint256 stakingPeriod;
        uint256 feePercentage;
        uint256 cooldown;
    }

    /// @notice Emit when owner set rewards info
    /// @dev Emit when owner set rewards info
    /// @param _start the start date of stake
    /// @param _finish the finish date of stake
    /// @param _rewardsAmount the amount of reward tokens
    /// @param _apy the annual percentage yield
    event SetRewards(
        uint256 _start,
        uint256 _finish,
        uint256 _rewardsAmount,
        uint256 _apy
    );

    /// @notice Emit when user stake tokens
    /// @dev Emit when user stake tokens
    /// @param sender the user that staked tokens
    /// @param amount the amount of staked tokens
    event Stake(address sender, uint256 amount);

    /// @notice Emit when user unstake tokens
    /// @dev Emit when user unstake tokens
    /// @param sender the user that unstaked tokens
    /// @param amount the amount of reward tokens
    event Unstake(address sender, uint256 amount);

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
    ) external;

    /// @notice Transfer the amount of tokens from the user account and register staking for him
    /// @dev Transfer the amount of tokens from the user account and register staking for him
    /// @param _amount the amount of staked tokens
    function stake(uint256 _amount) external;

    /// @notice Transfer all staked tokens and rewards to the user account and update staking details for him
    /// @dev Transfer all staked tokens and rewards to the user account and update staking details for him
    function unstake() external;
}
