// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract Airdrop is Ownable{

    IERC20 public token;

    constructor(address _token) {
        token = IERC20(_token);
    }

    function depositEther() external payable onlyOwner {}

    function dropEther(
        address payable[] calldata _recipients,
        uint256 _amount
    ) external payable onlyOwner {
        for(uint256 i; i < _recipients.length; i++){
           (bool sent,) =  _recipients[i].call{value: _amount}("");
           require(sent, "Failed to send Ether");
        }
    }

    function updateTokenAddress(address _token) public onlyOwner {
        token = IERC20(_token);
    }

    function withdrawEther() external payable onlyOwner{
        payable(msg.sender).transfer(address(this).balance);
    }

    function getTokenAddress() external view returns(address){
        return address(token);
    }

    function depositTokens(uint256 _amount) public onlyOwner {        
        (bool sent) = token.transferFrom(msg.sender,address(this), _amount);
        require(sent, "Failed to deposit tokens");
    }

    function dropTokens(
        address[] calldata _recipients,
        uint256 _amount
    ) external onlyOwner {
        require((token.balanceOf(address(this)) >= _recipients.length * _amount), "Not enough tokens on the contract");
        for(uint256 i; i < _recipients.length; i++){
            (bool sent) = token.transfer(_recipients[i], _amount);
            require(sent, "Failed to drop tokens");
        }
    }

    function withdrawTokens() external onlyOwner{
        (bool sent) = token.transfer(msg.sender, token.balanceOf(address(this)));
        require(sent, "Failed to withdraw tokens");
    }
}