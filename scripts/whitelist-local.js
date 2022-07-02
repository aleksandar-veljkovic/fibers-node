const fibersAbi = require("../artifacts/contracts/fibers.sol/Fibers.json");

async function main () {  
    console.log("Whitelisting Harmony devnet demo users...")
    const provider = new ethers.providers.JsonRpcProvider(`http://127.0.0.1:8545`);
    const Fibers = await ethers.getContractFactory("Fibers");
    const wallet = new ethers.Wallet("b510a4a2d08c4a28eab3efecc16d0120bd3cb9894fa453422d1e2da0e588bff1", provider);
    const fibersContract = new ethers.Contract("0x2f92D8F6B691d7c1BBf6865350A24fEf15F18FdE", fibersAbi.abi, wallet);

    console.log('Whitelisting User 1');
    await fibersContract.addUser(
        '0x7e7Fea4a53e4A093f22349E819aFFFEd9dE993Ea', 
        '0x1b58a94ce84bf83016e777c77e74c0ca508d832cb82d2f4ccb7946a503ce72cb',
        '0x7f386528170deda53d8e5b18efdfb2f5ece6c7a6272acf4183b2c543510de89c'
    )

    console.log('Whitelisting User 2');
    await fibersContract.addUser(
        '0xb69FD287194F543DA2BCe5b12E89547789e20f21', 
        '0x3a8e82a3b412ece07c7c4cd8d77281e099e7036af7ed97bcaa96dc1fb1ce991a',
        '0xcbdefe62dae9d7109e25d52b4920ec9cf9b3519b163301a9d51d8d6f21903774'
    )

    console.log('Users whitelisted!');
  }
  
  main()
    .then(() => process.exit(0))
    .catch(error => {
      console.error(error);
      process.exit(1);
    });
