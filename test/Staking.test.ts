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
    let investor3: SignerWithAddress
    let otherAccounts: SignerWithAddress[]

    beforeEach(async () => {
        ;[
            owner,
            investor1,
            investor2,
            investor3,
            ...otherAccounts
        ] = await ethers.getSigners()
        const Staking = await ethers.getContractFactory('Staking')
        const MyToken = await ethers.getContractFactory('MyToken')

        rewardToken = await MyToken.deploy("RewardToken", "RT")
        stakingToken = await MyToken.deploy("StakingToken", "ST")
        staking = await Staking.deploy(rewardToken.address, stakingToken.address)

        await rewardToken.mint(owner.address, toETH("500000"))
        await rewardToken.approve(staking.address, toETH("500000"))
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
                await expect(staking.setRewards(now + 10, now + 20, toETH("500001"), '10')
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
                await rewardToken.mint(owner.address, toETH("500000"))
                await rewardToken.approve(staking.address, toETH("500000"))
                let blo = await ethers.provider.getBlockNumber()
                let now = (await ethers.provider.getBlock(blo)).timestamp
                let beforeStakingBalance = await rewardToken.balanceOf(staking.address)
                await expect(staking.setRewards(now + 10, now + 20, toETH("500000"), '10')
                ).to.emit(staking, 'SetRewards').withArgs(now + 10, now + 20,
                    toETH("500000"), '10')
                let afterStakingBalance = await rewardToken.balanceOf(staking.address)
                expect(afterStakingBalance).to.be.equal(beforeStakingBalance.add(toETH("500000")))
                expect(await staking.startDate()).to.be.equal(now + 10)
                expect(await staking.endDate()).to.be.equal(now + 20)
                expect(await staking.apy()).to.be.equal(10)
            })
        });
        describe('stake', async () => {
            it('should fail if staked amount is zero', async () => {
                let blo = await ethers.provider.getBlockNumber()
                let now = (await ethers.provider.getBlock(blo)).timestamp
                await staking.setRewards(now + 10, now + 20, toETH("500000"), '10')
                await expect(staking.connect(investor1).stake("0")
                ).to.be.revertedWith("ERROR_AMOUNT_IS_ZERO")
            })
            it('should fail if staked amount is over max', async () => {
                let blo = await ethers.provider.getBlockNumber()
                let now = (await ethers.provider.getBlock(blo)).timestamp
                await staking.setRewards(now + 10, now + 20, toETH("500000"), '10')
                await stakingToken.mint(investor1.address, toETH("5000001"))
                await stakingToken.connect(investor1).approve(staking.address, toETH("5000001"))
                await expect(staking.connect(investor1).stake(toETH("5000001"))
                ).to.be.revertedWith("ERROR_MAX_TOTAL_SUPPLY")
            })
            it('should fail if cooldown has not been passed', async () => {
                let blo = await ethers.provider.getBlockNumber()
                let now = (await ethers.provider.getBlock(blo)).timestamp
                await staking.setRewards(now + 10, now + 20, toETH("500000"), '10')
                await stakingToken.mint(investor1.address, toETH("5000000"))
                await stakingToken.connect(investor1).approve(staking.address, toETH("5000000"))
                await staking.connect(investor1).stake(toETH("2000000"))
                await expect(staking.connect(investor1).stake(toETH("3000000"))
                ).to.be.revertedWith("The cooldown has not been passed")
            })
            it('should stake the amount of staking tokens successfully', async () => {
                let blo = await ethers.provider.getBlockNumber()
                let now = (await ethers.provider.getBlock(blo)).timestamp
                await staking.setRewards(now + 10, now + 30, toETH("500000"), '10')
                await stakingToken.mint(investor1.address, toETH("3000"))
                await stakingToken.connect(investor1).approve(staking.address, toETH("3000"))
                let beforeStakingBalance = await stakingToken.balanceOf(staking.address)
                await expect(staking.connect(investor1).stake(toETH("3000"))
                ).to.emit(staking, 'Stake').withArgs(investor1.address, toETH("3000"))
                let afterStakingBalance = await stakingToken.balanceOf(staking.address)
                expect(afterStakingBalance).to.be.equal(beforeStakingBalance.add(toETH("3000")))
                expect(await staking.totalSupply()).to.be.equal(toETH("3000"))
                expect(await staking.staked(investor1.address)).to.be.equal(toETH("3000"))
                expect(await staking.rewards(investor1.address)).to.be.equal(toETH("0"))
            })
        });
        describe('unstake', async () => {
            it('should fail if there is no staked tokens', async () => {
                let blo = await ethers.provider.getBlockNumber()
                let now = (await ethers.provider.getBlock(blo)).timestamp
                await staking.setRewards(now + 10, now + 20, toETH("500000"), '10')
                await expect(staking.connect(investor1).unstake()
                ).to.be.revertedWith("There is no staked tokens")
            })
            it('should transfer all staked tokens and rewards to the user account successfully', async () => {
                let blo = await ethers.provider.getBlockNumber()
                let now = (await ethers.provider.getBlock(blo)).timestamp
                await staking.setRewards(now + 100, now + 3600 * 24 * 100, toETH("500000"), '10')

                await stakingToken.mint(investor1.address, toETH("5000"))
                await stakingToken.connect(investor1).approve(staking.address, toETH("5000"))
                let beforeStakingBalance = await stakingToken.balanceOf(staking.address)
                await expect(staking.connect(investor1).stake(toETH("3000")) // stake tokens before start date
                ).to.emit(staking, 'Stake').withArgs(investor1.address, toETH("3000"))
                let afterStakingBalance = await stakingToken.balanceOf(staking.address)
                expect(afterStakingBalance).to.be.equal(beforeStakingBalance.add(toETH("3000")))
                expect(await staking.staked(investor1.address)).to.be.equal(toETH("3000"))

                await setCurrentTime(now + 100 + 3600);
                await stakingToken.mint(investor2.address, toETH("5000"))
                await stakingToken.connect(investor2).approve(staking.address, toETH("5000"))
                beforeStakingBalance = await stakingToken.balanceOf(staking.address)
                await expect(staking.connect(investor2).stake(toETH("5000")) // stake tokens after 1 hour
                ).to.emit(staking, 'Stake').withArgs(investor2.address, toETH("5000"))
                afterStakingBalance = await stakingToken.balanceOf(staking.address)
                expect(afterStakingBalance).to.be.equal(beforeStakingBalance.add(toETH("5000")))
                expect(await staking.staked(investor2.address)).to.be.equal(toETH("5000"))

                await setCurrentTime(now + 100 + 3600 * 24); //1 day
                await stakingToken.mint(investor3.address, toETH("5000"))
                await stakingToken.connect(investor3).approve(staking.address, toETH("5000"))
                beforeStakingBalance = await stakingToken.balanceOf(staking.address)
                await expect(staking.connect(investor3).stake(toETH("5000")) // stake tokens after 1 day
                ).to.emit(staking, 'Stake').withArgs(investor3.address, toETH("5000"))
                afterStakingBalance = await stakingToken.balanceOf(staking.address)
                expect(afterStakingBalance).to.be.equal(beforeStakingBalance.add(toETH("5000")))
                expect(await staking.staked(investor3.address)).to.be.equal(toETH("5000"))

                await setCurrentTime(now + 100 + 3600 * 24 * 8); //8 days
                await expect(staking.connect(investor1).stake(toETH("2000"))
                ).to.be.revertedWith("The cooldown has not been passed")
                await setCurrentTime(now + 100 + 3600 * 24 * 10);//10 days
                await stakingToken.mint(investor1.address, toETH("2000"))
                await stakingToken.connect(investor1).approve(staking.address, toETH("2000"))
                beforeStakingBalance = await stakingToken.balanceOf(staking.address)
                await expect(staking.connect(investor1).stake(toETH("2000")) // stake tokens after 10 day
                ).to.emit(staking, 'Stake').withArgs(investor1.address, toETH("2000"))
                afterStakingBalance = await stakingToken.balanceOf(staking.address)
                expect(afterStakingBalance).to.be.equal(beforeStakingBalance.add(toETH("2000")))
                expect(await staking.staked(investor1.address)).to.be.equal(toETH("5000"))
                expect(await staking.rewards(investor1.address)).to.be.equal("8219206621004566210") // reward 8 tokens after 10 days

                await setCurrentTime(now + 30 + 24 * 3600 * 30) //30 days
                let beforeStakingTokenStaking = await stakingToken.balanceOf(staking.address)
                let beforeRewardTokenStaking = await rewardToken.balanceOf(staking.address)
                let beforeStakingTokenInvestor2 = await stakingToken.balanceOf(investor2.address)
                let beforeRewardTokenInvestor2 = await rewardToken.balanceOf(investor2.address)
                await expect(staking.connect(investor2).unstake()
                ).to.emit(staking, 'Unstake').withArgs(investor2.address, "24622602739726027396") //unstake before 60 days (fee - 40%)
                let afterStakingTokenStaking = await stakingToken.balanceOf(staking.address)
                let afterRewardTokenStaking = await rewardToken.balanceOf(staking.address)
                let afterStakingTokenInvestor2 = await stakingToken.balanceOf(investor2.address)
                let afterRewardTokenInvestor2 = await rewardToken.balanceOf(investor2.address)
                expect(afterStakingTokenInvestor2).to.be.equal(beforeStakingTokenInvestor2.add(toETH("5000")))
                expect(afterRewardTokenInvestor2).to.be.equal(beforeRewardTokenInvestor2.add("24622602739726027396"))
                expect(afterStakingTokenStaking).to.be.equal(beforeStakingTokenStaking.sub(toETH("5000")))
                expect(afterRewardTokenStaking).to.be.equal(beforeRewardTokenStaking.sub("24622602739726027396"))

                await setCurrentTime(now + 30 + 24 * 3600 * 62); // after 62 days(staking period)
                beforeStakingTokenStaking = await stakingToken.balanceOf(staking.address)
                beforeRewardTokenStaking = await rewardToken.balanceOf(staking.address)
                let beforeStakingTokenInvestor3 = await stakingToken.balanceOf(investor3.address)
                let beforeRewardTokenInvestor3 = await rewardToken.balanceOf(investor3.address)
                await expect(staking.connect(investor3).unstake()
                ).to.emit(staking, 'Unstake').withArgs(investor3.address, "83560502283105022831")
                afterStakingTokenStaking = await stakingToken.balanceOf(staking.address)
                afterRewardTokenStaking = await rewardToken.balanceOf(staking.address)
                let afterStakingTokenInvestor3 = await stakingToken.balanceOf(investor3.address)
                let afterRewardTokenInvestor3 = await rewardToken.balanceOf(investor3.address)
                expect(afterStakingTokenInvestor3).to.be.equal(beforeStakingTokenInvestor3.add(toETH("5000")))
                expect(afterRewardTokenInvestor3).to.be.equal(beforeRewardTokenInvestor3.add("83560502283105022831"))
                expect(afterStakingTokenStaking).to.be.equal(beforeStakingTokenStaking.sub(toETH("5000")))
                expect(afterRewardTokenStaking).to.be.equal(beforeRewardTokenStaking.sub("83560502283105022831"))

                await setCurrentTime(now + 30 + 24 * 3600 * 102); // after 102 days(end date)
                beforeStakingTokenStaking = await stakingToken.balanceOf(staking.address)
                beforeRewardTokenStaking = await rewardToken.balanceOf(staking.address)
                let beforeStakingTokenInvestor1 = await stakingToken.balanceOf(investor1.address)
                let beforeRewardTokenInvestor1 = await rewardToken.balanceOf(investor1.address)
                await expect(staking.connect(investor1).unstake()
                ).to.emit(staking, 'Unstake').withArgs(investor1.address, "131505244799594114662")
                afterStakingTokenStaking = await stakingToken.balanceOf(staking.address)
                afterRewardTokenStaking = await rewardToken.balanceOf(staking.address)
                let afterStakingTokenInvestor1 = await stakingToken.balanceOf(investor1.address)
                let afterRewardTokenInvestor1 = await rewardToken.balanceOf(investor1.address)
                expect(afterStakingTokenInvestor1).to.be.equal(beforeStakingTokenInvestor1.add(toETH("5000")))
                expect(afterRewardTokenInvestor1).to.be.equal(beforeRewardTokenInvestor1.add("131505244799594114662"))
                expect(afterStakingTokenStaking).to.be.equal(beforeStakingTokenStaking.sub(toETH("5000")))
                expect(afterRewardTokenStaking).to.be.equal(beforeRewardTokenStaking.sub("131505244799594114662"))

                await setCurrentTime(now + 30 + 24 * 3600 * 103); // after 103 days(end date)
                await stakingToken.mint(investor1.address, toETH("50"))
                await stakingToken.connect(investor1).approve(staking.address, toETH("50"))
                beforeStakingBalance = await stakingToken.balanceOf(staking.address)
                await expect(staking.connect(investor1).stake(toETH("50")) // stake tokens after end date
                ).to.emit(staking, 'Stake').withArgs(investor1.address, toETH("50"))
                afterStakingBalance = await stakingToken.balanceOf(staking.address)
                expect(afterStakingBalance).to.be.equal(beforeStakingBalance.add(toETH("50")))
                expect(await staking.staked(investor1.address)).to.be.equal(toETH("50"))

                await setCurrentTime(now + 30 + 24 * 3600 * 105); // after 105 days(end date)
                beforeStakingTokenInvestor1 = await stakingToken.balanceOf(investor1.address)
                beforeRewardTokenInvestor1 = await rewardToken.balanceOf(investor1.address)
                await expect(staking.connect(investor1).unstake()
                ).to.emit(staking, 'Unstake').withArgs(investor1.address, "0")
                afterStakingTokenInvestor1 = await stakingToken.balanceOf(investor1.address)
                afterRewardTokenInvestor1 = await rewardToken.balanceOf(investor1.address)
                expect(afterStakingTokenInvestor1).to.be.equal(beforeStakingTokenInvestor1.add(toETH("50")))
                expect(afterRewardTokenInvestor1).to.be.equal(beforeRewardTokenInvestor1.add("0"))
            })
        });
    })
});