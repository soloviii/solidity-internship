// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./interfaces/IAirDrop.sol";

contract AirDrop is IAirDrop,Ownable{
    event TokenDrop(address[] recipients, uint256 amount);
    event EtherDrop(address[] recipients, uint256 amount);
    event TokenDeposit(address from, uint256 amount);

    IERC20 public token;
    address[] public recipient;

    constructor(address _token) {
        token = IERC20(_token);
    }

    function depositEther() external payable override onlyOwner {}

    function depositTokens(uint256 _amount) external override onlyOwner {      
        (bool sent) = token.transferFrom(msg.sender,address(this), _amount);
        require(sent, "Failed to deposit tokens");
        emit TokenDeposit(msg.sender, _amount);
    }    

    function dropTokens(
        address[] calldata _recipients,
        uint256 _amount
    ) external override onlyOwner {
        require(_recipients.length != 0, "Array is empty");
        require(_amount != 0, "Amount is zero");
        require(token.balanceOf(address(this)) >= _recipients.length * _amount, "Not enough tokens on the contract");
        for(uint256 i; i < _recipients.length; i++){
            (bool sent) = token.transfer(_recipients[i], _amount);
            require(sent, "Failed to drop tokens");
        }
        emit TokenDrop(_recipients, _amount);
    }

    function dropEther(
        address[] calldata _recipients,
        uint256 _amount
    )external override onlyOwner {
        require(_recipients.length != 0, "Array is empty");
        require(_amount != 0, "Amount is zero");
        require(address(this).balance >= _recipients.length * _amount, "Not enough tokens on the contract");
        for(uint256 i; i < _recipients.length; i++){
           (bool sent,) =  _recipients[i].call{value: _amount}("");
           require(sent, "Failed to send Ether");
        }
        emit EtherDrop(_recipients, _amount);
    }

    function updateTokenAddress(address _token) external override onlyOwner {
        token = IERC20(_token);
    }

    function withdrawTokens() external override onlyOwner{
        recipient = [msg.sender];
        uint256 amount = token.balanceOf(address(this));
        (bool sent) = token.transfer(msg.sender, amount);
        require(sent, "Failed to withdraw tokens");
        emit TokenDrop(recipient, amount);
    }

    function withdrawEther() external override onlyOwner{
        recipient = [msg.sender];
        uint256 amount = address(this).balance;
        payable(msg.sender).transfer(amount);
        emit EtherDrop(recipient, amount);
    }
}