const {
    BN,
    send,
    constants,
    expectRevert,
    snapshot,
    expectEvent,
    balance,
    ether
} = require('@openzeppelin/test-helpers');
const { expect } = require('chai');
require('chai')
    .use(require('chai-as-promised'))
    .use(require('chai-bignumber')())
    .use(require('chai-bn')(BN))
    .should();

const Forwarder = artifacts.require("Forwarder");
let snapshotA;

contract("Forwarder", ([owner, user1, user2]) => {

    before(async() => {
        forwarderInstance = await Forwarder.new();
        snapshotA = await snapshot();
    });

    afterEach(async() => {
        await snapshotA.restore();
    });

    describe("functions", async() => {
        describe("forward", async() => {
            it("Should be fail if address destination is zero", async() => {
                await expectRevert(
                    forwarderInstance.forward(constants.ZERO_ADDRESS, "Information", { from: user1, value: ether('2') }),
                    "forward to the zero address",
                );
            });
            it("Should check correct transfer amount from user who transfer", async() => {
                let beforeBalanceUser1 = await balance.current(user1);
                let transaction = await forwarderInstance.forward(user2, "Information", { from: user1, value: ether('2') });
                const tx = await web3.eth.getTransaction(transaction.tx);
                const gasCost = new BN(tx.gasPrice).mul(new BN(transaction.receipt.gasUsed));
                let newBalanceUser1 = await balance.current(user1);
                expect(newBalanceUser1).to.be.bignumber.equal(beforeBalanceUser1.sub(gasCost).sub(ether('2')));
            });
            it("Should deposit and forward ether to the destination address", async() => {
                let beforeBalanceUser2 = await balance.current(user2);
                await forwarderInstance.forward(user2, "Information", { from: user1, value: ether('2') });
                let newBalanceUser2 = await balance.current(user2);
                expect(newBalanceUser2).to.be.bignumber.equal(beforeBalanceUser2.add(ether('2')));
            });
        });
        describe("events", async() => {
            describe("LogForwarded", async() => {
                it("emits a LogForwarded event on succesfull function forward", async() => {
                    const receipt = await forwarderInstance.forward(user2, "Information", { from: user1, value: ether('2') });
                    expectEvent(receipt, 'LogForwarded', {
                        from: user1,
                        to: user2,
                        amount: ether('2'),
                        data: "Information"
                    });
                });
            });
        });
    });
});