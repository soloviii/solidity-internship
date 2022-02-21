// SPDX-License-Identifier: MIT
pragma solidity 0.8.10;

/// @title IVesting
/// @author Applicature
/// @notice There is an interface for Vesting Smart Contract
/// @dev There is an interface for Vesting Smart Contract
interface IVesting {
    /// @notice Emit when owner set initial timestamp
    /// @dev Emit when owner set initial timestamp
    /// @param initialTimestamp the initial timestamp in unix
    event SetInitialTimestamp(uint256 initialTimestamp);

    /// @notice Emit when owner set amount of tokens to each investor
    /// @dev Emit when owner set amount of tokens to each investor
    /// @param investors the array of investors
    /// @param amounts the amount of tokens
    /// @param allocationType thetype of vesting allocation
    event AddInvestors(
        address[] investors,
        uint256[] amounts,
        Allocation allocationType
    );

    /// @notice Emit when investor withdraw accrued reward tokens
    /// @dev Emit when investor withdraw accrued reward tokens
    /// @param sender the aaddress of investor
    /// @param amount the amount of tokens that were withdraw
    event Harvest(address indexed sender, uint256 amount);

    /// @notice Enumeration of vesting allocation
    /// @dev Enumeration of vesting allocation
    enum Allocation {
        Seed,
        Private
    }

    /// @notice Structured data type for variables that store information about vesting
    /// @dev Structured data type for variables that store information about vesting
    struct VestingInfo {
        uint256 periodDuration;
        uint256 cliffDuration;
        Allocation allocation;
    }

    /// @notice Sets initial timestamp(the start date of vesting)
    /// @dev Sets initial timestamp by owner only once
    /// @param initialTimestamp_ the initial timestamp in unix
    function setInitialTimestamp(uint256 initialTimestamp_) external;

    /// @notice Mint tokens for vesting contract and store amount of tokens given per investors
    /// @dev Mint tokens for vesting contract and store amount of tokens given per investors
    /// @param _investors the array of investors
    /// @param _amounts the amount of tokens
    /// @param _allocationType thetype of vesting allocation
    function addInvestors(
        address[] calldata _investors,
        uint256[] calldata _amounts,
        Allocation _allocationType
    ) external;

    /// @notice Transfer accrued reward tokens to investor
    /// @dev Transfer accrued reward tokens to investor
    function withdrawTokens() external;
}
