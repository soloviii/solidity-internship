import { task } from "hardhat/config";
import * as dotenv from 'dotenv'
import "@nomiclabs/hardhat-waffle";
import '@nomiclabs/hardhat-etherscan'

dotenv.config()

task("accounts", "Prints the list of accounts", async (taskArgs, hre) => {
    const accounts = await hre.ethers.getSigners();

    for (const account of accounts) {
        console.log(account.address);
    }
});

const PRIVATE_KEY = process.env.PRIVATE_KEY
const INFURA_PROJECT_ID = process.env.INFURA_PROJECT_ID
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY

export default {
    solidity: {
        version: '0.8.10',
        settings: {
            optimizer: {
                enabled: true,
                runs: 200,
            },
        },
    },
    networks: {
        rinkeby: {
            url: `https://rinkeby.infura.io/v3/${INFURA_PROJECT_ID}`,
            accounts: [`0x${PRIVATE_KEY}`],
            gasPrice: 45000000000,
            gas: 10000000,
        },
    },

    etherscan: {
        apiKey: ETHERSCAN_API_KEY,
    },
}