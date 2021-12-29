const { expect } = require("chai");
const { ethers } = require("hardhat");
const {
    BN,
    constants,
    expectEvent,
    expectRevert,
} = require('@openzeppelin/test-helpers');

let Super;
let superContract;

let owner;
let user1;
let user2;

describe("Token", function() {
    beforeEach(async() => {
        [owner, user1, user2] = await ethers.getSigners();
        Super = await ethers.getContractFactory("Super");
        superContract = await Super.deploy();
    })
    describe('Functions', async() => {
        describe('mint', async() => {
            it('Should fail if address recipient will be zero', async() => {
                await expect(superContract.mint(constants.ZERO_ADDRESS, 10))
                    .to.be.revertedWith("ERC20: mint to the zero address");
            })
            it('Should fail if value will be zero', async() => {
                await expect(superContract.mint(owner.address, 0))
                    .to.be.revertedWith("value is zero");
            })
            it('Should fail if mint by user', async() => {
                await expect(superContract.connect(user1).mint(user1.address, 0))
                    .to.be.revertedWith("Ownable: caller is not the owner");
            })
            it('Should mint token succesfully', async() => {
                await superContract.mint(user1.address, 100);
                const user1Balance = await superContract.balanceOf(user1.address);
                expect(user1Balance).to.equal(100);
            })
        })
    })
})