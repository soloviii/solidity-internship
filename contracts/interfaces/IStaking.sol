// SPDX-License-Identifier: MIT
pragma solidity 0.8.10;

interface IStaking {
    struct StakingInfo {
        uint256 stakingPeriod;
        uint256 feePercentage;
        uint256 cooldown;
    }

    event SetRewards(
        uint256 _start,
        uint256 _finish,
        uint256 _rewardsAmount,
        uint256 _apy
    );
    event Stake(address sender, uint256 amount);
    event Unstake(address sender, uint256 amount);

    function setRewards(
        uint256 _start,
        uint256 _finish,
        uint256 _rewardsAmount,
        uint256 _apy
    ) external;

    function stake(uint256 _amount) external;

    function unstake() external;
}
