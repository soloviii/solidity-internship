// SPDX-License-Identifier: MIT
pragma solidity 0.8.10;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "./Management.sol";

contract Managed is OwnableUpgradeable {
    uint256 public constant CAN_MINT_TOKENS = 0;
    uint256 public constant CAN_BURN_TOKENS = 1;

    Management public management;

    modifier requirePermission(uint256 _permissionBit) {
        require(
            hasPermission(msg.sender, _permissionBit),
            "ERROR_ACCESS_DENIED"
        );
        _;
    }

    function __Managed_init(address _managementAddress)
        internal
        onlyInitializing
    {
        __Ownable_init();
        management = Management(_managementAddress);
    }

    function hasPermission(address _subject, uint256 _permissionBit)
        internal
        view
        returns (bool)
    {
        return management.permissions(_subject, _permissionBit);
    }
}
