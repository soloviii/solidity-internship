// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

interface IAirDrop{
    function depositTokens(uint256 _amount) external;
    function depositEther() external payable;
    function dropTokens(address[] calldata _recipients, uint256 _amount) external;
    function dropEther(address payable[] calldata _recipients, uint256 _amount) external;
    function updateTokenAddress(address _token) external;
    function withdrawTokens() external;
    function withdrawEther() external;
}

contract AirDrop is Ownable, IAirDrop{

    IERC20 public token;

    constructor(address _token) {
        token = IERC20(_token);
    }

    event TokenDrop(address recipient, uint256 amount);
    event EtherDrop(address recipient, uint256 amount);
    event TokenDeposit(address from, uint256 amount);

    function depositTokens(uint256 _amount) public onlyOwner {      
        (bool sent) = token.transferFrom(msg.sender,address(this), _amount);
        require(sent, "Failed to deposit tokens");
        emit TokenDeposit(msg.sender, _amount);
    }

    function depositEther() external payable onlyOwner {}

    function dropTokens(
        address[] calldata _recipients,
        uint256 _amount
    ) public onlyOwner {
        require((token.balanceOf(address(this)) >= _recipients.length * _amount), "Not enough tokens on the contract");
        for(uint256 i; i < _recipients.length; i++){
            (bool sent) = token.transfer(_recipients[i], _amount);
            require(sent, "Failed to drop tokens");
            emit TokenDrop(_recipients[i], _amount);
        }
    }

    function dropEther(
        address payable[] calldata _recipients,
        uint256 _amount
    )public onlyOwner {
        require(_recipients.length != 0, "Array is empty");
        require(_amount != 0, "Amount is zero");
        for(uint256 i; i < _recipients.length; i++){
           (bool sent,) =  _recipients[i].call{value: _amount}("");
           require(sent, "Failed to send Ether");
           emit EtherDrop(_recipients[i], _amount);
        }
    }

    function updateTokenAddress(address _token) public onlyOwner {
        token = IERC20(_token);
    }

    function withdrawTokens() public onlyOwner{
        uint256 amount = token.balanceOf(address(this));
        (bool sent) = token.transfer(msg.sender, amount);
        require(sent, "Failed to withdraw tokens");
        emit TokenDrop(msg.sender, amount);
    }

    function withdrawEther() public onlyOwner{
        uint256 amount = address(this).balance;
        payable(msg.sender).transfer(amount);
        emit TokenDrop(msg.sender, amount);
    }

    function getTokenAddress() public view returns(address){
        return address(token);
    }
}