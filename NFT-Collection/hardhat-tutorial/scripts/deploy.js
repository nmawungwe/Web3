const {ethers} = require("hardhat");
require("dotenv").config({ path: ".env"});
const { WHITELIST_CONTRACT_ADDRESS, METADATA_URL } = require("../constants");


async function main() {
  // Address of the whitelist contract that was deployed in previous module 
  const whitelistContract = WHITELIST_CONTRACT_ADDRESS;
  
  // URL from where we can extract the metadata for a Crypto Dev NFT ;
  const metadataURL = METADATA_URL;

  const cryptoDevsContract = await ethers.getContractFactory("CryptoDevs");
  
  const deployedCryptoDevsContract = await cryptoDevsContract.deploy(
    metadataURL,
    whitelistContract
  );

  await deployedCryptoDevsContract.deployed();

  console.log("CryptoDevs Contract Address", deployedCryptoDevsContract.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })