// SPDX-License-Identifier: MIT
pragma solidity 0.8.10;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "./interfaces/IStaking.sol";
import "./MyToken.sol";

contract Staking is IStaking, Ownable {
    using SafeERC20 for IERC20;

    uint256 public apy;
    uint256 public rewardTokenAmount;
    IERC20 public rewardToken;
    StakingInfo public stakingInfo;

    uint256 private _startDate;
    uint256 private _endDate;

    mapping(address => uint256) public staked;

    constructor(address rewardToken_) {
        require(rewardToken_ != address(0), "ERROR_INVALID_ADDRESS");
        rewardToken = IERC20(rewardToken_);
        stakingInfo.feePercentage = 40;
        stakingInfo.cooldown = 10 days;
        stakingInfo.stakingPeriod = 60 days;
    }

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
        require(
            _rewardsAmount != 0 && _rewardsAmount <= 500_000,
            "Incorrect amount of tokens"
        );
        require(_apy != 0 && _apy <= 10, "Incorrect apy");

        rewardToken.safeTransferFrom(msg.sender, address(this), _rewardsAmount);
        _startDate = _start;
        _endDate = _finish;
        rewardTokenAmount = _rewardsAmount;
        apy = _apy;
        emit SetRewards(_start, _finish, _rewardsAmount, _apy);
    }

    function stake(uint256 _amount) external virtual override {
        require(block.timestamp < _endDate, "The staking time is gone");
        require(_amount > 0, "ERROR_AMOUNT_IS_ZERO");
        rewardToken.safeTransferFrom(msg.sender, address(this), _amount);
        staked[msg.sender] += _amount;
        emit Stake(msg.sender, _amount);
    }

    function unstake() external virtual override {
        require(
            block.timestamp > _endDate + stakingInfo.cooldown,
            "The cooldown is not finish"
        );
        uint256 amountToTransfer = calculateReward();
        if (block.timestamp < _endDate + stakingInfo.stakingPeriod) {
            amountToTransfer =
                (amountToTransfer * (100 - stakingInfo.feePercentage)) /
                100;
        }
        require(amountToTransfer > 0, "The amount is zero");
        amountToTransfer = amountToTransfer + staked[msg.sender];
        staked[msg.sender] = 0;
        rewardToken.safeTransfer(msg.sender, amountToTransfer);
        emit Unstake(msg.sender, amountToTransfer);
    }

    function calculateReward() internal view returns (uint256) {
        uint256 blocksPassed;
        //will accrued reward tokens during 1 year
        if (block.timestamp < _endDate + 365 days)
            blocksPassed = block.timestamp - _endDate;
        else blocksPassed = _endDate + 365 days;
        return (staked[msg.sender] * blocksPassed * 100) / 365 days;
    }
}
