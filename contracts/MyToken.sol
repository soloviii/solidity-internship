// SPDX-License-Identifier: MIT
pragma solidity 0.8.10;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract MyToken is ERC20, Ownable {
    constructor(string memory _name, string memory _symbol)
        ERC20(_name, _symbol)
    {
        _mint(msg.sender, 1_000_000 * 10**decimals());
    }

    function mint(address _account, uint256 _amount) public onlyOwner {
        require(_amount > 0, "ERROR_WRONG_AMOUNT");
        _mint(_account, _amount);
    }

    function burn(address _account, uint256 _value) public onlyOwner {
        super._burn(_account, _value);
    }
}
