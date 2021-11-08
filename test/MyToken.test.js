const {
    BN,
    constants,
    expectRevert
} = require('@openzeppelin/test-helpers');
require('chai')
    .use(require('chai-as-promised'))
    .use(require('chai-bn')(BN))
    .should();
const MyToken = artifacts.require("MyToken");

contract("MyToken", ([owner, user1, user2]) => {

    beforeEach(async () => {
        contractInstance = await MyToken.new({ from: owner });
    });

    describe("constructor", async() => {
        it("gives the owner of the token 1M tokens with 6 decimals", async () => {
            let balance = await contractInstance.balanceOf(owner);
            balance = web3.utils.fromWei(balance, 'mwei');
            balance.should.be.bignumber.equal('1000000');
        })
    
        it("gives the user1 nothing", async () => {
            let balance = await contractInstance.balanceOf(user1);
            balance = web3.utils.fromWei(balance, 'mwei');
            balance.should.be.bignumber.equal('0');
        })
    })
    
    describe("mint", async() => {
        it('mint should throw if contract is paused', async () => {
            const mintValue = 1000;
    
            await contractInstance.pause({ from: owner });
    
            await expectRevert(
                contractInstance.mint(user1, mintValue, { from: owner }),
                'ERC20Pausable: token transfer while paused.'
            );
        });
    
        it('mint should throw if to address is invalid', async () => {
            await expectRevert(
                contractInstance.mint(constants.ZERO_ADDRESS, 1000, { from: owner }),
                'ERC20: mint to the zero address',
            );
        });
    
        it('mint should throw if amount is invalid', async () => {
            await expectRevert(
                contractInstance.mint(user1, 0, { from: owner }),
                'ERC20: amount is not valid'
            );
        });
    
        it('mint should throw if account is not a minter', async () => {
            await expectRevert(
                contractInstance.mint(user2, 1000, { from: user1 }),
                'Ownable: caller is not the owner'
            );
        });
    
        it('mint success', async () => {
            const mintValue = web3.utils.toWei(web3.utils.toBN(1000),"mwei");
    
            await contractInstance.mint(user1, mintValue, { from: owner });
            const resultAfterMint = await contractInstance.totalSupply();
    
            let resultBalanceOf = await contractInstance.balanceOf(user1, { from: user1 });
            resultBalanceOf = web3.utils.fromWei(resultBalanceOf,'mwei');
    
            resultBalanceOf.should.be.bignumber.equal('1000');
            resultAfterMint.should.be.bignumber.equal('1001000000000');
        });
    })

    describe("burn", async() =>{
        it('burn should throw if contract is paused', async () => {
            const burnValue = 1000;
    
            await contractInstance.pause({ from: owner });
    
            await expectRevert(
                contractInstance.burn(burnValue, { from: user1 }),
                'ERC20Pausable: token transfer while paused.'
            );
        });
    
        it('burn should throw if balance is insufficient', async () => {
            await expectRevert(
                contractInstance.burn(10, { from: user1 }),
                'ERC20: burn amount exceeds balance'
            );
        });
    
        it('burn success', async () => {
            const mintValue = web3.utils.toWei(web3.utils.toBN(1000), "mwei");
            const burnValue = web3.utils.toWei(web3.utils.toBN(500), "mwei");
    
            await contractInstance.mint(user1, mintValue, { from: owner });
            await contractInstance.burn(burnValue, { from: user1 });
    
            const resultAfterMint = await contractInstance.totalSupply();
            let resultBalanceOf = await contractInstance.balanceOf(user1, { from: user1 });
            resultBalanceOf = web3.utils.fromWei(resultBalanceOf, 'mwei');
    
            resultBalanceOf.should.be.bignumber.equal('500');
            resultAfterMint.should.be.bignumber.equal('1000500000000');
        });
    })
})