// SPDX-License-Identifier: MIT

pragma solidity 0.8.10;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./interfaces/INFTToken.sol";

/// @title NFTToken
/// @author Applicature
/// @notice This contract is an implementation of the ERC721 standard
/// @dev This contract is an implementation of the ERC721 standard
contract NFTToken is INFTToken, ERC721, Ownable {
    using EnumerableSet for EnumerableSet.UintSet;

    /// @notice the IPFS URL of the folder containing the JSON metadata
    /// @dev the IPFS URL of the folder containing the JSON metadata
    string public baseTokenURI;

    /// @notice the amount of ether required to buy 1 NFT
    /// @dev the amount of ether required to buy 1 NFT
    uint256 public pricePerNft;

    /// @notice the maximum number of NFTs that can be minted in your collection
    /// @dev the maximum number of NFTs that can be minted in your collection
    uint256 public totalSupply;

    /// @notice the number of minted coins
    /// @dev the number of minted coins
    uint256 public numberMintedCoins;

    /// @notice the all NFTs of users
    /// @dev the all NFTs of users
    mapping(address => EnumerableSet.UintSet) internal _nftsByUser;

    /// @notice Initialize info about NFTs
    /// @dev Initialize info about NFTs
    /// @param _name the name of token
    /// @param _symbol the symbol of token
    /// @param _tokenURI the uri of token
    /// @param _supply the amount of tokens
    constructor(
        string memory _name,
        string memory _symbol,
        string memory _tokenURI,
        uint256 _supply
    ) ERC721(_name, _symbol) {
        require(_supply > 0, "ERROR_AMOUNT_IS_ZERO");
        baseTokenURI = _tokenURI;
        totalSupply = _supply;
        _mint(msg.sender, numberMintedCoins);
        numberMintedCoins++;
    }

    /// @notice Gets the all NFTs of user
    /// @dev Gets the all NFTs of user
    /// @param _owner the address of user
    /// @return result returns the all NFTs of user
    function getNFTs(address _owner)
        external
        view
        override
        returns (uint256[] memory result)
    {
        uint256 length = _nftsByUser[_owner].length();
        result = new uint256[](length);
        for (uint256 i; i < length; i++) {
            result[i] = _nftsByUser[_owner].at(i);
        }
    }

    /// @notice Sets price per NFT
    /// @dev  Sets price per NFT by owner
    /// @param _amount the amount of ethers per NFT
    function setPricePerNFT(uint256 _amount)
        external
        virtual
        override
        onlyOwner
    {
        require(_amount != 0, "ERROR_AMOUNT_IS_ZERO");
        pricePerNft = _amount;
        emit SetPricePerNFT(_amount);
    }

    /// @notice Purchases the NFTs
    /// @dev Purchases the NFTs by user
    /// @param _numbers the number of NFTs
    function buy(uint256 _numbers) external payable virtual override {
        require(_numbers != 0, "ERROR_NUMBER_IS_ZERO");
        uint256 numberNFTs = _numbers + numberMintedCoins;
        require(numberNFTs < totalSupply, "ERROR_NFTs_PURCHASED");
        require(
            msg.value == pricePerNft * _numbers,
            "Not enough ether to purchase NFTs"
        );
        for (uint256 i = numberMintedCoins; i < numberNFTs; i++) {
            _mint(msg.sender, i);
            numberMintedCoins++;
        }
        emit Purchase(msg.sender, _numbers);
    }

    /// @notice Hook that is called before any token transfer. This includes minting and burning
    /// @dev Hook that is called before any token transfer. This includes minting and burning
    /// @param from the address of sender
    /// @param to the address of recipient
    /// @param tokenId the id of token
    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId
    ) internal virtual override {
        super._beforeTokenTransfer(from, to, tokenId);
        require(
            from == address(0) || _nftsByUser[from].remove(tokenId),
            "ERROR_NOT_FOUND"
        );
        require(_nftsByUser[to].add(tokenId), "ERROR_FAIL");
    }
}
