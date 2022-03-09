const hre = require("hardhat");
const { ether, constants } = require('@openzeppelin/test-helpers')

function toETH(num: any): any {
  return ether(num.toString()).toString()
}

async function main() {
  await hre.run('compile')

  let name: string = 'NFTToken'
  let symbol: string = 'NFT'
  let totalSupply: number = 3
  let tokenURI: string = 'ipfs://QmSaiJfagQFtC3hTJF3C7ueHTgLRCHPUeV67tmA4uWcDo8/'

  const NFTToken = await hre.ethers.getContractFactory('NFTToken')
  const nftContract = await NFTToken.deploy(
    name,
    symbol,
    tokenURI,
    totalSupply
  )
  console.log("NFTToken:", nftContract.address);

  await nftContract.setPricePerNFT(toETH("0.000001"));
  console.log("price setted successfully!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
