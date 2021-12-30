const { expect } = require("chai");
const { ethers } = require("hardhat");
const Web3 = require('web3');
const web3 = new Web3('http://localhost:7545');

let EtherStore;
let Attack;

let etherStoreContract;
let attackContract;

let owner;
let user1;
let user2;

describe("EtherStore", function() {
    beforeEach(async() => {
        [owner, user1, user2] = await ethers.getSigners();
        EtherStore = await ethers.getContractFactory("EtherStore");
        Attack = await ethers.getContractFactory("Attack");
        etherStoreContract = await EtherStore.deploy();
        attackContract = await Attack.deploy(etherStoreContract.address);
    })
    describe("Functions", function() {
        describe("withdrawFunds", function() {
            it("Reentrancy attack when use withdrawFunds", async function() {
                await etherStoreContract.connect(user2).depositFunds({ value: web3.utils.toWei(String(5), 'ether') });
                await attackContract.connect(user1).attack({ value: web3.utils.toWei(String(1), 'ether') });
                let balance = await attackContract.getBalance();
                expect(balance).to.equal(web3.utils.toWei(String(6), 'ether'));
            });
        })
    })
});