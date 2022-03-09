const Airdrop = artifacts.require("Airdrop");
const MyToken = artifacts.require("MyToken");
const { constants, expectRevert, balance, send, ether, BN, time, expectEvent, snapshot } = require('@openzeppelin/test-helpers');

const { expect } = require('chai');
const EIP712 = require("./utils/eip712.js");

contract("Airdrop", ([owner, user1, user2, user3]) => {

    const TYPES = {
        Container: [
            { type: "address", name: "sender" },
            { type: "address[]", name: "recipients" },
            { type: "uint256[]", name: "amounts" },
            { type: "uint256", name: "deadline" },
            { type: "bool", name: "isEther" },
            { type: "uint256", name: "nonce" }
        ]
    };

    async function createSign(_sender, _recipients, _amounts, _deadline, _isEther, _nonce) {

        let testTypeData = function() {
            return EIP712.createTypeData(
                TYPES,
                "Container",
                new EIP712.DomainData(
                    "Airdrop",
                    "v1",
                    new BN("1"),
                    airdrop.address
                ), {
                    sender: _sender,
                    recipients: _recipients,
                    amounts: _amounts,
                    deadline: _deadline,
                    isEther: _isEther,
                    nonce: _nonce,
                });
        }
        return await EIP712.signTypedData(web3, owner, testTypeData());
    }

    let now = Math.round(+new Date() / 1000);

    let reverter;
    let myToken;
    let airdrop;

    before('setup', async() => {
        myToken = await MyToken.new("MyToken", "MT");
        airdrop = await Airdrop.new(myToken.address);
        reverter = await snapshot();
    });

    afterEach('reverter', async() => {
        await reverter.restore();
    });

    describe("Functions", async() => {
        describe("constructor", async() => {
            it('Should fail if pass zero address Airdrop SC', async() => {
                await expectRevert(Airdrop.new(constants.ZERO_ADDRESS), "ERROR_INVALID_ADDRESS");
            });
            it('Should deploy Airdrop SC successfully', async() => {
                expect(await airdrop.rewardToken()).to.be.equal(myToken.address);
            });
        });
        describe("depositTokens", async() => {
            it('Should fail if sender is not owner', async() => {
                await expectRevert(airdrop.depositTokens(ether('1'), { from: user1 }), "Ownable: caller is not the owner");
            });
            it('Should fail if amount is not more than zero', async() => {
                await expectRevert(airdrop.depositTokens(ether('0')), "ERROR_WRONG_AMOUNT");
            });
            it('Should transfer tokens from owner to airdrop contract successfully', async() => {
                let beforeBalanceAirdrop = await myToken.balanceOf(airdrop.address);
                let beforeBalanceOwner = await myToken.balanceOf(owner);
                await myToken.approve(airdrop.address, ether('1'));
                let tx = await airdrop.depositTokens(ether('1'));
                expectEvent(
                    tx,
                    "DepositTokens", { sender: owner, amount: ether('1') }
                );
                let afterBalanceAirdrop = await myToken.balanceOf(airdrop.address);
                let afterBalanceOwner = await myToken.balanceOf(owner);
                expect(afterBalanceAirdrop).to.be.bignumber.equal(beforeBalanceAirdrop.add(ether('1')));
                expect(afterBalanceOwner).to.be.bignumber.equal(beforeBalanceOwner.sub(ether('1')));
            });
        });
        describe("depositEther", async() => {
            it('Should fail if sender is not owner', async() => {
                await expectRevert(airdrop.depositEther({ from: user1, value: ether('1') }), "Ownable: caller is not the owner");
            });
            it('Should transfer coins from owner to airdrop contract successfully', async() => {
                let beforeBalanceAirdrop = await balance.current(airdrop.address);
                let beforeBalanceOwner = await balance.current(owner);
                let transaction = await airdrop.depositEther({ from: owner, value: ether('2') });
                expectEvent(
                    transaction,
                    "DepositEther", { sender: owner, amount: ether('2') }
                );
                const tx = await web3.eth.getTransaction(transaction.tx);
                const gasCost = new BN(tx.gasPrice).mul(new BN(transaction.receipt.gasUsed));

                let afterBalanceAirdrop = await balance.current(airdrop.address);
                let afterBalanceOwner = await balance.current(owner);
                expect(afterBalanceAirdrop).to.be.bignumber.equal(beforeBalanceAirdrop.add(ether('2')));
                expect(afterBalanceOwner).to.be.bignumber.equal(beforeBalanceOwner.sub(gasCost).sub(ether('2')));
            });
        });
        describe("updateTokenAddress", async() => {
            it('Should fail if sender is not owner', async() => {
                await expectRevert(airdrop.updateTokenAddress(myToken.address, { from: user1 }), "Ownable: caller is not the owner");
            });
            it('Should fail if pass zero address Token SC', async() => {
                await expectRevert(airdrop.updateTokenAddress(constants.ZERO_ADDRESS), "ERROR_INVALID_ADDRESS");
            });
            it('Should update token address successfully', async() => {
                let newToken = await MyToken.new("Token", "T");
                await airdrop.updateTokenAddress(newToken.address);
                expect(await airdrop.rewardToken()).to.be.equal(newToken.address);
            });
        });
        describe("withdrawTokens", async() => {
            it('Should fail if sender is not owner', async() => {
                await expectRevert(airdrop.withdrawTokens({ from: user1 }), "Ownable: caller is not the owner");
            });
            it('Should fail if amount is not more than zero', async() => {
                await expectRevert(airdrop.withdrawTokens(), "ERROR_WRONG_AMOUNT");
            });
            it('Should transfer tokens from airdrop contract to owner successfully', async() => {
                let beforeBalanceAirdrop = await myToken.balanceOf(airdrop.address);
                await myToken.approve(airdrop.address, ether('1'));
                await airdrop.depositTokens(ether('1'));
                let afterBalanceAirdrop = await myToken.balanceOf(airdrop.address);
                expect(afterBalanceAirdrop).to.be.bignumber.equal(beforeBalanceAirdrop.add(ether('1')));

                let beforeBalanceOwner = await myToken.balanceOf(owner);
                await airdrop.withdrawTokens();
                let afterBalanceOwner = await myToken.balanceOf(owner);
                expect(afterBalanceOwner).to.be.bignumber.equal(beforeBalanceOwner.add(afterBalanceAirdrop));
            });
        });
        describe("withdrawEther", async() => {
            it('Should fail if sender is not owner', async() => {
                await expectRevert(airdrop.withdrawEther({ from: user1 }), "Ownable: caller is not the owner");
            });
            it('Should fail if amount is not more than zero', async() => {
                await expectRevert(airdrop.withdrawEther(), "ERROR_WRONG_AMOUNT");
            });
            it('Should transfer tokens from airdrop contract to owner successfully', async() => {
                let beforeBalanceAirdrop = await balance.current(airdrop.address);
                await airdrop.depositEther({ from: owner, value: ether('2') });
                let afterBalanceAirdrop = await balance.current(airdrop.address);
                expect(afterBalanceAirdrop).to.be.bignumber.equal(beforeBalanceAirdrop.add(ether('2')));

                let beforeBalanceOwner = await balance.current(owner);
                let transaction = await airdrop.withdrawEther();
                const tx = await web3.eth.getTransaction(transaction.tx);
                const gasCost = new BN(tx.gasPrice).mul(new BN(transaction.receipt.gasUsed));
                let afterBalanceOwner = await balance.current(owner);
                expect(afterBalanceOwner).to.be.bignumber.equal(beforeBalanceOwner.sub(gasCost).add(afterBalanceAirdrop));
            });
        });
        describe("dropTokens", async() => {
            it('Should fail if sender is not owner', async() => {
                let deadline = now + 100;
                let sign = await createSign(owner, [user1, user2], [ether('1'), ether('2')], deadline, false, '1');
                await expectRevert(airdrop.dropTokens([user1], [ether('1')], false, '1', deadline, sign.v, sign.r, sign.s, { from: user1 }), "Ownable: caller is not the owner");
            });
            it('Should fail if owner has not signed the message', async() => {
                let deadline = now + 100;
                let sign = await createSign(user1, [user1, user2], [ether('1').toString(), ether('2').toString()], deadline, false, '1');
                await expectRevert(airdrop.dropTokens([user1, user2], [ether('1').toString(), ether('2').toString()], false, '1', deadline, sign.v, sign.r, sign.s), "Invalid signer");
            });
            it('Should fail if arrays has different length', async() => {
                let deadline = now + 100;
                let sign = await createSign(owner, [user1, user2], [ether('1').toString()], deadline, false, '1');
                await expectRevert(airdrop.dropTokens([user1, user2], [ether('1').toString()], false, '1', deadline, sign.v, sign.r, sign.s), "Arrays different length");
            });
            it('Should fail if deadline has passed', async() => {
                let deadline = 100;
                let sign = await createSign(user1, [user1, user2], [ether('1').toString(), ether('2').toString()], deadline, false, '1');
                await expectRevert(airdrop.dropTokens([user1, user2], [ether('1').toString(), ether('2').toString()], false, '1', deadline, sign.v, sign.r, sign.s), "ERROR_TIME_OUT");
            });
            it('Should fail if nonce used before', async() => {
                let deadline = now + 100;
                let sign = await createSign(owner, [user1, user2], [ether('1').toString(), ether('2').toString()], deadline, false, '1');
                await myToken.approve(airdrop.address, ether('6'));
                await airdrop.depositTokens(ether('6'));
                await airdrop.dropTokens([user1, user2], [ether('1').toString(), ether('2').toString()], false, '1', deadline, sign.v, sign.r, sign.s);
                await expectRevert(airdrop.dropTokens([user1, user2], [ether('1').toString(), ether('2').toString()], false, '1', deadline, sign.v, sign.r, sign.s), "Nonce used before");
            });
            it('Should fail if whether argument(isEther) equal true', async() => {
                let deadline = now + 100;
                let sign = await createSign(owner, [user1, user2], [ether('1').toString(), ether('2').toString()], deadline, true, '1');
                await myToken.approve(airdrop.address, ether('6'));
                await airdrop.depositTokens(ether('6'));
                await expectRevert(airdrop.dropTokens([user1, user2], [ether('1').toString(), ether('2').toString()], true, '1', deadline, sign.v, sign.r, sign.s), "Drop only tokens");
            });
            it('Should drop tokens successfully', async() => {
                let deadline = now + 100;
                let sign = await createSign(owner, [user1, user2], [ether('1').toString(), ether('2').toString()], deadline, false, '1');
                await myToken.approve(airdrop.address, ether('3'));
                let tx = await airdrop.depositTokens(ether('3'));
                expectEvent(
                    tx,
                    "DepositTokens", { sender: owner, amount: ether('3') }
                );
                let beforeBalanceUser1 = await airdrop.userTokens(user1);
                let beforeBalanceUser2 = await airdrop.userTokens(user2);
                await airdrop.dropTokens([user1, user2], [ether('1').toString(), ether('2').toString()], false, '1', deadline, sign.v, sign.r, sign.s);
                let afterBalanceUser1 = await airdrop.userTokens(user1);
                let afterBalanceUser2 = await airdrop.userTokens(user2);
                expect(afterBalanceUser1).to.be.bignumber.equal(beforeBalanceUser1.add(ether('1')));
                expect(afterBalanceUser2).to.be.bignumber.equal(beforeBalanceUser2.add(ether('2')));
            });
        });
        describe("dropEther", async() => {
            it('Should fail if sender is not owner', async() => {
                let deadline = now + 100;
                let sign = await createSign(owner, [user1], [ether('1').toString()], deadline, true, '1');
                await expectRevert(airdrop.dropEther([user1], [ether('1')], true, '1', deadline, sign.v, sign.r, sign.s, { from: user1 }), "Ownable: caller is not the owner");
            });
            it('Should fail if owner has not signed the message', async() => {
                let deadline = now + 100;
                let sign = await createSign(user1, [user1], [ether('1').toString()], deadline, true, '1');
                await expectRevert(airdrop.dropEther([user1], [ether('1')], true, '1', deadline, sign.v, sign.r, sign.s), "Invalid signer");
            });
            it('Should fail if arrays has different length', async() => {
                let deadline = now + 100;
                let sign = await createSign(owner, [user1, user2], [ether('1').toString()], deadline, true, '1');
                await expectRevert(airdrop.dropEther([user1, user2], [ether('1')], true, '1', deadline, sign.v, sign.r, sign.s), "Arrays different length");
            });
            it('Should fail if deadline has passed', async() => {
                let deadline = 100;
                let sign = await createSign(owner, [user1], [ether('1').toString()], deadline, true, '1');
                await expectRevert(airdrop.dropEther([user1], [ether('1')], true, '1', deadline, sign.v, sign.r, sign.s), "ERROR_TIME_OUT");
            });
            it('Should fail if nonce used before', async() => {
                await airdrop.depositEther({ from: owner, value: ether('3') });
                let deadline = now + 100;
                let sign = await createSign(owner, [user1, user2], [ether('1').toString(), ether('2').toString()], deadline, true, '1');
                await airdrop.dropEther([user1, user2], [ether('1'), ether('2')], true, '1', deadline, sign.v, sign.r, sign.s);
                await expectRevert(airdrop.dropEther([user1, user2], [ether('1'), ether('2')], true, '1', deadline, sign.v, sign.r, sign.s), "Nonce used before");
            });
            it('Should fail if whether argument(isEther) equal false', async() => {
                await airdrop.depositEther({ from: owner, value: ether('3') });
                let deadline = now + 100;
                let sign = await createSign(owner, [user1, user2], [ether('1').toString(), ether('2').toString()], deadline, false, '1');
                await expectRevert(airdrop.dropEther([user1, user2], [ether('1'), ether('2')], false, '1', deadline, sign.v, sign.r, sign.s), "Drop only ethers");
            });
            it('Should drop tokens successfully', async() => {
                let tx = await airdrop.depositEther({ from: owner, value: ether('3') });
                expectEvent(
                    tx,
                    "DepositEther", { sender: owner, amount: ether('3') }
                );
                let deadline = now + 100;
                let sign = await createSign(owner, [user1, user2], [ether('1').toString(), ether('2').toString()], deadline, true, '1');
                let beforeBalanceUser1 = await airdrop.userEthers(user1);
                let beforeBalanceUser2 = await airdrop.userEthers(user2);
                await airdrop.dropEther([user1, user2], [ether('1'), ether('2')], true, '1', deadline, sign.v, sign.r, sign.s);
                let afterBalanceUser1 = await airdrop.userEthers(user1);
                let afterBalanceUser2 = await airdrop.userEthers(user2);
                expect(afterBalanceUser1).to.be.bignumber.equal(beforeBalanceUser1.add(ether('1')));
                expect(afterBalanceUser2).to.be.bignumber.equal(beforeBalanceUser2.add(ether('2')));
            });
        });
        describe("claimToken", async() => {
            it('Should fail if user dont have tokens', async() => {
                await expectRevert(airdrop.claimToken({ from: user1 }), "The user don't have tokens");
            });
            it('Should fail if not enough tokens on the contract', async() => {
                await myToken.approve(airdrop.address, ether('2'));
                await airdrop.depositTokens(ether('2'));

                let deadline = now + 100;
                let sign = await createSign(owner, [user1, user2], [ether('1').toString(), ether('1').toString()], deadline, false, '1');
                await airdrop.dropTokens([user1, user2], [ether('1'), ether('1')], false, '1', deadline, sign.v, sign.r, sign.s);
                await airdrop.withdrawTokens();
                await expectRevert(airdrop.claimToken({ from: user1 }), "Not enough tokens on the contract");
            });
            it('Should claim tokens successfully', async() => {
                await myToken.approve(airdrop.address, ether('2'));
                await airdrop.depositTokens(ether('2'));

                let deadline = now + 100;
                let sign = await createSign(owner, [user1, user2], [ether('1.5').toString(), ether('0.5').toString()], deadline, false, '1');
                await airdrop.dropTokens([user1, user2], [ether('1.5'), ether('0.5')], false, '1', deadline, sign.v, sign.r, sign.s);

                let beforeBalanceUser1 = await myToken.balanceOf(user1);
                let tx = await airdrop.claimToken({ from: user1 });
                expectEvent(
                    tx,
                    "ClaimToken", { recipient: user1, amount: ether('1.5') }
                );
                let afterBalanceUser1 = await myToken.balanceOf(user1);
                expect(afterBalanceUser1).to.be.bignumber.equal(beforeBalanceUser1.add(ether('1.5')));
            });
        });
        describe("claimEther", async() => {
            it('Should fail if user dont have ethers', async() => {
                await expectRevert(airdrop.claimEther({ from: user1 }), "The user don't have ethers");
            });
            it('Should fail if not enough ethers on the contract', async() => {
                await airdrop.depositEther({ from: owner, value: ether('2') });

                let deadline = now + 100;
                let sign = await createSign(owner, [user1, user2], [ether('0.1').toString(), ether('0.4').toString()], deadline, true, '1');
                await airdrop.dropEther([user1, user2], [ether('0.1'), ether('0.4')], true, '1', deadline, sign.v, sign.r, sign.s);
                await airdrop.withdrawEther();
                await expectRevert(airdrop.claimEther({ from: user1 }), "Not enough ethers on the contract");
            });
            it('Should claim ether successfully', async() => {
                await airdrop.depositEther({ from: owner, value: ether('2') });
                let deadline = now + 100;
                let sign = await createSign(owner, [user1, user2], [ether('0.1').toString(), ether('0.4').toString()], deadline, true, '1');
                await airdrop.dropEther([user1, user2], [ether('0.1'), ether('0.4')], true, '1', deadline, sign.v, sign.r, sign.s);

                let beforeBalanceUser1 = await balance.current(user1);
                let transaction = await airdrop.claimEther({ from: user1 });
                expectEvent(
                    transaction,
                    "ClaimEther", { recipient: user1, amount: ether('0.1') }
                );
                const tx = await web3.eth.getTransaction(transaction.tx);
                const gasCost = new BN(tx.gasPrice).mul(new BN(transaction.receipt.gasUsed));
                let afterBalanceUser1 = await balance.current(user1);
                expect(afterBalanceUser1).to.be.bignumber.equal(beforeBalanceUser1.sub(gasCost).add(ether('0.1')));
            });
        });
    });
});