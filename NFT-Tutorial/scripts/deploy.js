// ether.js comes built in to Hardhat 
// ether.js is a really nice library to work with ethereum 
const { ethers } = require("hardhat");

async function main() {

  //1. somehow tell the script we want to deploy the 'NFT.sol' contract 
  const contract = await ethers.getContractFactory("NFT");

  // 2. Deploy it 
  const deployedContract = await contract.deploy();

  //3. Await for contract to be deployed 
  await deployedContract.deployed();

  //4. Print the address of the deployed contract 
  console.log("NFT Contract deployed to: ", deployedContract.address)

}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.log(error);
    process.exit(1);
  })