module.exports = {
    networks: {
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
};