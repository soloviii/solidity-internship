// SPDX-License-Identifier: MIT
pragma solidity 0.8.10;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "./interfaces/IStaking.sol";
import "./MyToken.sol";

contract Staking is IStaking, Ownable {
    using SafeERC20 for IERC20;

    uint256 public constant DECIMALS18 = 10**18;

    uint256 public apy;
    uint256 public startDate;
    uint256 public endDate;
    uint256 public totalSupply;

    IERC20 public stakingToken;
    IERC20 public rewardToken;
    StakingInfo public stakingInfo;

    mapping(address => uint256) public userRewardPerYear;
    mapping(address => uint256) public staked;

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

    function calculateRewardPerYear(uint256 amount_)
        public
        view
        returns (uint256)
    {
        return (amount_ * (100 + apy)) / 100 - amount_;
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
        startDate = _start;
        endDate = _finish;
        apy = _apy;
        emit SetRewards(_start, _finish, _rewardsAmount, _apy);
    }

    function stake(uint256 _amount) external virtual override {
        require(block.timestamp < endDate, "The staking time is gone");
        require(_amount > 0, "ERROR_AMOUNT_IS_ZERO");
        require(totalSupply + _amount <= 5 * 10**6, "ERROR_MAX_TOTAL_SUPPLY");

        staked[msg.sender] += _amount;
        totalSupply += _amount;
        userRewardPerYear[msg.sender] = calculateRewardPerYear(
            staked[msg.sender]
        );
        stakingToken.safeTransferFrom(msg.sender, address(this), _amount);
        emit Stake(msg.sender, _amount);
    }

    function unstake() external virtual override {
        require(
            block.timestamp > endDate + stakingInfo.cooldown,
            "The cooldown is not finish"
        );
        uint256 amountToTransfer = staked[msg.sender];
        require(amountToTransfer != 0, "There is no staked tokens");
        staked[msg.sender] = 0;
        stakingToken.transfer(msg.sender, amountToTransfer);

        amountToTransfer =
            (userRewardPerYear[msg.sender] * (block.timestamp - endDate)) /
            365 days;
        if (block.timestamp < endDate + stakingInfo.stakingPeriod) {
            amountToTransfer =
                (amountToTransfer * (100 - stakingInfo.feePercentage)) /
                100;
        }
        rewardToken.safeTransfer(msg.sender, amountToTransfer);
        emit Unstake(msg.sender, amountToTransfer);
    }
}
