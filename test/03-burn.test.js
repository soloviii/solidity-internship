const MyToken = artifacts.require("MyToken");
const Assert = require('truffle-assertions');

contract("Burn", accounts => {

    let contractInstance;
    const decimals = 6;
    const ownerAddress = accounts[0];
    const address1 = accounts[1];

    beforeEach(async () => {
        contractInstance = await MyToken.new();
    });

    it('burn should throw if contract is paused', async () => {
        const burnValue = 1000;
        
        await contractInstance.pause({ from: ownerAddress });
        
        await Assert.reverts(
            contractInstance.burn(address1, burnValue, { from: ownerAddress }),
            'Pausable: paused'
        );
    });

    it('burn should throw if from address is invalid', async () => {
        await Assert.reverts(
            contractInstance.burn('0x0000000000000000000000000000000000000000', 1000, { from: ownerAddress }),
            'ERC20: from address is not valid'
        );
    });

    it('burn should throw if balance is insufficient', async () => {
        await Assert.reverts(
            contractInstance.burn(address1, 1000, { from: ownerAddress }),
            'ERC20: insufficient balance'
        );
    });

    it('burn should throw if account is not a owner', async () => {
        const mintValue = 1000;
        const burnValue = 500;

        await contractInstance.mint(address1, mintValue * 10 ** decimals, { from: ownerAddress });
        
        await Assert.reverts(
            contractInstance.burn(address1, burnValue * 10 ** decimals, { from: address1 }),
            'Ownable: caller is not the owner'
        );
    });

    it('burn success', async () => {
        const mintValue = 1000;
        const burnValue = 500;

        await contractInstance.mint(address1, mintValue * 10 ** decimals, { from: ownerAddress });
        await contractInstance.burn(address1, burnValue * 10 ** decimals, { from: ownerAddress });
        let resultBalanceOf = await contractInstance.balanceOf(address1, { from: address1 });
        resultBalanceOf = web3.utils.fromWei(resultBalanceOf,'ether');

        assert.equal( '0.0005',resultBalanceOf, 'wrong balance');
    });
})