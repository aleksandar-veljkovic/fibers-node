require("@nomiclabs/hardhat-waffle");

module.exports = {
    defaultNetwork: "hardhat",
    networks: {
      hardhat: {
      },
    },
    paths: {
      sources: "./contracts",
      tests: "./test/hardhat",
      cache: "./cache",
      artifacts: "./artifacts"
    },
    mocha: {
      timeout: 40000
    },
    solidity: "0.8.13",
  }