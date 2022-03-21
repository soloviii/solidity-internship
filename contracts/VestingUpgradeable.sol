// SPDX-License-Identifier: MIT
pragma solidity 0.8.10;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/math/MathUpgradeable.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "./interfaces/IVesting.sol";
import "./MyToken.sol";

/// @title VestingUpgradeable
/// @author Applicature
/// @notice This Smart Contract provides the vesting of tokens that will be unlocking until a certain date
/// @dev This Smart Contract provides the vesting of tokens that will be unlocking until a certain date
contract VestingUpgradeable is IVesting, OwnableUpgradeable {
    using SafeERC20 for MyToken;
    using MathUpgradeable for uint256;

    /// @notice Store constant of percentage 100
    /// @dev Store constant of percentage 100
    uint256 public constant MAX_INITIAL_PERCENTAGE = 100;

    /// @notice Store the initial timestamp in unix
    /// @dev Store the initial timestamp in unix
    uint256 public initialTimestamp;

    /// @notice Store the reward token
    /// @dev Store the reward token
    MyToken public rewardToken;

    /// @notice Store the info about vesting by each type of allocation
    /// @dev Store the info about vesting by each type of allocation
    mapping(AllocationType => VestingInfo) public vestingInfo;

    /// @notice Store amount of tokens given per investors
    /// @dev Store amount of tokens given per investors
    mapping(address => mapping(AllocationType => uint256)) public userTokens;

    /// @notice Store amounts of reward tokens that were paid to recipients
    /// @dev Store amounts of reward tokens that were paid to recipients
    mapping(address => mapping(AllocationType => uint256)) public rewardsPaid;

    /// @notice Initialize contract
    /// @dev Initialize contract, sets reward token address & vesting info
    /// @param token_ the reward token address
    function initialize(address token_) external initializer {
        require(token_ != address(0), "Incorrect token address");
        VestingInfo memory info = VestingInfo(6 minutes, 10 minutes, 10);
        vestingInfo[AllocationType.Seed] = info;
        info.initialPercentage = 15;
        vestingInfo[AllocationType.Private] = info;
        rewardToken = MyToken(token_);

        __Ownable_init();
    }

    /// @notice Sets initial timestamp(the start date of vesting)
    /// @dev Sets initial timestamp by owner only once
    /// @param initialTimestamp_ the initial timestamp in unix
    function setInitialTimestamp(uint256 initialTimestamp_)
        external
        virtual
        override
        onlyOwner
    {
        require(
            initialTimestamp == 0,
            "The initial timestamp has already been initialized"
        );
        initialTimestamp = initialTimestamp_;
        emit SetInitialTimestamp(initialTimestamp_);
    }

    /// @notice Mint tokens for vesting contract and store amount of tokens given per investors
    /// @dev Mint tokens for vesting contract and store amount of tokens given per investors
    /// @param _investors the array of investors
    /// @param _amounts the amount of tokens
    /// @param _allocationType the type allocation of vesting
    function addInvestors(
        address[] calldata _investors,
        uint256[] calldata _amounts,
        AllocationType _allocationType
    ) external virtual override onlyOwner {
        require(block.timestamp < initialTimestamp, "The vesting was start");
        uint256 length = _investors.length;
        require(
            length != 0 && length == _amounts.length,
            "Arrays different length"
        );
        uint256 totalAmount = 0;
        for (uint256 i; i < length; i++) {
            userTokens[_investors[i]][_allocationType] = _amounts[i];
            totalAmount += _amounts[i];
        }
        rewardToken.mint(address(this), totalAmount);
        emit AddInvestors(_investors, _amounts, _allocationType);
    }

    /// @notice Transfer accrued reward tokens to investor
    /// @dev Transfer accrued reward tokens to investor
    function withdrawTokens() external virtual override {
        require(
            initialTimestamp != 0 && block.timestamp > initialTimestamp,
            "The vesting was not start"
        );
        uint256 amountToTransfer;
        if (userTokens[_msgSender()][AllocationType.Seed] > 0) {
            amountToTransfer += _calculateUnlock(
                _msgSender(),
                AllocationType.Seed
            );
            rewardsPaid[_msgSender()][AllocationType.Seed] += amountToTransfer;
        }
        if (userTokens[_msgSender()][AllocationType.Private] > 0) {
            uint256 unlockAmount = _calculateUnlock(
                _msgSender(),
                AllocationType.Private
            );
            rewardsPaid[_msgSender()][AllocationType.Private] += unlockAmount;
            amountToTransfer += unlockAmount;
        }
        require(amountToTransfer > 0, "Amount is zero");
        rewardToken.safeTransfer(_msgSender(), amountToTransfer);
        emit Harvest(_msgSender(), amountToTransfer);
    }

    /// @notice Compute unlocking amount of reward tokens to recipient
    /// @dev Compute unlocking amount of reward tokens to recipient
    /// @param _addr the address of investor
    /// @return the unlocking amount of reward tokens
    function _calculateUnlock(address _addr, AllocationType _allocationType)
        internal
        view
        returns (uint256)
    {
        uint256 tokenAmount = userTokens[_addr][_allocationType];
        uint256 oldRewards = rewardsPaid[_addr][_allocationType];
        VestingInfo memory _vestingInfo = vestingInfo[_allocationType];

        if (block.timestamp > initialTimestamp + _vestingInfo.cliffDuration) {
            uint256 countPeriod = MAX_INITIAL_PERCENTAGE -
                _vestingInfo.initialPercentage;
            uint256 initialUnlockAmount = (tokenAmount *
                _vestingInfo.initialPercentage) / MAX_INITIAL_PERCENTAGE;
            uint256 passedPeriod = MathUpgradeable.min(
                (block.timestamp -
                    initialTimestamp -
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
