const {
    BN,
    send,
    constants,
    expectRevert,
    assertRevert,
    balance,
    ether
} = require('@openzeppelin/test-helpers');
require('chai')
    .use(require('chai-as-promised'))
    .use(require('chai-bn')(BN))
    .should();

const Token = artifacts.require("Token");
const Airdrop = artifacts.require("Airdrop");

contract("Airdrop", ([owner, user1, user2, user3]) => {

    beforeEach(async () => {
        tokenInstance = await Token.new({from : owner});
        airdropInstance = await Airdrop.new(tokenInstance.address,{from: owner});
    });

    it("Should deposit ether to the contract", async () => {

        await airdropInstance.depositEther({from: owner,value: ether('2')});

        let etherBalanceAirdrop = await balance.current(airdropInstance.address);

        etherBalanceAirdrop.should.be.bignumber.equal(ether('2'));
    });

    it("Should transfer token amounts to recipients", async () => {

        await airdropInstance.dropTokens([user1,user2],web3.utils.toWei('15','mwei'),{from: owner});

        let balanceUser1 = await airdropInstance.balanceOf(user1);
        balanceUser1 = web3.utils.fromWei(balanceUser1,'mwei');

        let balanceUser2 = await airdropInstance.balanceOf(user2);
        balanceUser2 = web3.utils.fromWei(balanceUser2,'mwei');

        balanceUser1.should.be.bignumber.equal('15');
        balanceUser2.should.be.bignumber.equal('15');
    });

    it("Should transfer ether amounts to recipients", async () => {

        await airdropInstance.depositEther({from: owner,value: ether('3')});

        let beforeDropBalanceUser1 = await balance.current(user1);
        let beforeDropBalanceUser2 = await balance.current(user2);

        await airdropInstance.dropEther([user1,user2],ether('1'),{from: owner});

        let afterDropBalanceUser1 = await balance.current(user1);
        let afterDropBalanceUser2 = await balance.current(user2);

        afterDropBalanceUser1.should.be.bignumber.equal(beforeDropBalanceUser1.add(ether('1')));
        afterDropBalanceUser2.should.be.bignumber.equal(beforeDropBalanceUser2.add(ether('1')));
    });

    it("Should update token for airdrop", async () => {

        let newToken = await Token.new({from : owner});
        await airdropInstance.updateTokenAddress(newToken.address);

        let actualTokenAddress = await airdropInstance.getTokenAddress();

        assert.equal(actualTokenAddress,newToken.address);
    });

    it("Should transfer all ethers to the owner", async () => {
        
        await airdropInstance.depositEther({from: owner,value: ether('3')});

        let beforeWithdrawBalanceOwner = await balance.current(owner);
        let transaction = await airdropInstance.withdrawEther({from: owner});

        const tx = await web3.eth.getTransaction(transaction.tx);
        const gasCost = new BN(tx.gasPrice).mul(new BN(transaction.receipt.gasUsed));

        let afterWithdrawBalanceOwner = await balance.current(owner);

        afterWithdrawBalanceOwner.should.be.bignumber.equal(beforeWithdrawBalanceOwner.sub(gasCost).add(ether('3')));
    });
});