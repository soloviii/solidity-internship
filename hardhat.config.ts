import { extendEnvironment, task } from 'hardhat/config'
import * as dotenv from 'dotenv'
import '@nomiclabs/hardhat-waffle'
import '@nomiclabs/hardhat-etherscan'
import '@openzeppelin/hardhat-upgrades'

dotenv.config()

// This is a sample Hardhat task. To learn how to create your own go to
// https://hardhat.org/guides/create-task.html
task("accounts", "Prints the list of accounts", async (taskArgs, hre) => {
    const accounts = await hre.ethers.getSigners();

    for (const account of accounts) {
        console.log(account.address);
    }
});

const PRIVATE_KEY = process.env.PRIVATE_KEY
const INFURA_PROJECT_ID = process.env.INFURA_PROJECT_ID
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY
const SHOWTRACE_API_KEY = process.env.SHOWTRACE_API_KEY

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
            gasPrice: 50000000000,
            gas: 10000000,
        },
        ropsten: {
            url: `https://ropsten.infura.io/v3/${INFURA_PROJECT_ID}`,
            accounts: [`0x${PRIVATE_KEY}`],
            gasPrice: 50000000000,
            gas: 10000000,
        },
        fuji: {
            url: `https://api.avax-test.network/ext/bc/C/rpc`,
            accounts: [`0x${PRIVATE_KEY}`],
            network_id: '43113',
            gas: 8000000,
            gasPrice: 27500000000
        },
    },

    etherscan: {
        apiKey: SHOWTRACE_API_KEY,
    }
}