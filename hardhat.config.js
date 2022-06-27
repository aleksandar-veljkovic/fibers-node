require("@nomiclabs/hardhat-waffle");

module.exports = {
    defaultNetwork: "hardhat",
    networks: {
      hardhat: {
      },
      localhost: {
        
      },
      harmony_devnet: {
        url: "https://api.s0.ps.hmny.io/",
        accounts: [`0xb510a4a2d08c4a28eab3efecc16d0120bd3cb9894fa453422d1e2da0e588bff1`]
      }
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