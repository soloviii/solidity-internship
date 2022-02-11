const MyToken = artifacts.require("MyToken");
const Airdrop = artifacts.require("Airdrop");

module.exports = function(deployer) {

    deployer.then(async() => {

        myTokenContract = await deployer.deploy(MyToken, "MyToken", "MK");
        airdropContract = await deployer.deploy(Airdrop, myTokenContract.address);
        console.log("MyToken - ", myTokenContract.address);
        console.log("Airdrop - ", airdropContract.address);

    }).catch((err) => {
        console.error("ERROR", err)
    });
};