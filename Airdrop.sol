// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "./Token.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract Airdrop is Ownable{

    Token public token;

    constructor(address payable _token) {
        token = Token(_token);
    }

    function depositEther() external payable onlyOwner {

    }

    function dropEther(
        address payable[] calldata _recipients,
        uint256 _amount
    ) external payable onlyOwner {
        for(uint256 i; i < _recipients.length; i++){
           _recipients[i].transfer(_amount);
        }
    }

    function updateTokenAddress(address payable _token) public onlyOwner {
        token = Token(_token);
    }

    function withdrawEther() external payable onlyOwner{
        payable(msg.sender).transfer(address(this).balance);
    }

    function getTokenAddress() public view returns(address){
        return address(token);
    }

    function depositTokens(address payable _token) public payable onlyOwner {
        require(msg.value > 0, "ERC20: amount is not valid");
        
        token = Token(_token);

        token.transferFrom(msg.sender,address(this), msg.value);
    }

    function dropTokens(
        address payable[] calldata _recipients,
        uint256 _amount
    ) external payable onlyOwner {
        for(uint256 i; i < _recipients.length; i++){
            token.transfer(_recipients[i], _amount);
        }
    }

    function withdrawTokens(address payable _token) external payable onlyOwner{
        token = Token(_token);

        token.transfer(msg.sender, token.balanceOf(address(this)));
    }
}