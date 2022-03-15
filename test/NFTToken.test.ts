import { expect } from 'chai'
import chai from 'chai'
import { ethers } from 'hardhat'
import { solidity } from 'ethereum-waffle'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { Contract } from 'ethers'
const { ether, constants } = require('@openzeppelin/test-helpers')

chai.use(solidity)

describe('NFTToken', async () => {

    function toETH(num: any): any {
        return ether(num.toString()).toString()
    }

    function eth(num: any): any {
        return ether(num.toString()).toString()
    }

    let nftTokenFactory: any
    let nftContract: Contract
    let owner: SignerWithAddress
    let user1: SignerWithAddress
    let user2: SignerWithAddress
    let otherAccounts: SignerWithAddress[]

    let name: string = 'NFTToken'
    let symbol: string = 'NFT'
    let totalSupply: number = 10
    let tokenURI: string = 'https://URI.URI'

    beforeEach(async () => {
        ;[
            owner,
            user1,
            user2,
            ...otherAccounts
        ] = await ethers.getSigners()
        nftTokenFactory = await ethers.getContractFactory('NFTToken')

        nftContract = await nftTokenFactory.deploy(
            name,
            symbol,
            tokenURI,
            totalSupply
        )

        await nftContract.setPricePerNFT(toETH("1"));
    })
    describe('constructor', async () => {
        it('should fail if total supply is zero', async () => {
            await expect(
                nftTokenFactory.deploy(
                    name,
                    symbol,
                    tokenURI,
                    0,
                )
            ).to.be.revertedWith("ERROR_AMOUNT_IS_ZERO")
        })
        it('should deploy NFTToken successfully', async () => {
            nftContract = await nftTokenFactory.deploy(
                name,
                symbol,
                tokenURI,
                totalSupply
            )
            expect(await nftContract.baseTokenURI()).to.be.equal(tokenURI);
            expect(await nftContract.totalSupply()).to.be.equal(totalSupply);
            expect(await nftContract.name()).to.be.equal(name);
            expect(await nftContract.symbol()).to.be.equal(symbol);
            expect(await nftContract.numberMintedCoins()).to.be.equal('0');
        })
    })
    describe('setPricePerNFT', async () => {
        it('should fail if sender is not owner', async () => {
            await expect(nftContract.connect(user1).setPricePerNFT(toETH("1"))
            ).to.be.revertedWith("Ownable: caller is not the owner")
        })
        it('should set price per NFT successfully', async () => {
            await expect(nftContract.setPricePerNFT(toETH("2")))
                .to.emit(nftContract, 'SetPricePerNFT').withArgs(toETH("2"))
            expect(await nftContract.pricePerNft()).to.be.equal(toETH("2"));
        })
    })
    describe('buy/getNFTs', async () => {
        it('should fail if number is zero', async () => {
            await expect(nftContract.connect(user1).buy('0', { value: eth('1') })
            ).to.be.revertedWith("ERROR_NUMBER_IS_ZERO")
        })
        it('should fail if all NFTs purchased', async () => {
            await expect(nftContract.connect(user1).buy('11', { value: eth('0') })
            ).to.be.revertedWith("ERROR_NFTs_PURCHASED")
        })
        it('should fail if not enough ether to purchase NFTs', async () => {
            await expect(nftContract.connect(user1).buy('2', { value: eth('0') })
            ).to.be.revertedWith("Not enough ether to purchase NFTs")
        })
        it('should purchase NFTs successfully', async () => {
            let beforeBalanceEthers = await ethers.provider.getBalance(nftContract.address)
            await expect(nftContract.connect(user1).buy('2', { value: eth('2') }))
                .to.emit(nftContract, 'Purchase').withArgs(user1.address, "2")
            let afterBalanceEthers = await ethers.provider.getBalance(nftContract.address)
            let purchasedNFTsUser1 = await nftContract.getNFTs(user1.address)
            expect(purchasedNFTsUser1[0]).to.be.equal('0');
            expect(purchasedNFTsUser1[1]).to.be.equal('1');
            expect(afterBalanceEthers).to.be.equal(beforeBalanceEthers.add(toETH('2')));
            expect(await nftContract.numberMintedCoins()).to.be.equal('2');

            beforeBalanceEthers = await ethers.provider.getBalance(nftContract.address)
            await expect(nftContract.connect(user2).buy('5', { value: eth('5') }))
                .to.emit(nftContract, 'Purchase').withArgs(user2.address, "5")
            afterBalanceEthers = await ethers.provider.getBalance(nftContract.address)
            expect(afterBalanceEthers).to.be.equal(beforeBalanceEthers.add(toETH('5')));
            expect(await nftContract.numberMintedCoins()).to.be.equal('7');

            let purchasedNFTsUser2 = await nftContract.getNFTs(user2.address)
            expect(purchasedNFTsUser2[0]).to.be.equal('2');
            expect(purchasedNFTsUser2[1]).to.be.equal('3');
            expect(purchasedNFTsUser2[2]).to.be.equal('4');
            expect(purchasedNFTsUser2[3]).to.be.equal('5');
            expect(purchasedNFTsUser2[4]).to.be.equal('6');
        })
    })
    describe('transfer', async () => {
        it('should transfer nft from user1 to user2 successfully', async () => {
            await expect(nftContract.connect(user1).buy('2', { value: eth('2') }))
                .to.emit(nftContract, 'Purchase').withArgs(user1.address, "2")
            let purchasedNFTsUser1 = await nftContract.getNFTs(user1.address)
            expect(purchasedNFTsUser1[0]).to.be.equal('0');
            expect(purchasedNFTsUser1[1]).to.be.equal('1');

            await nftContract.connect(user1).approve(user2.address, 1);
            await nftContract.connect(user1).transferFrom(user1.address, user2.address, 1);
            let purchasedNFTsUser2 = await nftContract.getNFTs(user2.address)
            expect(purchasedNFTsUser2[0]).to.be.equal('1');
        })
    })
})