// SPDX-License-Identifier: MIT
pragma solidity 0.8.10;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MyToken is ERC20 {
    constructor(string memory _name, string memory _symbol)
        ERC20(_name, _symbol)
    {}

    function mint(address _account, uint256 _amount) external {
        require(_amount > 0, "ERROR_WRONG_AMOUNT");
        _mint(_account, _amount);
    }

    function burn(address _account, uint256 _value) external {
        _burn(_account, _value);
    }
}
