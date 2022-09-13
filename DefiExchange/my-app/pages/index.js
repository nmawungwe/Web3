import { BigNumber, providers, utils } from 'ethers';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import Web3Modal from 'web3modal';
import { addLiquidity, calculateCD } from '../utils/addLiquidity';
import { 
  getCDTokensBalance,
  getEtherBalance,
  getLPTokensBalance,
  getReserveOfCDTokens
 } from '../utils/getAmounts';
import {
  getTokensAfterRemove,
  removeLiquidity
 } from '../utils/removeLiquidity';
import { swapTokens, getAmountOfTokensReceivedFromSwap } from '../utils/swap';
import Head from 'next/head';
import Image from 'next/image'
import styles from '../styles/Home.module.css'

export default function Home() {

   /** Wallet connection */
  // Create a reference to the Web3 Modal (used for connecting to Metamask) which persists as long as the page is open
  const web3ModalRef = useRef();
  // walletConnected keep track of whether the user's wallet is connected or not
  const [walletConnected, setWalletConnected] = useState(false);
  // loading is set to true when the transaction is mining and set to false when
  // the transaction has mined
  const [loading, setLoading] = useState(false)
  // We have two tabs in this dapp, Liquidity Tab and Swap Tab. This variable
  // keeps track of which Tab the user is on. If it is set to true this means
  // that the user is on `liquidity` tab else he is on `swap` tab
  const [liquidityTab, setLiquidityTab] = useState(true);
  // This variable is the `0` number in form of a BigNumber
  const zero = BigNumber.from(0)
   // cdBalance is the amount of `CD` tokens help by the users account
  const [cdBalance, setCdBalance] = useState(zero);
  // `ethBalance` keeps track of the amount of Eth held by the user's account
  const [ethBalance, setEthBalance] = useState(zero);
  // `lpBalance` keeps track of the amount of Eth held by the user's account
  const [lpBalance, setLpBalance] = useState(zero);
  // `reservedCD` keeps track of the Crypto Dev tokens Reserve balance in the Exchange contract
  const [reservedCD, setReservedCD] = useState(zero);
  // `ether Balance` keeps track of the Ether Reserve balance in the Exchange contract
  const [ethBalanceContract, setEthBalanceContract] = useState(zero);
  /** Variables to keep track of liquidity to be added or removed */
  // addEther is the amount of Ether that the user wants to add to the liquidity
  const [addEther, setAddEther] = useState(zero);
  // addCDTokens keeps track of the amount of CD tokens that the user wants to add to the liquidity
  // in case when there is no initial liquidity and after liquidity gets added it keeps track of the
  // CD tokens that the user can add given a certain amount of ether
  const [addCDTokens, setAddCDTokens] = useState(zero);
  // amount of LP tokens that the user wants to remove from liquidity
  const [removeLPTokens, setRemoveLPTokens] = useState("0");
  // removeCD is the amount of `Crypto Dev` tokens that would be sent back to the user based on a certain number of `LP` tokens
  // that he wants to withdraw
  const [removeCD, setRemoveCD] = useState(zero);
  // removeEther is the amount of `Ether` that would be sent back to the user based on a certain number of `LP` tokens
  const [removeEther, setRemoveEther] = useState(zero);
  /** Variables to keep track of swap functionality */
  // Amount that the user wants to swap
  const [swapAmount, setSwapAmount] = useState("");
  // This keeps track of the number of tokens that the user would receive after a swap completes
  const [tokenToBeReceivedAfterSwap, setTokenToBeReceivedAfterSwap] = useState(zero);
  // Keeps track of whether  `Eth` or `Crypto Dev` token is selected. If `Eth` is selected it means that the user
  // wants to swap some `Eth` for some `Crypto Dev` tokens and vice versa if `Eth` is not selected
  const [ethSelected, setEthSelected] = useState(true);


  const getAmounts = async() => {
    try {
        const provider = await getProviderOrSigner(false);
        const signer = await getProviderOrSigner(true);
        const address = await signer.getAddress();
        // get the amount of eth in the user's account
        const _ethBalance = await getEtherBalance(provider, address);
        // get the amount of `Crypto Dev` tokens held by the user
        const _cdBalance = await getCDTokensBalance(provider, address);
         // get the amount of `LP` tokens held by the user
         const _lpBalance = await getLPTokensBalance(provider, address);
         // gets the amount of `CD` tokens that are present in the reserve of the `Exchange contract`
         const _reservedCD = await getReserveOfCDTokens(provider);
        // gets the amount of ether that is present in the reserve of the `Exchange contract
        const _ethBalanceContract = await getEtherBalance(provider, null, true);

        setEthBalance(_ethBalance);
        setCdBalance(_cdBalance);
        setLpBalance(_lpBalance);
        setReservedCD(_reservedCD);
        setEthBalanceContract(_ethBalanceContract)

    } catch (error) {
        console.error(error);
    }
  }

      /**
   * Returns a Provider or Signer object representing the Ethereum RPC with or
   * without the signing capabilities of Metamask attached
   *
   * A `Provider` is needed to interact with the blockchain - reading
   * transactions, reading balances, reading state, etc.
   *
   * A `Signer` is a special type of Provider used in case a `write` transaction
   * needs to be made to the blockchain, which involves the connected account
   * needing to make a digital signature to authorize the transaction being
   * sent. Metamask exposes a Signer API to allow your website to request
   * signatures from the user using Signer functions.
   *
   * @param {*} needSigner - True if you need the signer, default false
   * otherwise
   */

  const getProviderOrSigner = async(needSigner=false) => {

    // Connect to Metamask
    // Since we store `web3Modal` as a reference, we need to access the `current` value to get access to the underlying object
    const provider = await web3ModalRef.current.connect();
    const web3Provider = new providers.Web3Provider(provider);

    // If user is not connected to the Rinkeby network, let them know and throw an error
    const { chainId } = await web3Provider.getNetwork();
    if (chainId !== 4) {
        window.alert("Change the network to Rinkeby");
        throw new Error("Change network to Rinkeby")
    }

    if (needSigner) {
      const signer = web3Provider.getSigner();
      return signer; 
    }
    return web3Provider;
  }

    /**
   * _addLiquidity helps add liquidity to the exchange,
   * If the user is adding initial liquidity, user decides the ether and CD tokens he wants to add
   * to the exchange. If he is adding the liquidity after the initial liquidity has already been added
   * then we calculate the crypto dev tokens he can add, given the Eth he wants to add by keeping the ratios
   * constant
   */
  const _addLiquidity = async () => {
    try {
        // Convert the ether amount entered by the user to Bignumber
        const addEtherWei = utils.parseEther(addEther.toString());
        // Check if the values are zero
        if(!addCDTokens.eq(zero) && !addEtherWei.eq(zero)) {
          const signer = await getProviderOrSigner(true);
          setLoading(true);
          // call the addLiquidity function from the utils folder
          await addLiquidity(signer, addCDTokens, addEtherWei);
          setLoading(false);
          // Reinitialize the CD tokens
          setAddCDTokens(zero);
          // Get amounts of all values after liquidity has been added
          await getAmounts();
        } else {
          setAddCDTokens(zero);
        }
    } catch (error) {
        console.error(error)
        setLoading(false);
        setAddCDTokens(zero);
    }
  }

  const _removeLiquidity = async () => {
    try {
        const signer = await getProviderOrSigner(true);
        // Convert the LP tokens entered by the user to a BigNumber
        const removeLPTokensWei = utils.parseEther(removeLPTokens);
        setLoading(true);
        // Call the removeLiquidity function from the `utils` folder
        await removeLiquidity(signer, removeLPTokensWei);
        setLoading(false);
        await getAmounts()
        setRemoveCD(zero);
        setRemoveEther(zero);
    } catch (error) {
        console.error(error);
        setLoading(false);
        setRemoveCD(zero);
        setRemoveEther(zero);
    }
  }

 /**
   * _getTokensAfterRemove: Calculates the amount of `Ether` and `CD` tokens
   * that would be returned back to user after he removes `removeLPTokenWei` amount
   * of LP tokens from the contract
   */
  const _getTokensAfterRemove = async(_removeLPTokens) => {
    try {
      const provider = await getProviderOrSigner();
      // Convert the LP tokens entered by the user to a BigNumber
      const removeLPTokenWei = utils.parseEther(_removeLPTokens);
      // Get the Eth reserves within the exchange contract
      const _ethBalance = await getEtherBalance(provider, null, true);
      // get the crypto dev token reserves from the contract
      const cryptoDevTokenReserve = await getReserveOfCDTokens(provider);
      const {_removeEther, _removeCD} = await getTokensAfterRemove(
        provider,
        removeLPTokenWei,
        _ethBalance,
        cryptoDevTokenReserve
      );
        setRemoveEther(_removeEther);
        setRemoveCD(_removeCD);
    } catch (error) {
      console.error(error);
    }
  }



   /**
   * _getAmountOfTokensReceivedFromSwap:  Returns the number of Eth/Crypto Dev tokens that can be received 
   * when the user swaps `_swapAmountWEI` amount of Eth/Crypto Dev tokens.
   */
  const _getAmountOfTokensReceivedFromSwap = async(_swapAmount) => {
    try {
      // Convert the amount entered by the user to a BigNumber using the `parseEther` library from `ethers.js`
      const _swapAmountWEI = utils.parseEther(_swapAmount.toString());
      // Check if the user entered zero
      // We are here using the `eq` method from BigNumber class in `ethers.js`
      if(!_swapAmountWEI.eq(zero)) {
        const provider = await getProviderOrSigner();
        // Get the amount of ether in the contract
        const _ethBalance = await getEtherBalance(provider, null, true);
         // Call the `getAmountOfTokensReceivedFromSwap` from the utils folder
         const amountOfTokens = await getAmountOfTokensReceivedFromSwap(
          _swapAmount,
          provider,
          ethSelected,
          _ethBalance,
          reservedCD
         )
         setTokenToBeReceivedAfterSwap(amountOfTokens);
      } else {
         setTokenToBeReceivedAfterSwap(zero);
      }  
    } catch (error) {
        console.error(error); 
    }
  };

  const _swapTokens = async() => {
    try {
        // Convert the amount entered by the user to a BigNumber using the `parseEther` library from `ethers.js`
        const swapAmountWei = utils.parseEther(swapAmount);
        // Check if the user entered zero
        // We are here using the `eq` method from BigNumber class in `ethers.js`
        if (!swapAmountWei.eq(zero)) {
          const signer = await getProviderOrSigner(true);
          setLoading(true);
          // Call the swapTokens function from the `utils` folder
          await swapTokens(
            signer,
            swapAmountWei,
            tokenToBeReceivedAfterSwap,
            ethSelected
          );
          setLoading(false);
          // Get all the updated amounts after the swap
          await getAmounts();
          setSwapAmount("");
        }
      
    } catch (error) {
        console.error(error)
        setLoading(false);
        setSwapAmount("");
    }
  };



  const connectWallet = async() => {
    try {
      // Get the provider from web3Modal, which in our case is MetaMask
      // When used for the first time, it prompts the user to connect their wallet
      await getProviderOrSigner();
      setWalletConnected(true);
    } catch (error) {
        console.error(error);
    }
  }
  // useEffects are used to react to changes in state of the website
  // The array at the end of function call represents what state changes will trigger this effect
  // In this case, whenever the value of `walletConnected` changes - this effect will be called
  useEffect(()=> {
    // if wallet is not connected, create a new instance of Web3Modal and connect the MetaMask wallet
    if (!walletConnected) {
      // Assign the Web3Modal class to the reference object by setting it's `current` value
      // The `current` value is persisted throughout as long as this page is open
      web3ModalRef.current = new Web3Modal({
        network: "rinkeby",
        providerOptions: {},
        disableInjectedProvider: false,
      });
      connectWallet();
      getAmounts();
    }

  },[walletConnected])

  const renderButton = ()=> {
      // If wallet is not connected, return a button which allows them to connect their wallet
      if (!walletConnected) {
        return (
          <button className={styles.button} onClick={connectWallet}>
            Connect Yout Wallet
          </button>
        )
      }

      // If we are currently waiting for something, return a loading button
      if (loading) {
        return (
          <button className={styles.button}>Loading...</button>
        )
      }

      if (liquidityTab) {
        return (
          <div>
            <div className={styles.description}>
              You have:
              <br />
              {utils.formatEther(cdBalance)} Crypto Dev Tokens
              <br />
              {utils.formatEther(ethBalance)} Ether
              <br />
              {utils.formatEther(lpBalance)} Crypto Dev LP tokens
            </div>
            <div>
              {/* If reserved CD is zero, render the state for liquidity zero where we ask the user
            how much initial liquidity he wants to add else just render the state where liquidity is not zero and
            we calculate based on the `Eth` amount specified by the user how much `CD` tokens can be added */}
            {utils.parseEther(reservedCD.toString()).eq(zero) ? (
              <div>
                <input
                  type="number"
                  placeholder="Amount of Ether"
                  onChange={(e) => setAddEther(e.target.value || "0")}
                  className={styles.input}
                />
                <input
                  type="number"
                  placeholder="Amount of CryptoDev tokens"
                  onChange={(e) => setAddCDTokens(
                    BigNumber.from(utils.parseEther(e.target.value || "0"))
                  )}
                  className={styles.input}
                />
                <button
                  className={styles.buttton1}
                  onClick={()=> {_addLiquidity}}
                >
                  Add
                </button>
              </div>
            ) : (
              <div>
                <input
                  type="number"
                  placeholder="Amount of Ether"
                  onChange={async (e) => {
                    setAddEther(e.target.value || "0");
                    // calculate the number of CD tokens that
                    // can be added given  `e.target.value` amount of Eth
                    const _addCDTokens = await calculateCD(
                      e.target.value || "0",
                      ethBalanceContract,
                      reservedCD
                    );
                    setAddCDTokens(_addCDTokens);
                  }}
                  className={styles.input}
                />
                <div className={styles.inputDiv}>
                  {/* Convert the BigNumber to string using the formatEther function from ethers.js */}
                  {`You will need ${utils.formatEther(addCDTokens)} Crypto Dev Tokens`}
                </div>
                <button className={styles.button1} onClick={_addLiquidity}>
                  Add
                </button>
              </div>
            )}
            <div>
              <input
                type="number"
                placeholder="Amount of LP Tokens"
                onChange={async (e) => {
                  setRemoveLPTokens(e.target.value || "0");
                  // Calculate the amount of Ether and CD tokens that the user would receive
                  // After he removes `e.target.value` amount of `LP` tokens
                  await _getTokensAfterRemove(e.target.value || 0);
                }}
                className={styles.input}
              />
              <div  className={styles.inputDiv}>
                {/* Convert the BigNumber to string using the formatEther function from ethers.js */}
                {`You will get ${utils.formatEther(removeCD)} Crypto Dev Tokens and ${utils.formatEther(removeEther)} Eth`}
              </div>
              <button className={styles.button1} onClick={_removeLiquidity}>
                Remove
              </button>
            </div>
            </div>
          </div>
        );
      } else {
        return (
          <div>
            <input
              type="number"
              placeholder="Amount"
              onChange={async (e) => {
                setSwapAmount(e.target.value || "");
                // Calculate the amount of tokens user would receive after the swap
                await _getAmountOfTokensReceivedFromSwap(e.target.value || "0");
              }}
              className={styles.input}
              value={swapAmount}
            />
            <select
              className={styles.select}
              name="dropdown"
              id="dropdown"
              onChange={async () => {
                setEthSelected(!ethSelected);
                // Initialize the values back to zero
                await _getAmountOfTokensReceivedFromSwap(0);
                setSwapAmount("");
              }}
              >
                <option value="eth">Ethereum</option>
                <option value="cyptoDevToken">Crypto Dev Token</option>
            </select>
            <br />
            <div className={styles.inputDiv}>
              {/* Convert the BigNumber to string using the formatEther function from ethers.js */}
              {ethSelected
                ? `You will get ${utils.formatEther(tokenToBeReceivedAfterSwap)} Crypto Dev Tokens`
                : `You will get ${utils.formatEther(tokenToBeReceivedAfterSwap)} Eth`
              }
            </div>
            <button className={styles.button1} onClick={_swapTokens}>
              Swap
            </button>
          </div>
        );
      }
  };
  

  return (
      <div>
        <Head>
          <title>Crypto Devs</title>
          <meta name="description" content="CryptoDevs AMM" />
          <link rel="icon" href="/favicon.ico" />
        </Head>
        <div className={styles.main}>
          <div>
            <h1 className={styles.title}>Welcome to Crypto Devs Exchange</h1>
            <div  className={styles.description}>
              Exchange Ethereum &#60;&#62; Crypto Dev Tokens
            </div>
            <div>
              <button
                className={styles.button}
                onClick={()=> {
                  setLiquidityTab(true);
                }}
                >
                Liquidity
              </button>
              <button
                className={styles.button}
                onClick = {()=> {
                  setLiquidityTab(false);
                }}
                >
                Swap
              </button>
            </div>
            {renderButton()}
          </div>
          <div>
              <img className={styles.image} src="./0.svg" />
            </div>
        </div>

        <footer className={styles.footer}>
          Made with &#10084; by Crypto Devs
        </footer>
      </div>
  );
}
