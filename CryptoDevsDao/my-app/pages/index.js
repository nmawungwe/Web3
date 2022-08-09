import { Contract, providers } from 'ethers';
import Head from 'next/head';
import Image from 'next/image';
import styles from '../styles/Home.module.css';
import {useEffect, useState, useRef} from 'react';
import Web3Modal from 'web3modal';
import {
  CRYPTODEVS_DAO_CONTRACT_ADDRESS,
  CRYPTODEVS_DAO_ABI,
  CRYPTODEVS_NFT_CONTRACT_ADDRESS,
  CRYPTODEVS_NFT_ABI,
} from '../constants';
import { formatEther } from 'ethers/lib/utils';



export default function Home() {

  //True if user has connected their wallet otherwise false
  const [walletConnected, setWalletConnected] = useState(false);
  const [daoTreasuryBalance, setDaoTreasuryBalance] = useState("0");
  const [nftBalance, setNftBalance] = useState(0);
  const [numberOfProposals, setNumberOfProposals] = useState("0");
  const web3ModalRef = useRef();
  
  


  // Helper function to connect wallet
  const connectWallet = async () => {
    try {
      await getProviderOrSigner();
      setWalletConnected(true);  
    } catch (error) {
        console.error(error);
    }
  }
  // Helper function to fetch a Provider/Signer instance from Metamask 
  const getProviderOrSigner = async (needSigner = false) => {
    const provider = await web3ModalRef.current.connect();
    const web3Provider = new providers.Web3Provider(provider);

    const { chainId } = await web3Provider.getNetwork();
    if (chainId !== 4) {
      window.alert("Please switch to the Rinkeby network!");
      throw new Error("Please switch to the Rinkeby network");
    }

    if(needSigner) {
      const signer = web3Provider.getSigner();
      return signer;
    }
    return web3Provider;
  }

  // Function to get the DAO's treasury balance to display on the homepage
  const getDAOTreasuryBalance = async () => {
    try {
      const provider = await getProviderOrSigner();
      const balance = await provider.getBalance(CRYPTODEVS_DAO_CONTRACT_ADDRESS);
      setDaoTreasuryBalance(balance.toString());
    } catch (error) {
      console.error(error)
    }
  }

  const getUserNftBalance = async () => {
    try {
      const signer = await getProviderOrSigner(true);
      const nftContract = new Contract(
        CRYPTODEVS_NFT_CONTRACT_ADDRESS,
        CRYPTODEVS_NFT_ABI,
        signer
      );
       
       const address = signer.getAddress();
       const nftAmount = await nftContract.balanceOf(address);
       console.log(nftAmount.toString());
       setNftBalance(parseInt(nftAmount.toString())); 
    } catch (error) {
        console.error(error);
    }
  }

  const getNumberOfProposal = async() => {
    try {
      const provider = await getProviderOrSigner();
      const daoContract = new Contract(
        CRYPTODEVS_DAO_CONTRACT_ADDRESS,
        CRYPTODEVS_DAO_ABI,
        provider
      );
      const daoNumProposals = await daoContract.numProposals();
      setNumberOfProposals(daoNumProposals.toString());
    } catch (error) {
      console.error(error);
    }
  }

  useEffect(() => {
    if(!walletConnected) {
      web3ModalRef.current = new Web3Modal({
        network: "rinkeby",
        providerOptions: {},
        disableInjectedProvider: false,
      });

      connectWallet().then(()=> {
        getDAOTreasuryBalance();
        getUserNftBalance();
        getNumberOfProposal();
      })
    };
  },[walletConnected]);

   function renderTabs() {
    return (
      <div>

      </div>
    )
  }

  return (
    <div>
      <Head>
        <title>CryptoDevs DAO</title>
        <meta name="description" content="CryptoDevs DAO" />
        <link rel="icon" href="/favicon.ico"/>
      </Head>
      <div className={styles.main}>
        <div>
          <h1 className={styles.title}>Welcome to Crypto Devs!</h1>
          <div className={styles.description}>Welcome to the DAO!</div>
          <div className={styles.description}>
            Your CryptoDevs NFT Balance: {nftBalance}
            <br />
            Treasury Balance: {formatEther(daoTreasuryBalance)} ETH
            <br />
            Total Number of Proposals: {numberOfProposals}
          </div>
          <div className={styles.flex}>
            <button 
              className={styles.button}
              onClick={() => console.log("Create proposal")}
            >
              Create Proposal
            </button>
            <button
              className={styles.button}
              onClick={() => console.log("View proposals tab")}
            >
              View Proposals
            </button>
          </div>
          {renderTabs()}
        </div>
        <div>
          <img className={styles.image} src="/cryptodevs/0.svg" />
        </div>
      </div>
      <footer className={styles.footer}>
        Made with &#10084; by Crypto Devs
      </footer>
    </div>
  );
}
