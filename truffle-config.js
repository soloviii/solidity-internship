const HDWalletProvider = require('@truffle/hdwallet-provider');
const dotenv = require("dotenv");
dotenv.config();

module.exports = {
    networks: {
        development: {
            host: "localhost",
            port: 8545,
            network_id: "*",
            gas: 4612388,
        },
        rinkeby: {
            provider: function() {
                return new HDWalletProvider([process.env.PRIVATE_KEY], `https://rinkeby.infura.io/v3/${process.env.PROJECT_ID}`);
            },
            network_id: '4',
            gasPrice: 13000000000,
            gas: 22000000
        },
        ropsten: {
            provider: function() {
                return new HDWalletProvider([process.env.PRIVATE_KEY], `https://ropsten.infura.io/v3/${process.env.PROJECT_ID}`);
            },
            network_id: '3',
            gas: 8000000,
            gasPrice: 30000000000,
        },
    },

    mocha: {
        timeout: 100000
    },

    compilers: {
        solc: {
            version: "0.8.10",
            optimizer: {
                enabled: true,
                runs: 200
            }
        }
    },

    plugins: ["solidity-coverage", 'truffle-plugin-verify'],

    api_keys: {
        etherscan: `${process.env.ETHERSCAN_KEY} `
    }
};