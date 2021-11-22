const {
    BN,
    send,
    constants,
    expectRevert,
    assertRevert,
    balance,
    ether
} = require('@openzeppelin/test-helpers');
const { expect } = require('chai');
require('chai')
    .use(require('chai-as-promised'))
    .use(require('chai-bignumber')())
    .use(require('chai-bn')(BN))
    .should();

const Token = artifacts.require("Token");
const AirDrop = artifacts.require("AirDrop");

contract("AirDrop", ([owner, user1, user2, user3]) => {

    beforeEach(async () => {
        tokenInstance = await Token.new();
        airdropInstance = await AirDrop.new(tokenInstance.address);
    });

    describe("deposit Ether", async () => {
        it("Should deposit ether to the contract", async () => {

            let BeforeBalanceAirdrop = await balance.current(airdropInstance.address);

            await airdropInstance.depositEther({ from: owner, value: ether('2') });

            let newBalanceAirdrop = await balance.current(airdropInstance.address);

            expect(newBalanceAirdrop).to.be.bignumber.equal(BeforeBalanceAirdrop.add(ether('2')));
        });

        it("Should be fail if caller not owner", async () => {
            await expectRevert(
                airdropInstance.depositEther({ from: user1, value: ether('2') }),
                "Ownable: caller is not the owner"
            );
        });
    });

    describe("update token address", async () => {
        it("Should update token for airdrop", async () => {

            let newToken = await Token.new({ from: owner });
            await airdropInstance.updateTokenAddress(newToken.address);

            let actualTokenAddress = await airdropInstance.getTokenAddress();

            actualTokenAddress.should.be.equal(newToken.address);
        });
        it("Should be fail if caller not owner", async () => {
            let newToken = await Token.new({ from: owner });
            await expectRevert(
                airdropInstance.updateTokenAddress(newToken.address, { from: user1 }),
                "Ownable: caller is not the owner"
            );
        });
    });


    describe("drop ether", async () => {

        it("Should transfer ether amounts to recipients", async () => {

            await airdropInstance.depositEther({ from: owner, value: ether('3') });

            let beforeDropBalanceUser1 = await balance.current(user1);
            let beforeDropBalanceUser2 = await balance.current(user2);

            await airdropInstance.dropEther([user1, user2], ether('1'), { from: owner });

            let afterDropBalanceUser1 = await balance.current(user1);
            let afterDropBalanceUser2 = await balance.current(user2);


            afterDropBalanceUser1.should.be.bignumber.equal(beforeDropBalanceUser1.add(ether('1')));
            afterDropBalanceUser2.should.be.bignumber.equal(beforeDropBalanceUser2.add(ether('1')));
        });

        it("Should expect revert drop ether", async () => {
            await expectRevert(
                airdropInstance.dropEther([user1, user2], ether('1'), { from: owner }),
                "Failed to send Ether"
            );
        });

        it("Should be fail if caller not owner", async () => {
            await expectRevert(
                airdropInstance.dropEther([user1, user2], ether('1'), { from: user1 }),
                "Ownable: caller is not the owner"
            );
        });

        it("Should be fail if amount Is zero", async () => {
            await expectRevert(
                airdropInstance.dropEther([user1, user2], ether('0'), { from: owner }),
                "Amount is zero"
            );
        });

        it("Should be fail if array is empty", async () => {
            await expectRevert(
                airdropInstance.dropEther([], ether('1'), { from: owner }),
                "Array is empty"
            );
        });
    });

    it("Should transfer all ethers to the owner", async () => {

        await airdropInstance.depositEther({ from: owner, value: ether('3') });

        let beforeWithdrawBalanceOwner = await balance.current(owner);
        let transaction = await airdropInstance.withdrawEther({ from: owner });

        const tx = await web3.eth.getTransaction(transaction.tx);
        const gasCost = new BN(tx.gasPrice).mul(new BN(transaction.receipt.gasUsed));

        let afterWithdrawBalanceOwner = await balance.current(owner);

        afterWithdrawBalanceOwner.should.be.bignumber.equal(beforeWithdrawBalanceOwner.sub(gasCost).add(ether('3')));
    });

    it("Should transfer tokens from owner to airdrop contract", async () => {

        let amount = web3.utils.toWei('10', 'mwei');

        await tokenInstance.mint(owner, amount, { from: owner });

        await tokenInstance.approve(airdropInstance.address, amount, { from: owner });

        await airdropInstance.depositTokens(amount, { from: owner });

        let balanceAirdrop = await tokenInstance.balanceOf(airdropInstance.address);
        balanceAirdrop = web3.utils.fromWei(balanceAirdrop, 'mwei');

        balanceAirdrop.should.be.bignumber.equal('10');
    });

    it("Should transfer token amounts to recipients", async () => {
        let amount = web3.utils.toWei('30', 'mwei');

        await tokenInstance.mint(owner, amount, { from: owner });
        await tokenInstance.approve(airdropInstance.address, amount, { from: owner });
        await airdropInstance.depositTokens(amount, { from: owner });

        await airdropInstance.dropTokens([user1, user2], amount / 2, { from: owner });

        let balanceUser1 = await tokenInstance.balanceOf(user1);
        balanceUser1 = web3.utils.fromWei(balanceUser1, 'mwei');

        let balanceUser2 = await tokenInstance.balanceOf(user2);
        balanceUser2 = web3.utils.fromWei(balanceUser2, 'mwei');

        balanceUser1.should.be.bignumber.equal('15');
        balanceUser2.should.be.bignumber.equal('15');
    });

    it("Should transfer all tokens to the owner address", async () => {

        let amount = web3.utils.toWei('30', 'mwei');

        await tokenInstance.mint(owner, amount, { from: owner });
        await tokenInstance.approve(airdropInstance.address, amount, { from: owner });
        await airdropInstance.depositTokens(amount, { from: owner });

        await airdropInstance.withdrawTokens({ from: owner });

        let balanceOwner = await tokenInstance.balanceOf(owner);
        balanceOwner = web3.utils.fromWei(balanceOwner, 'mwei');

        balanceOwner.should.be.bignumber.equal('30');
    });
});