const MyToken = artifacts.require("MyToken");

contract("Constructor", accounts => {

    before(async () => {
        contractInstance = await MyToken.new();
    });

    it("gives the owner of the token 1M tokens with 6 decimals", async () => {
        let balance = await contractInstance.balanceOf(accounts[0]);
        balance = web3.utils.fromWei(balance, 'ether');
        assert.equal(balance, '0.000001', "Balance should be 1M tokens with 6 decimals for contract creator")
    })

    it("gives the user nothing", async () => {
        let balance = await contractInstance.balanceOf(accounts[1]);
        balance = web3.utils.fromWei(balance, 'ether');
        assert.equal(balance, '0', "Balance should be zero")
    })

    it('set name', async () => {
        contractInstance = await MyToken.new();
        const result = await contractInstance.name();
        
        assert.equal("MyToken", result, 'name is wrong');
    });
})