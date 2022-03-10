pragma solidity 0.8.10;

import "@openzeppelin/contracts/access/Ownable.sol";

contract Management is Ownable {
    mapping(address => mapping(uint256 => bool)) public permissions;

    function setPermission(
        address _address,
        uint256 _permission,
        bool _value
    ) public onlyOwner {
        permissions[_address][_permission] = _value;
    }
}
