const HDWalletProvider = require("@truffle/hdwallet-provider");

var privateKey = [
  "e0f092d90454dc9ea381206dab59443df1dbc956e220fbe51b8b8ccb33191315"
];

module.exports = {
  networks: {
    rinkeby: {
      provider: function () {
        return new HDWalletProvider(privateKey, "https://rinkeby.infura.io/v3/494da074c85240bdaa113ece9f0216e3");
      },
      network_id: 4,
      gas: 4500000,
      gasPrice: 10000000000
    },
    development: {
      host: "127.0.0.1",
      port: 8545,
      network_id: "*"
    },
    coverage: {
      host: "localhost",
      network_id: "*",
      port: 8545
    },
  },

  compilers: {
    solc: {
      version: "0.8.9",
      settings: {
        optimizer: {
          enabled: true,
          runs: 200
        }
      }
    }
  },
  plugins: ["solidity-coverage", "truffle-plugin-verify"],
  api_keys: {
    etherscan: '336AKZYTHTNDM6NBP1YQ4C4BDI2C69S2R8'
  },
};
