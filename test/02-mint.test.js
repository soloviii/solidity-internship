const MyToken = artifacts.require("MyToken");
const Assert = require('truffle-assertions');

contract("Mint", accounts => {

    let contractInstance;
    const decimals = 6;
    const ownerAddress = accounts[0];
    const address1 = accounts[1];

    beforeEach(async () => {
        contractInstance = await MyToken.new();
    });

    it('mint should throw if contract is paused', async () => {
        const mintValue = 1000;
        
        await contractInstance.pause({ from: ownerAddress });
        
        await Assert.reverts(
            contractInstance.mint(address1, mintValue, { from: ownerAddress }),
            'Pausable: paused'
        );
    });

    it('mint should throw if to address is invalid', async () => {
        await Assert.reverts(
            contractInstance.mint('0x0000000000000000000000000000000000000000', 1000, { from: ownerAddress }),
            'ERC20: to address is not valid'
        );
    });

    it('mint should throw if amount is invalid', async () => {
        await Assert.reverts(
            contractInstance.mint(address1, 0, { from: ownerAddress }),
            'ERC20: amount is not valid'
        );
    });

    it('mint should throw if account is not a minter', async () => {
        const mintValue = 1000;

        await Assert.reverts(
            contractInstance.mint(address1, mintValue, { from: address1 }),
            'Ownable: caller is not the owner'
        );
    });

    it('mintTo success', async () => {
        const mintValue = 1000;


        await contractInstance.mint(address1, mintValue * 10 ** decimals, { from: ownerAddress });
        let resultBalanceOf = await contractInstance.balanceOf(address1, { from: address1 });
        resultBalanceOf = web3.utils.fromWei(resultBalanceOf,'ether');

        assert.equal('0.001', resultBalanceOf, 'wrong balance');
    });
})