// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

/// @title A forwarder ether
/// @author Vasyl Solovii
/// @notice You can use this contract for forwarding ether to destination address
/// @dev All function calls are currently implemented without side effects
contract Forwarder {
    /// @notice This event is emitted when a forward occurs
    /// @dev To be emitted when a forward occurs
    /// @param from The address that forward ether
    /// @param to The address to which any funds sent to this contract will be forwarded
    /// @param amount The amount of ether
    /// @param data The additional service information
    event LogForwarded(
        address indexed from,
        address to,
        uint256 amount,
        string data
    );

    /// @notice Forward the amount of ether to destination address
    /// @dev Check zero address
    /// @param _to The address to which any funds sent to this contract will be forwarded
    /// @param _data The additional service information
    function forward(address payable _to, string memory _data)
        external
        payable
    {
        require(_to != address(0), "forward to the zero address");
        (bool sent, ) = _to.call{value: msg.value}("");
        require(sent, "Failed to send Ether");
        emit LogForwarded(msg.sender, _to, msg.value, _data);
    }
}
