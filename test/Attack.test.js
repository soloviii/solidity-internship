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

const MyToken = artifacts.require("MyToken");
const Attacker = artifacts.require("Attacker");

contract("Attacker", ([owner, user1, user2, user3]) => {

    before(async () => {
        tokenInstance = await MyToken.new();
        attackerInstance = await Attacker.new(tokenInstance.address);
    });

    it("shouldn't withdraw ethers from another contract", async () => {

        await send.ether(user2, tokenInstance.address, new BN(ether('10')));

        await tokenInstance.transfer(attackerInstance.address, web3.utils.toWei('10', 'mwei'), { from: user2 });

        await attackerInstance.attack();

        let tokenBalance = await balance.current(attackerInstance.address);

        tokenBalance.should.be.bignumber.equal(ether('0'));
    });

});