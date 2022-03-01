import { expect } from 'chai'
import chai from 'chai'
import { ethers } from 'hardhat'
import { solidity } from 'ethereum-waffle'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { Contract } from 'ethers'
const { ether, constants } = require('@openzeppelin/test-helpers')

chai.use(solidity)

describe('Staking', async () => {

    async function setCurrentTime(time: any): Promise<any> {
        return await ethers.provider.send('evm_mine', [time])
    }

    function toETH(num: any): any {
        return ether(num.toString()).toString()
    }

    const a = (account: SignerWithAddress) => {
        return account.getAddress().then((res: string) => {
            return res.toString()
        })
    }

    let staking: Contract
    let stakingToken: Contract
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
        const Staking = await ethers.getContractFactory('Staking')
        const MyToken = await ethers.getContractFactory('MyToken')

        rewardToken = await MyToken.deploy("RewardToken", "RT")
        stakingToken = await MyToken.deploy("StakingToken", "ST")
        staking = await Staking.deploy(rewardToken.address, stakingToken.address)

        await rewardToken.mint(owner.address, "500000")
        await rewardToken.approve(staking.address, "500000")
    })
    describe('Functions', async () => {
        describe('constructor', async () => {
            it('should fail if reward token address is zero', async () => {
                const Staking = await ethers.getContractFactory('Staking')
                await expect(Staking.deploy(constants.ZERO_ADDRESS, constants.ZERO_ADDRESS)
                ).to.be.revertedWith("ERROR_INVALID_ADDRESS")
            })
            it('should deploy Staking SC successfully', async () => {
                const Staking = await ethers.getContractFactory('Staking')
                staking = await Staking.deploy(rewardToken.address, stakingToken.address)
                let stakingInfo = await staking.stakingInfo();
                expect(stakingInfo.feePercentage).to.be.equal(40);
                expect(stakingInfo.cooldown).to.be.equal(864000);
                expect(stakingInfo.stakingPeriod).to.be.equal(5184000);
            })
        })
        describe('setRewards', async () => {
            it('should fail if sender is not owner', async () => {
                let blo = await ethers.provider.getBlockNumber()
                let now = (await ethers.provider.getBlock(blo)).timestamp
                await expect(staking.connect(investor1).setRewards(now + 10, now + 20, "1", '10')
                ).to.be.revertedWith("Ownable: caller is not the owner")
            })
            it('should fail if incorrect dates', async () => {
                let blo = await ethers.provider.getBlockNumber()
                let now = (await ethers.provider.getBlock(blo)).timestamp
                await expect(staking.setRewards(now - 10, now + 20, "1", '10')
                ).to.be.revertedWith("Incorrect dates")
                await expect(staking.setRewards(now + 10, now, "1", '10')
                ).to.be.revertedWith("Incorrect dates")
            })
            it('should fail if incorrect reward amount of tokens', async () => {
                let blo = await ethers.provider.getBlockNumber()
                let now = (await ethers.provider.getBlock(blo)).timestamp
                await expect(staking.setRewards(now + 10, now + 20, "500001", '10')
                ).to.be.revertedWith("Incorrect amount of tokens")
                await expect(staking.setRewards(now + 10, now + 20, "0", '10')
                ).to.be.revertedWith("Incorrect amount of tokens")
            })
            it('should fail if incorrect apy', async () => {
                let blo = await ethers.provider.getBlockNumber()
                let now = (await ethers.provider.getBlock(blo)).timestamp
                await expect(staking.setRewards(now + 10, now + 20, "500000", '0')
                ).to.be.revertedWith("Incorrect apy")
                await expect(staking.setRewards(now + 10, now + 20, "500000", '11')
                ).to.be.revertedWith("Incorrect apy")
            })
            it('should set reward info in Staking SC successfully', async () => {
                await rewardToken.mint(owner.address, "500000")
                await rewardToken.approve(staking.address, "500000")
                let blo = await ethers.provider.getBlockNumber()
                let now = (await ethers.provider.getBlock(blo)).timestamp
                let beforeStakingBalance = await rewardToken.balanceOf(staking.address)
                await expect(staking.setRewards(now + 10, now + 20, "500000", '10')
                ).to.emit(staking, 'SetRewards').withArgs(now + 10, now + 20,
                    "500000", '10')
                let afterStakingBalance = await rewardToken.balanceOf(staking.address)
                expect(afterStakingBalance).to.be.equal(beforeStakingBalance.add("500000"))
                expect(await staking.startDate()).to.be.equal(now + 10)
                expect(await staking.endDate()).to.be.equal(now + 20)
                expect(await staking.apy()).to.be.equal(10)
            })
        });
        describe('stake', async () => {
            it('should fail if staking time is gone', async () => {
                let blo = await ethers.provider.getBlockNumber()
                let now = (await ethers.provider.getBlock(blo)).timestamp
                await staking.setRewards(now + 10, now + 20, "1", '10')
                await setCurrentTime(now + 30) //after finish stake
                await expect(staking.connect(investor1).stake("5")
                ).to.be.revertedWith("The staking time is gone")
            })
            it('should fail if staked amount is zero', async () => {
                let blo = await ethers.provider.getBlockNumber()
                let now = (await ethers.provider.getBlock(blo)).timestamp
                await staking.setRewards(now + 10, now + 20, "1", '10')
                await expect(staking.connect(investor1).stake("0")
                ).to.be.revertedWith("ERROR_AMOUNT_IS_ZERO")
            })
            it('should fail if staked amount is over max', async () => {
                let blo = await ethers.provider.getBlockNumber()
                let now = (await ethers.provider.getBlock(blo)).timestamp
                await staking.setRewards(now + 10, now + 20, "1", '10')
                await stakingToken.mint(investor1.address, "5000001")
                await stakingToken.connect(investor1).approve(staking.address, "5000001")
                await expect(staking.connect(investor1).stake("5000001")
                ).to.be.revertedWith("ERROR_MAX_TOTAL_SUPPLY")
            })
            it('should stake the amount of staking tokens successfully', async () => {
                let blo = await ethers.provider.getBlockNumber()
                let now = (await ethers.provider.getBlock(blo)).timestamp
                await staking.setRewards(now + 10, now + 30, "500000", '10')
                await setCurrentTime(now + 11)
                await stakingToken.mint(investor1.address, "3000")
                await stakingToken.connect(investor1).approve(staking.address, "3000")
                let beforeStakingBalance = await stakingToken.balanceOf(staking.address)
                await expect(staking.connect(investor1).stake("3000")
                ).to.emit(staking, 'Stake').withArgs(investor1.address, "3000")
                let afterStakingBalance = await stakingToken.balanceOf(staking.address)
                expect(afterStakingBalance).to.be.equal(beforeStakingBalance.add("3000"))
                expect(await staking.totalSupply()).to.be.equal("3000")
                expect(await staking.staked(investor1.address)).to.be.equal("3000")
                expect(await staking.userRewardPerYear(investor1.address)).to.be.equal("300")
            })
        });
        describe('unstake', async () => {
            it('should fail if cooldown is not finish', async () => {
                let blo = await ethers.provider.getBlockNumber()
                let now = (await ethers.provider.getBlock(blo)).timestamp
                await staking.setRewards(now + 10, now + 20, "1", '10')
                await expect(staking.connect(investor1).unstake()
                ).to.be.revertedWith("The cooldown is not finish")
            })
            it('should fail if there is no staked tokens', async () => {
                let blo = await ethers.provider.getBlockNumber()
                let now = (await ethers.provider.getBlock(blo)).timestamp
                await staking.setRewards(now + 10, now + 20, "1", '10')
                await setCurrentTime(now + 21 + 24 * 3600 * 10);
                await expect(staking.connect(investor1).unstake()
                ).to.be.revertedWith("There is no staked tokens")
            })
        });
    })
});