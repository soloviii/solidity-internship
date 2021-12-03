const { ethers } = require('hardhat')
const { expect } = require('chai')
const { ether } = require('@openzeppelin/test-helpers');

const DOMAON_TYPE = [{
        type: "string",
        name: "name"
    },
    {
        type: "string",
        name: "version"
    },
    {
        type: "uint256",
        name: "chainId"
    },
    {
        type: "address",
        name: "verifyingContract"
    }
];

let owner, user1, user2
let forwarderFactory, forwarderInstance

describe('Forwarder', async() => {
    beforeEach(async() => {
        [owner, user1, user2] = await ethers.getSigners()
        forwarderFactory = await ethers.getContractFactory("Forwarder")
        forwarderInstance = await forwarderFactory.deploy()
        await forwarderInstance.setKycSigner(user1.address.toString())
    })

    describe('functions', async() => {
        describe('forward', async() => {
            it("Should deposit and forward ether to the destination address", async() => {
                const { chainId } = await ethers.provider.getNetwork()
                const TYPES = {
                    Container: [{
                            name: 'from',
                            type: 'address',
                        },
                        {
                            name: 'to',
                            type: 'address',
                        },
                        {
                            name: 'amount',
                            type: 'uint256',
                        },
                        {
                            name: 'nonce',
                            type: 'uint256',
                        },
                        {
                            name: 'data',
                            type: 'string',
                        },
                    ],
                }

                let sign = await ethers.provider.send('eth_signTypedData_v4', [
                    (await user1.address.toString()).toLowerCase(),
                    JSON.stringify({
                        types: Object.assign({
                                EIP712Domain: DOMAON_TYPE,
                            },
                            TYPES,
                        ),
                        domain: {
                            name: 'Forward',
                            version: 'v1',
                            chainId: chainId,
                            verifyingContract: forwarderInstance.address,
                        },
                        primaryType: 'Container',
                        message: {
                            from: (await user1.address.toString()).toLowerCase(),
                            to: (await user2.address.toString()).toLowerCase(),
                            amount: ether('1').toString(),
                            nonce: Number(await forwarderInstance.connect(user1).getNonce()),
                            data: "data",
                        },
                    }),
                ])

                const sig = sign
                const sig0 = sig.substring(2)
                const r = '0x' + sig0.substring(0, 64)
                const s = '0x' + sig0.substring(64, 128)
                const v = parseInt(sig0.substring(128, 130), 16)

                let nonce = Number(await forwarderInstance.connect(user1).getNonce())
                const provider = waffle.provider
                const beforeBalanceUser2 = await provider.getBalance(user2.address)

                await expect(
                    await forwarderInstance
                    .connect(user1)
                    .forward(user2.address, nonce, "data", v, r, s, { value: ether('1').toString() }),
                )
                const afterBalanceUser2 = await provider.getBalance(user2.address);
                expect(afterBalanceUser2).to.equal(beforeBalanceUser2.add(ether('1').toString()));
            })
        })
    })
})