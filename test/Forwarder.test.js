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

contract("AirDrop", ([owner, user1, user2]) => {

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
                    forwarderInstance.forward("Information", constants.ZERO_ADDRESS, { from: user1, value: ether('2') }),
                    "forward to the zero address",
                );
            });
            it("Should deposit and forward ether to the destination address", async() => {
                let beforeBalanceUser1 = await balance.current(user2);
                await forwarderInstance.forward("Information", user2, { from: user1, value: ether('2') });
                let newBalanceUser1 = await balance.current(user2);
                expect(newBalanceUser1).to.be.bignumber.equal(beforeBalanceUser1.add(ether('2')));
            });
        });
        describe("events", async() => {
            describe("LogForwarded", async() => {
                it("emits a LogForwarded event on succesfull function forward", async() => {
                    const receipt = await forwarderInstance.forward("Information", user2, { from: user1, value: ether('2') });
                    expectEvent(receipt, 'LogForwarded', {
                        sender: user1,
                        amount: ether('2'),
                        data: "Information"
                    });
                });
            });
        });
    });
});