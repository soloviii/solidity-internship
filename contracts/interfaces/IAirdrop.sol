// SPDX-License-Identifier: MIT
pragma solidity 0.8.10;

interface IAirdrop {
    event ClaimToken(address recipient, uint256 amount);
    event ClaimEther(address recipient, uint256 amount);
    event DepositTokens(address sender, uint256 amount);
    event DepositEther(address sender, uint256 amount);

    function depositTokens(uint256 _amount) external;

    function depositEther() external payable;

    function dropTokens(
        address[] calldata _recipients,
        uint256[] calldata _amounts,
        bool _isEther,
        uint256 _nonce,
        uint256 _deadline,
        uint8 _v,
        bytes32 _r,
        bytes32 _s
    ) external;

    function dropEther(
        address[] calldata _recipients,
        uint256[] calldata _amounts,
        bool _isEther,
        uint256 _nonce,
        uint256 _deadline,
        uint8 _v,
        bytes32 _r,
        bytes32 _s
    ) external;

    function updateTokenAddress(address _token) external;

    function withdrawTokens() external;

    function withdrawEther() external;

    function claimToken() external;

    function claimEther() external;
}
