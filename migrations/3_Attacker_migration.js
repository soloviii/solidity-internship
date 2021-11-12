const MyToken = artifacts.require("MyToken");
const Attacker = artifacts.require("Attacker");

module.exports = function (deployer) {
    deployer.deploy(MyToken).then(function (){
        return deployer.deploy(Attacker,MyToken.address);
    });
};