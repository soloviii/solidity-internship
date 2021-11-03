// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "openzeppelin-solidity/contracts/token/ERC20/ERC20.sol";
import "openzeppelin-solidity/contracts/access/Ownable.sol";
import "openzeppelin-solidity/contracts/security/Pausable.sol";

contract MyToken is ERC20,Pausable,Ownable {

    mapping (address => uint256) internal _balances;

    constructor() ERC20("MyToken", "MK") {
        uint256 balance =  1_000_000 * 10 ** decimals();
        _mint(msg.sender,balance);  
        _balances[msg.sender] = balance; 
    } 

    function decimals() public view virtual override returns (uint8) {
        return 6;
    }

    function pause() public onlyOwner {
        _pause();
    }

    function unpause() public onlyOwner {
        _unpause();
    }

    function burn(address _from, uint256 _amount) public onlyOwner whenNotPaused{
        require(_from != address(0), 'ERC20: from address is not valid');
        require(_balances[_from] >= _amount, 'ERC20: insufficient balance');

        uint256 balance =  _amount * 10 ** decimals();
        _balances[_from] -= balance;

        _burn(_from, balance);
    }

    function mint(address _to,uint _amount) public onlyOwner{
        require(_to != address(0), 'ERC20: to address is not valid');
        require(_amount > 0, 'ERC20: amount is not valid');

        uint256 balance =  _amount * 10 ** decimals();
        _balances[_to] += balance;

        _mint(_to, balance);  
    }

    function _beforeTokenTransfer(address from, address to, uint256 amount)
        internal
        whenNotPaused
        override
    {
        super._beforeTokenTransfer(from, to, amount);
    }
}