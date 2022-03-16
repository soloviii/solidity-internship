// SPDX-License-Identifier: MIT
pragma solidity 0.8.10;

import "./IVesting.sol";

/// @title IVesting
/// @author Applicature
/// @notice There is an interface for Vesting Smart Contract
/// @dev There is an interface for Vesting Smart Contract
interface IVesting_V2 is IVesting {
    event ChangeInvestor(address from, address to);

    /// @notice Move the amount of uncollected tokens from one investor address to another
    /// @dev Move the amount of uncollected tokens from one investor address to another by owner
    function changeInvestor() external;
}
