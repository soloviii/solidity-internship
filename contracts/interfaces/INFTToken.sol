// SPDX-License-Identifier: MIT
pragma solidity 0.8.10;

/// @title INFTToken
/// @author Applicature
/// @notice There is an interface for NFTToken Smart Contract
/// @dev There is an interface for NFTToken Smart Contract
interface INFTToken {
    /// @notice Emit when owner sets price per NFT
    /// @dev Emit when owner sets price per NFT
    event SetPricePerNFT(uint256 amount);

    /// @notice Emit when user purchases NFTs
    /// @dev Emit when user purchases NFTs
    event Purchase(address user, uint256 numbers);

    /// @notice Gets the all NFTs of user
    /// @dev Gets the all NFTs of user
    /// @param _owner the address of user
    /// @return result returns the all NFTs of user
    function getNFTs(address _owner)
        external
        view
        returns (uint256[] memory result);

    /// @notice Sets price per NFT
    /// @dev  Sets price per NFT by owner
    /// @param _amount the amount of ethers per NFT
    function setPricePerNFT(uint256 _amount) external;

    /// @notice Purchases the NFTs
    /// @dev Purchases the NFTs by user
    /// @param _numbers the number of NFTs
    function buy(uint256 _numbers) external payable;
}
