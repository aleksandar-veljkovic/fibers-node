
async function main () {  
  console.log("Deploying Fibers...")
  const Fibers = await ethers.getContractFactory("Fibers");
  const fibers = await Fibers.deploy();
  await fibers.deployed();
  console.log('Fibers deployed to:', fibers.address);
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });