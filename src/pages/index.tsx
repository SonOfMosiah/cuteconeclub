import { useEffect, useState } from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import type { NextPage } from 'next';
import Image from 'next/image';
import Head from 'next/head';
import { ethers } from 'ethers';
import {
  useAccount,
  usePrepareContractWrite,
  useContractWrite,
  useContractRead,
  useWaitForTransaction,
} from 'wagmi';
import Button from '@mui/material/Button';
import Slider from '@mui/material/Slider';

import styles from './index.module.css';
import contractInterface from 'abi/contract-abi.json';
import wethContractInterface from 'abi/weth-abi.json';
import { success } from 'helpers/effects';

const PRICE = 0.01;

const Home: NextPage = () => {
  const [isApproved, setIsApproved] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [quantity, setQuantity] = useState<number>(3);

  const { address } = useAccount();

  const { config: allowanceConfig, data: allowanceData } = useContractRead({
    addressOrName: '0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619', // address of WETH contract
    contractInterface: wethContractInterface,
    functionName: 'allowance',
    args: [
      '0x84f28B7c5d9D695DAD48072E1BBd3450E0A71057', // address of contract that you want to approve
      address, // user's address
    ],
  });

  const { config, error: contractError } = usePrepareContractWrite({
    addressOrName: '0x84f28B7c5d9D695DAD48072E1BBd3450E0A71057',
    contractInterface: contractInterface,
    functionName: 'mint',
    args: [quantity],
    overrides: {
      from: address,
      // value: ethers.utils.parseEther((quantity * PRICE).toString()),
    },
  });

  const { config: approveConfig, write: approve } = useContractWrite({
    addressOrName: '0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619', // address of WETH contract
    contractInterface: wethContractInterface,
    functionName: 'approve',
    args: [
      '0x84f28B7c5d9D695DAD48072E1BBd3450E0A71057', // address of contract that you want to approve
      ethers.utils.hexlify(
        ethers.utils.parseEther((quantity * PRICE).toString())
      ), // maximum amount of tokens that you want to allow the contract to spend
    ],
    overrides: {
      from: address,
    },
  });

  const {
    isLoading,
    isSuccess: isStarted,
    error: mintError,
    data: mintData,
    write,
  } = useContractWrite(config);

  const { isSuccess: isMinted } = useWaitForTransaction({
    hash: mintData?.hash,
  });

  const handleChange = (event: Event, newValue: number | number[]) => {
    setQuantity(newValue as number);
  };

  useEffect(() => {
    setIsConnected(!!address);
  }, [address]);

  useEffect(() => {
    if (isMinted) {
      success();
    }
  }, [isMinted]);

  return (
    <>
      <Head>
        <title>Cute Cone Club NFT</title>
        <meta
          name='description'
          content='420 Cute Cone Club NFTs on the Polygon blockchain.'
        />
        <meta property='og:type' content='website' />
        <meta property='og:url' content='https://cuteconeclub.vercel.app/' />
        <meta property='og:title' content='Cute Cone Club NFT' />
        <meta
          property='og:description'
          content='420 Cute Cone Club NFTs on the Polygon blockchain.'
        />
        <meta
          property='og:image'
          content='https://cuteconeclub.vercel.app/img/sample.png'
        />
        <link rel='icon' href='/favicon.ico' />
        <script
          async
          defer
          data-website-id='62f4e8f0-899c-41d7-abce-97abf4ba1105'
          src='https://umami.0x3.studio/umami.js'
        ></script>
      </Head>
      <div className={styles.container}>
        <div className={styles.main}>
          <div className={styles.logoContainer}>
            <Image
              src='/img/logo.gif'
              alt='Cute Cone Club logo'
              layout='fill'
            />
          </div>
          <ConnectButton showBalance={false} chainStatus='none' />
          {isConnected && (
            <>
              {/* {allowanceData && allowanceData.allowance.gt(0) ? ( */}
              {allowanceData ? (
                // contract has been approved, render mint button
                <>
                  {isMinted ? (
                    <>
                      <div className={styles.status}>Success!</div>
                      <div className={styles.action}>
                        <a
                          href={`https://opensea.io/${address}?tab=collected`}
                          target='_blank'
                          rel='noreferrer'
                        >
                          View on OpenSea
                        </a>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className={styles.price}>
                        You are about to mint <strong>{quantity}</strong> Cute
                        Cone Club NFT{quantity > 1 && 's'} for a total of{' '}
                        <strong>
                          {Math.round(quantity * PRICE * 1000) / 1000} WETH
                        </strong>
                        . Move the slider below to adjust the quantity.
                      </div>
                      <Slider
                        color='secondary'
                        value={quantity}
                        onChange={handleChange}
                        aria-label='Quantity'
                        valueLabelDisplay='auto'
                        step={1}
                        min={1}
                        max={10}
                        disabled={isLoading || isStarted}
                      />
                      <Button
                        variant='contained'
                        color='secondary'
                        size='large'
                        onClick={() => {
                          write?.();
                        }}
                        disabled={!!contractError || isLoading || isStarted}
                      >
                        Mint
                      </Button>
                      {isLoading && (
                        <div className={styles.status}>
                          Waiting for approval...
                        </div>
                      )}
                      {isStarted && (
                        <div className={styles.status}>Minting...</div>
                      )}
                      {mintData && (
                        <div className={styles.action}>
                          <a
                            href={`https://etherscan.io/tx/${mintData.hash}`}
                            target='_blank'
                            rel='noreferrer'
                          >
                            View transaction
                          </a>
                        </div>
                      )}
                      {contractError && (
                        <div className={styles.error}>
                          An error occurred while preparing the transaction.
                          Make sure that you have enough funds, approved WETH to
                          be spent by this contract, and that you haven’t
                          reached your limit of 10 tokens.
                        </div>
                      )}
                      {mintError && (
                        <div className={styles.error}>
                          An error occurred while accessing your wallet or
                          processing the transaction.
                        </div>
                      )}
                    </>
                  )}
                </>
              ) : (
                // contract has not been approved, display message and button to approve contract
                <>
                  <div>Please approve WETH contract before proceeding</div>
                  <Button onClick={approve}>Approve WETH contract</Button>
                </>
              )}
            </>
          )}
          <div className={styles.opensea}>
            <a
              href='https://opensea.io/collection/cuteconeclub-v2'
              target='_blank'
              rel='noreferrer'
            >
              <Image
                src='/img/opensea.svg'
                width='50'
                height='50'
                alt='OpenSea logo'
              />
            </a>
          </div>
        </div>
      </div>
    </>
  );
};

export default Home;
