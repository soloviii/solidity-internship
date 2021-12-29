const { expect } = require("chai");
const { ethers } = require("hardhat");
const {
    BN,
    constants,
    expectEvent,
    expectRevert,
} = require('@openzeppelin/test-helpers');

let Token;
let tokenContract;

let owner;
let user1;
let user2;

let totalSupply = 1000;

describe("Token", function() {
    beforeEach(async() => {
        [owner, user1, user2] = await ethers.getSigners();
        Token = await ethers.getContractFactory("Token");
        tokenContract = await Token.deploy(totalSupply);
    })
    describe('Deploy', async() => {
        it('Should fail if total supply will be zero', async() => {
            expect(Token.deploy(0)).to.be.revertedWith("total supply is zero");
        })
        it('Should initialize field correct', async() => {
            expect(await tokenContract.totalSupply()).to.equal(totalSupply);
            expect(await tokenContract.balanceOf(owner.address)).to.equal(totalSupply);
        })
    })
    describe('Functions', async() => {
        describe('transfer', async() => {
            it('Should fail if address recipient will be zero', async() => {
                await expect(tokenContract.transfer(constants.ZERO_ADDRESS, 10))
                    .to.be.revertedWith("address recipient is zero");
            })
            it('Should fail if value will be zero', async() => {
                await expect(tokenContract.transfer(owner.address, 0))
                    .to.be.revertedWith("value is zero");
            })
            it('Should fail if sender doesn’t have enough tokens', async() => {
                const initialOwnerBalance = await tokenContract.balanceOf(owner.address);
                await expect(
                    tokenContract.connect(user1).transfer(owner.address, 1)
                ).to.be.revertedWith("Not enough tokens");
                expect(await tokenContract.balanceOf(owner.address)).to.equal(
                    initialOwnerBalance
                );
            })
            it('Should transfer tokens between accounts succesfully', async() => {
                await tokenContract.transfer(user1.address, 50);
                const user1Balance = await tokenContract.balanceOf(user1.address);
                expect(user1Balance).to.equal(50);

                await tokenContract.connect(user1).transfer(user2.address, 50);
                const user2Balance = await tokenContract.balanceOf(user2.address);
                expect(user2Balance).to.equal(50);
            })
        })
    })
});