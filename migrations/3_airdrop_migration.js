const Token = artifacts.require("Token");
const AirDrop = artifacts.require("AirDrop");

module.exports = function (deployer) {
    deployer.deploy(Token).then(function () {
        return deployer.deploy(AirDrop, Token.address);
    });
};