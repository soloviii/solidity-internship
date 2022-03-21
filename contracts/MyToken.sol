// SPDX-License-Identifier: MIT
pragma solidity 0.8.10;

import "./management/Managed.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MyToken is ERC20, Managed {
    constructor(
        address _management,
        string memory _name,
        string memory _symbol
    ) ERC20(_name, _symbol) Managed(_management) {}

    function mint(address _account, uint256 _amount)
        external
        requirePermission(CAN_MINT_TOKENS)
    {
        require(_amount > 0, "ERROR_WRONG_AMOUNT");
        _mint(_account, _amount);
    }

    function burn(address _account, uint256 _value)
        external
        requirePermission(CAN_BURN_TOKENS)
    {
        _burn(_account, _value);
    }

    function transferTokens(address to, uint256 amount)
        external
        returns (bool)
    {
        address owner = _msgSender();
        _transfer(owner, to, amount);
        return true;
    }
}
