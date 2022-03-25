const hre = require('hardhat')
const { ether, constants } = require('@openzeppelin/test-helpers')

async function main() {
    await hre.run('compile')

    const Staking = await hre.ethers.getContractFactory('Staking')
    const MyToken = await hre.ethers.getContractFactory('MyToken')

    const stakingToken = await MyToken.deploy("StakingToken", "ST")
    await stakingToken.deployed()
    console.log('Staking token: ', stakingToken.address)

    const rewardToken = await MyToken.deploy("RewardToken", "RT")
    await rewardToken.deployed()
    console.log('Reward token: ', rewardToken.address)

    const staking = await Staking.deploy(rewardToken.address, stakingToken.address)
    await staking.deployed()
    console.log('Staking: ', staking.address)
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })