// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "openzeppelin-solidity/contracts/access/Ownable.sol";
import "openzeppelin-solidity/contracts/token/ERC20/extensions/ERC20Pausable.sol";

contract MyToken is ERC20Pausable,Ownable {

    constructor() 
    ERC20("MyToken", "MK") 
    {
        uint256 balance =  1_000_000 * 10 ** decimals();
        _mint(msg.sender,balance);  
    } 

    function decimals() public view virtual override returns (uint8) {
        return 6;
    }

    function pause() 
    public 
    onlyOwner {
        _pause();
    }

    function unpause() 
    public 
    onlyOwner {
        _unpause();
    }

    function burn(uint256 _amount) 
    public{
        _burn(msg.sender,_amount);
    }

    function mint(address _to,uint256 _amount) 
    public 
    onlyOwner{
        require(_amount > 0, 'ERC20: amount is not valid');
        _mint(_to, _amount);  
    }

    receive() external payable{
        //Do something
    }
}