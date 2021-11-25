// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

contract Forwarder {
    event LogForwarded(
        address indexed from,
        address to,
        uint256 amount,
        string data
    );

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
