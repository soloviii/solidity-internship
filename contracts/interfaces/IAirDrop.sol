// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

interface IAirDrop{
    function depositTokens(uint256 _amount) external;
    function depositEther() external payable;
    function dropTokens(address[] calldata _recipients, uint256 _amount) external;
    function dropEther(address[] calldata _recipients, uint256 _amount) external;
    function updateTokenAddress(address _token) external;
    function withdrawTokens() external;
    function withdrawEther() external;
}