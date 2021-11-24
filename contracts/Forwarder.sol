// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

contract Forwarder {
    event LogForwarded(address indexed sender, uint amount,string data);

    function forward(string memory _data,address payable _to) external payable {
        require(_to != address(0), "forward to the zero address");
        (bool sent,) =  _to.call{value: msg.value}("");
        require(sent, "Failed to send Ether");
        emit LogForwarded(msg.sender, msg.value,_data);
    }
}
