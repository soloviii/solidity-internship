import { expect } from 'chai'
import chai from 'chai'
import { ethers } from 'hardhat'
import { solidity } from 'ethereum-waffle'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { Contract } from 'ethers'
const { ether } = require('@openzeppelin/test-helpers')

chai.use(solidity)

describe('Vesting', async () => {

    //permissions
    const CAN_MINT_TOKENS = 0
    const CAN_BURN_TOKENS = 1

    async function setCurrentTime(time: any): Promise<any> {
        return await ethers.provider.send('evm_mine', [time])
    }

    const a = (account: SignerWithAddress) => {
        return account.getAddress().then((res: string) => {
            return res.toString()
        })
    }

    function toETH(num: any): any {
        return ether(num.toString()).toString()
    }

    let management: Contract
    let vesting: Contract
    let rewardToken: Contract

    let owner: SignerWithAddress
    let investor1: SignerWithAddress
    let investor2: SignerWithAddress
    let otherAccounts: SignerWithAddress[]

    beforeEach(async () => {
        ;[
            owner,
            investor1,
            investor2,
            ...otherAccounts
        ] = await ethers.getSigners()
        const Management = await ethers.getContractFactory('Management')
        const Vesting = await ethers.getContractFactory('Vesting')
        const MyToken = await ethers.getContractFactory('MyToken')

        management = await Management.deploy()
        rewardToken = await MyToken.deploy(management.address, "MyToken", "MK")
        vesting = await Vesting.deploy(rewardToken.address)

        await management.setPermission(
            vesting.address,
            CAN_MINT_TOKENS,
            true,
        )
        await management.setPermission(
            vesting.address,
            CAN_BURN_TOKENS,
            true,
        )
    })
    describe('Functions', async () => {
        describe('setInitialTimestamp', async () => {
            it('should fail if sender is not owner', async () => {
                await expect(vesting.connect(investor1).setInitialTimestamp('100')
                ).to.be.revertedWith("Ownable: caller is not the owner")
            })
            it('should fail if initial timestamp has already been initialized', async () => {
                await vesting.setInitialTimestamp('100')
                await expect(vesting.setInitialTimestamp('100')
                ).to.be.revertedWith("The initial timestamp has already been initialized")
            })
            it('should set initial timestamp successfully', async () => {
                await expect(vesting.setInitialTimestamp('100'),
                ).to.emit(vesting, 'SetInitialTimestamp').withArgs('100')
            })
        })
        describe('addInvestors', async () => {
            it('should fail if sender is not owner', async () => {
                await expect(vesting.connect(investor1).addInvestors([a(investor1), a(investor2)],
                    [toETH("1"), toETH("2")], 0)
                ).to.be.revertedWith("Ownable: caller is not the owner")
            })
            it('should fail if arrays has different length', async () => {
                await expect(vesting.addInvestors([a(investor1), a(investor2)],
                    [toETH("1")], 0)
                ).to.be.revertedWith("Arrays different length")
            })
            it('should mint tokens for vesting equal to the sum of tokens amount successfully', async () => {
                let beforeBalanceVesting = await rewardToken.balanceOf(vesting.address);
                await expect(vesting.addInvestors([a(investor1), a(investor2)],
                    [toETH("1"), toETH("2")], 0)
                ).to.emit(vesting, 'AddInvestors').withArgs([investor1.address, investor2.address],
                    [toETH("1"), toETH("2")], 0)
                let afterBalanceVesting = await rewardToken.balanceOf(vesting.address);
                expect(afterBalanceVesting).to.be.equal(beforeBalanceVesting.add(toETH("3")));
            })
        })
        describe('withdrawTokens', async () => {
            it('should fail if initial timestamp wasnt initialize', async () => {
                await expect(vesting.connect(investor1).withdrawTokens()
                ).to.be.revertedWith("The initial timestamp wasn't initialize")
            })
            it('should fail if amount of accrued reward tokens is 0', async () => {
                let blo = await ethers.provider.getBlockNumber()
                let now = (await ethers.provider.getBlock(blo)).timestamp
                await vesting.setInitialTimestamp(now)
                await expect(vesting.connect(investor1).withdrawTokens()
                ).to.be.revertedWith("Amount is zero")
            })
            it('should withdraw tokens succesfully(allocation - Seed)', async () => {
                let blo = await ethers.provider.getBlockNumber()
                let now = (await ethers.provider.getBlock(blo)).timestamp
                await vesting.setInitialTimestamp(now);

                await expect(vesting.addInvestors([a(investor1), a(investor2)],
                    [toETH("1"), toETH("2")], 0)
                ).to.emit(vesting, 'AddInvestors').withArgs([investor1.address, investor2.address],
                    [toETH("1"), toETH("2")], 0)

                let beforeBalanceInvestor1 = await rewardToken.balanceOf(investor1.address);
                let beforeBalanceInvestor2 = await rewardToken.balanceOf(investor2.address);
                await setCurrentTime(now + 1001); // after cliff period
                await expect(vesting.connect(investor1).withdrawTokens())
                    .to.emit(vesting, 'Harvest').withArgs(investor1.address, '110000000000000000')
                let afterBalanceInvestor1 = await rewardToken.balanceOf(investor1.address);
                let afterBalanceInvestor2 = await rewardToken.balanceOf(investor2.address);
                expect(afterBalanceInvestor1).to.be.equal(beforeBalanceInvestor1.add("110000000000000000"));
                expect(afterBalanceInvestor2).to.be.equal(beforeBalanceInvestor2.add("0"));

                await setCurrentTime(now + 1001 + 32400); // after 100% vesting
                await expect(vesting.connect(investor1).withdrawTokens())
                    .to.emit(vesting, 'Harvest').withArgs(investor1.address, '890000000000000000')
                await expect(vesting.connect(investor2).withdrawTokens())
                    .to.emit(vesting, 'Harvest').withArgs(investor2.address, '2000000000000000000')
                expect(await rewardToken.balanceOf(investor1.address)).to.be.equal("1000000000000000000");
                expect(await rewardToken.balanceOf(investor2.address)).to.be.equal("2000000000000000000");
            })
            it('should withdraw tokens succesfully(allocation - Private)', async () => {
                let blo = await ethers.provider.getBlockNumber()
                let now = (await ethers.provider.getBlock(blo)).timestamp
                await vesting.setInitialTimestamp(now);

                await expect(vesting.addInvestors([a(investor1), a(investor2)],
                    [toETH("1"), toETH("2")], 1)
                ).to.emit(vesting, 'AddInvestors').withArgs([investor1.address, investor2.address],
                    [toETH("1"), toETH("2")], 1)

                let beforeBalanceInvestor1 = await rewardToken.balanceOf(investor1.address);
                let beforeBalanceInvestor2 = await rewardToken.balanceOf(investor2.address);
                await setCurrentTime(now + 1001); // after cliff period
                await expect(vesting.connect(investor1).withdrawTokens())
                    .to.emit(vesting, 'Harvest').withArgs(investor1.address, '160000000000000000')
                await expect(vesting.connect(investor2).withdrawTokens())
                    .to.emit(vesting, 'Harvest').withArgs(investor2.address, '320000000000000000')
                let afterBalanceInvestor1 = await rewardToken.balanceOf(investor1.address);
                let afterBalanceInvestor2 = await rewardToken.balanceOf(investor2.address);
                expect(afterBalanceInvestor1).to.be.equal(beforeBalanceInvestor1.add("160000000000000000"));
                expect(afterBalanceInvestor2).to.be.equal(beforeBalanceInvestor2.add("320000000000000000"));

                await setCurrentTime(now + 1001 + 32400); // after 100% vesting
                await expect(vesting.connect(investor1).withdrawTokens())
                    .to.emit(vesting, 'Harvest').withArgs(investor1.address, '840000000000000000')
                await expect(vesting.connect(investor2).withdrawTokens())
                    .to.emit(vesting, 'Harvest').withArgs(investor2.address, '1680000000000000000')
                expect(await rewardToken.balanceOf(investor1.address)).to.be.equal("1000000000000000000");
                expect(await rewardToken.balanceOf(investor2.address)).to.be.equal("2000000000000000000");
            })
        })
    })
})