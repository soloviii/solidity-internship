import { expect } from 'chai'
import chai from 'chai'
import { ethers } from 'hardhat'
import { solidity } from 'ethereum-waffle'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { Contract } from 'ethers'
const { ether, constants } = require('@openzeppelin/test-helpers')

chai.use(solidity)

describe('VestingUpgradeable_V2', async () => {

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
        const VestingUpgradeable_V2 = await ethers.getContractFactory('VestingUpgradeable_V2')
        const MyToken = await ethers.getContractFactory('MyToken')

        management = await Management.deploy()
        rewardToken = await MyToken.deploy()
        await rewardToken.initialize(management.address, "MyToken", "MK")
        vesting = await VestingUpgradeable_V2.deploy()
        await vesting.initialize(rewardToken.address)

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
        describe('initialize', async () => {
            it('should fail if reward token address is zero', async () => {
                const VestingUpgradeable_V2 = await ethers.getContractFactory('VestingUpgradeable_V2')
                let vesting = await VestingUpgradeable_V2.deploy()
                await expect(vesting.initialize(constants.ZERO_ADDRESS)
                ).to.be.revertedWith("Incorrect token address")
            })
            it('should fail if contract has been already initialized', async () => {
                const VestingUpgradeable_V2 = await ethers.getContractFactory('VestingUpgradeable_V2')
                let vesting = await VestingUpgradeable_V2.deploy()
                await vesting.initialize(rewardToken.address)
                await expect(vesting.initialize(rewardToken.address)
                ).to.be.revertedWith("Initializable: contract is already initialized")
            })
            it('should initialize vesting info after deploy correctly', async () => {
                const VestingUpgradeable_V2 = await ethers.getContractFactory('VestingUpgradeable_V2')
                let vesting = await VestingUpgradeable_V2.deploy()
                await vesting.initialize(rewardToken.address)
                let vestingInfoSeed = await vesting.vestingInfo(0)
                expect(vestingInfoSeed.periodDuration).to.be.equal(6 * 60);
                expect(vestingInfoSeed.cliffDuration).to.be.equal(10 * 60);
                expect(vestingInfoSeed.initialPercentage).to.be.equal(10);
                let vestingInfoPrivate = await vesting.vestingInfo(1)
                expect(vestingInfoPrivate.periodDuration).to.be.equal(6 * 60);
                expect(vestingInfoPrivate.cliffDuration).to.be.equal(10 * 60);
                expect(vestingInfoPrivate.initialPercentage).to.be.equal(15);
            })
        })
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
                expect(await vesting.initialTimestamp()).to.be.equal('100');
            })
        })
        describe('changeInvestor', async () => {
            it('should fail if sender is not owner', async () => {
                await expect(vesting.connect(investor1).changeInvestor()
                ).to.be.revertedWith("Ownable: caller is not the owner")
            })
            it('should fail if investor has already taken away reward tokens', async () => {
                await expect(vesting.changeInvestor()
                ).to.be.revertedWith("Investor has already taken away reward tokens")
            })
            it('should change investor successfully', async () => {
                let blo = await ethers.provider.getBlockNumber()
                let now = (await ethers.provider.getBlock(blo)).timestamp
                await vesting.setInitialTimestamp(now + 10);

                await expect(vesting.addInvestors([a(investor1), a(investor2)],
                    [toETH("1"), toETH("2")], 0)
                ).to.emit(vesting, 'AddInvestors').withArgs([investor1.address, investor2.address],
                    [toETH("1"), toETH("2")], 0)

                await setCurrentTime(now + 1001 + 16200); // after 100% vesting

                let beforeBalanceInvestor1 = await rewardToken.balanceOf(investor1.address);
                let beforeBalanceInvestor2 = await rewardToken.balanceOf(investor2.address);

                await expect(vesting.changeInvestor()
                ).to.emit(vesting, 'ChangeInvestor').withArgs(investor1.address,
                    investor2.address);
                await expect(vesting.changeInvestor()
                ).to.be.revertedWith("The investor has been already changed")

                await expect(vesting.connect(investor2).withdrawTokens())
                    .to.emit(vesting, 'Harvest').withArgs(investor2.address, '3000000000000000000')
                await expect(vesting.connect(investor1).withdrawTokens()
                ).to.be.revertedWith("Amount is zero")

                let afterBalanceInvestor1 = await rewardToken.balanceOf(investor1.address);
                let afterBalanceInvestor2 = await rewardToken.balanceOf(investor2.address);
                expect(afterBalanceInvestor1).to.be.equal(beforeBalanceInvestor1.add("0"));
                expect(afterBalanceInvestor2).to.be.equal(beforeBalanceInvestor2.add("3000000000000000000"));
            })
        })
        describe('addInvestors', async () => {
            it('should fail if sender is not owner', async () => {
                await expect(vesting.connect(investor1).addInvestors([a(investor1), a(investor2)],
                    [toETH("1"), toETH("2")], 0)
                ).to.be.revertedWith("Ownable: caller is not the owner")
            })
            it('should fail if arrays has different length', async () => {
                let blo = await ethers.provider.getBlockNumber()
                let now = (await ethers.provider.getBlock(blo)).timestamp
                await vesting.setInitialTimestamp(now + 10)
                await expect(vesting.addInvestors([a(investor1), a(investor2)],
                    [toETH("1")], 0)
                ).to.be.revertedWith("Arrays different length")
            })
            it('should fail if vesting was start', async () => {
                await vesting.setInitialTimestamp('100')
                await expect(vesting.addInvestors([a(investor1), a(investor2)],
                    [toETH("1")], 0)
                ).to.be.revertedWith("The vesting was start")
            })
            it('should mint tokens for vesting equal to the sum of tokens amount successfully', async () => {
                let blo = await ethers.provider.getBlockNumber()
                let now = (await ethers.provider.getBlock(blo)).timestamp
                await vesting.setInitialTimestamp(now + 10)
                let beforeBalanceVesting = await rewardToken.balanceOf(vesting.address);
                await expect(vesting.addInvestors([a(investor1), a(investor2)],
                    [toETH("1"), toETH("2")], 0)
                ).to.emit(vesting, 'AddInvestors').withArgs([investor1.address, investor2.address],
                    [toETH("1"), toETH("2")], 0)
                let afterBalanceVesting = await rewardToken.balanceOf(vesting.address);
                let balanceInvestor1 = await vesting.userTokens(investor1.address, 0);
                let balanceInvestor2 = await vesting.userTokens(investor2.address, 0);
                expect(afterBalanceVesting).to.be.equal(beforeBalanceVesting.add(toETH("3")));
                expect(balanceInvestor1).to.be.equal(toETH("1"));
                expect(balanceInvestor2).to.be.equal(toETH("2"));

                beforeBalanceVesting = await rewardToken.balanceOf(vesting.address);
                await expect(vesting.addInvestors([a(investor1)],
                    [toETH("1")], 1)
                ).to.emit(vesting, 'AddInvestors').withArgs([investor1.address],
                    [toETH("1")], 1)
                balanceInvestor1 = await vesting.userTokens(investor1.address, 1);
                afterBalanceVesting = await rewardToken.balanceOf(vesting.address);
                expect(balanceInvestor1).to.be.equal(toETH("1"));
                expect(afterBalanceVesting).to.be.equal(beforeBalanceVesting.add(toETH("1")));
                expect(afterBalanceVesting).to.be.equal(toETH("4"));
            })
        })
        describe('withdrawTokens', async () => {
            it('should fail if vesting was not start', async () => {
                await expect(vesting.connect(investor1).withdrawTokens()
                ).to.be.revertedWith("The vesting was not start")
            })
            it('should fail if amount of accrued reward tokens is 0', async () => {
                let blo = await ethers.provider.getBlockNumber()
                let now = (await ethers.provider.getBlock(blo)).timestamp
                await vesting.setInitialTimestamp(now)
                await expect(vesting.connect(investor1).withdrawTokens()
                ).to.be.revertedWith("Amount is zero")
            })
            it('should withdraw tokens succesfully(AllocationType - Seed)', async () => {
                let blo = await ethers.provider.getBlockNumber()
                let now = (await ethers.provider.getBlock(blo)).timestamp
                await vesting.setInitialTimestamp(now + 10);

                await expect(vesting.addInvestors([a(investor1), a(investor2)],
                    [toETH("1"), toETH("2")], 0)
                ).to.emit(vesting, 'AddInvestors').withArgs([investor1.address, investor2.address],
                    [toETH("1"), toETH("2")], 0)

                let beforeBalanceInvestor1 = await rewardToken.balanceOf(investor1.address);
                let beforeBalanceInvestor2 = await rewardToken.balanceOf(investor2.address);
                await setCurrentTime(now + 1001); // after cliff period
                await expect(vesting.connect(investor1).withdrawTokens())
                    .to.emit(vesting, 'Harvest').withArgs(investor1.address, '120000000000000000')
                let afterBalanceInvestor1 = await rewardToken.balanceOf(investor1.address);
                let afterBalanceInvestor2 = await rewardToken.balanceOf(investor2.address);
                expect(afterBalanceInvestor1).to.be.equal(beforeBalanceInvestor1.add("120000000000000000"));
                expect(afterBalanceInvestor2).to.be.equal(beforeBalanceInvestor2.add("0"));

                await setCurrentTime(now + 1001 + 16200); // after 100% vesting
                await expect(vesting.connect(investor1).withdrawTokens())
                    .to.emit(vesting, 'Harvest').withArgs(investor1.address, '880000000000000000')
                await expect(vesting.connect(investor2).withdrawTokens())
                    .to.emit(vesting, 'Harvest').withArgs(investor2.address, '2000000000000000000')
                expect(await rewardToken.balanceOf(investor1.address)).to.be.equal("1000000000000000000");
                expect(await rewardToken.balanceOf(investor2.address)).to.be.equal("2000000000000000000");
            })
            it('should withdraw tokens succesfully(AllocationType - Private)', async () => {
                let blo = await ethers.provider.getBlockNumber()
                let now = (await ethers.provider.getBlock(blo)).timestamp
                await vesting.setInitialTimestamp(now + 10);

                await expect(vesting.addInvestors([a(investor1), a(investor2)],
                    [toETH("1"), toETH("2")], 1)
                ).to.emit(vesting, 'AddInvestors').withArgs([investor1.address, investor2.address],
                    [toETH("1"), toETH("2")], 1)

                let beforeBalanceInvestor1 = await rewardToken.balanceOf(investor1.address);
                let beforeBalanceInvestor2 = await rewardToken.balanceOf(investor2.address);
                await setCurrentTime(now + 1001); // after cliff period
                await expect(vesting.connect(investor1).withdrawTokens())
                    .to.emit(vesting, 'Harvest').withArgs(investor1.address, '170238095238095238')
                await expect(vesting.connect(investor2).withdrawTokens())
                    .to.emit(vesting, 'Harvest').withArgs(investor2.address, '340476190476190476')
                let afterBalanceInvestor1 = await rewardToken.balanceOf(investor1.address);
                let afterBalanceInvestor2 = await rewardToken.balanceOf(investor2.address);
                expect(afterBalanceInvestor1).to.be.equal(beforeBalanceInvestor1.add("170238095238095238"));
                expect(afterBalanceInvestor2).to.be.equal(beforeBalanceInvestor2.add("340476190476190476"));

                await setCurrentTime(now + 1001 + 17200); // after 100% vesting
                await expect(vesting.connect(investor1).withdrawTokens())
                    .to.emit(vesting, 'Harvest').withArgs(investor1.address, '829761904761904762')
                await expect(vesting.connect(investor2).withdrawTokens())
                    .to.emit(vesting, 'Harvest').withArgs(investor2.address, '1659523809523809524')
                expect(await rewardToken.balanceOf(investor1.address)).to.be.equal("1000000000000000000");
                expect(await rewardToken.balanceOf(investor2.address)).to.be.equal("2000000000000000000");
            })
            it('should withdraw tokens succesfully(AllocationType - Seed & Private)', async () => {
                let blo = await ethers.provider.getBlockNumber()
                let now = (await ethers.provider.getBlock(blo)).timestamp
                await vesting.setInitialTimestamp(now + 30);

                await expect(vesting.addInvestors([a(investor1)],
                    [toETH("1")], 0)
                ).to.emit(vesting, 'AddInvestors').withArgs([investor1.address],
                    [toETH("1")], 0)
                await expect(vesting.addInvestors([a(investor1)],
                    [toETH("1")], 1)
                ).to.emit(vesting, 'AddInvestors').withArgs([investor1.address],
                    [toETH("1")], 1)
                expect(await vesting.userTokens(investor1.address, 0)).to.be.equal("1000000000000000000");
                expect(await vesting.userTokens(investor1.address, 1)).to.be.equal("1000000000000000000");

                await setCurrentTime(now + 31); // start vesting(cliff period)
                await expect(vesting.connect(investor1).withdrawTokens()
                ).to.be.revertedWith("Amount is zero")
                expect(await rewardToken.balanceOf(investor1.address)).to.be.equal("0");

                let beforeBalanceInvestor1 = await rewardToken.balanceOf(investor1.address);
                await setCurrentTime(now + 1031); // after cliff period
                await expect(vesting.connect(investor1).withdrawTokens())
                    .to.emit(vesting, 'Harvest').withArgs(investor1.address, '290238095238095238')
                let afterBalanceInvestor1 = await rewardToken.balanceOf(investor1.address);
                expect(afterBalanceInvestor1).to.be.equal(beforeBalanceInvestor1.add("290238095238095238"));
                expect(await vesting.rewardsPaid(investor1.address, 0)).to.be.equal("120000000000000000");
                expect(await vesting.rewardsPaid(investor1.address, 1)).to.be.equal("170238095238095238");

                beforeBalanceInvestor1 = await rewardToken.balanceOf(investor1.address);
                await setCurrentTime(now + (6 * 60 * 50) / 2 + 631); // after 50% periods
                await expect(vesting.connect(investor1).withdrawTokens())
                    .to.emit(vesting, 'Harvest').withArgs(investor1.address, '965714285714285714')
                afterBalanceInvestor1 = await rewardToken.balanceOf(investor1.address);
                expect(afterBalanceInvestor1).to.be.equal(beforeBalanceInvestor1.add("965714285714285714"));
                expect(await vesting.rewardsPaid(investor1.address, 0)).to.be.equal("600000000000000000");
                expect(await vesting.rewardsPaid(investor1.address, 1)).to.be.equal("655952380952380952");

                await setCurrentTime(now + 1031 + 16200); // after 100% vesting
                await expect(vesting.connect(investor1).withdrawTokens())
                    .to.emit(vesting, 'Harvest').withArgs(investor1.address, '744047619047619048')
                expect(await rewardToken.balanceOf(investor1.address)).to.be.equal("2000000000000000000");
                expect(await rewardToken.balanceOf(vesting.address)).to.be.equal("0");

                await expect(vesting.connect(investor1).withdrawTokens()
                ).to.be.revertedWith("Amount is zero")
            })
        })
    })
})