// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Pausable.sol";

contract Token is ERC20Pausable,Ownable {
    uint256 rate = 10 * 10**decimals();

    constructor() ERC20("MyToken", "MK") {
        uint256 balance = 1_000_000 * 10**decimals();
        _mint(address(this), balance);
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

    function burn(uint256 _amount) public {
        _burn(msg.sender, _amount);
    }

    function mint(address _to, uint256 _amount) public onlyOwner {
        require(_amount > 0, "ERC20: amount is not valid");
        _mint(_to, _amount);
    }

    receive() external payable {
        require(msg.value > 0, "ERC20: amount is not valid");

        _transfer(address(this), msg.sender, (msg.value * rate) / 1e18);
    }

    function transferToEther(uint256 _amount) public {
        //1_000_000

        uint256 a = (_amount * 1e18) / rate; // 1_000_000 * 1e18 / 10_000_000

        _transferFrom(msg.sender, address(this), _amount);

        payable(msg.sender).transfer(a);
        
        //0.1 ether
    }
    
    function getBalance() public view returns (uint) {
        return address(this).balance;
    }

    function _transferFrom(
        address sender,
        address recipient,
        uint256 amount
    ) internal virtual returns (bool) {
        _transfer(sender, recipient, amount);

        uint256 currentAllowance = allowance(sender, recipient);
        require(
            currentAllowance >= amount,
            "ERC20: transfer amount exceeds allowance"
        );
        unchecked {
            _approve(sender, recipient, currentAllowance - amount);
        }

        return true;
    }
}
