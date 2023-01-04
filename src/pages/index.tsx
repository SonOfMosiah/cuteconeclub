import { useEffect, useState } from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import type { NextPage } from 'next';
import Image from 'next/image';
import Head from 'next/head';
import { ethers, BigNumber } from 'ethers';
import {
  useAccount,
  usePrepareContractWrite,
  useContractWrite,
  useContractRead,
  useWaitForTransaction,
} from 'wagmi';
import Button from '@mui/material/Button';
import Slider from '@mui/material/Slider';
import { toast } from 'react-toastify';
import axios from 'axios';

import styles from './index.module.css';
import newAbi from 'abi/new-contract-abi.json';
import abi from 'abi/contract-abi.json';
import { success } from 'helpers/effects';

const PRICE = 0.01;
const TOTAL_SUPPLY = 420;
const cccAddress = '0xCe2871dc8cA2Faf5F92aC78F68Dce1bA158b0Aed';
const newCCCAddress = '0x773A5914BEB6c395F85F911B244EB44Dc49dCD6E';
// const newCCCAddress = '0xED25FA226d3Ba81A90cD0B4c4d77223109CFd57b';
const baseURI = 'ipfs/QmUF9taaSgjTTUsZHnqeNjnH4zwA13Utz6ZnWHugg6EP21/';

const pinataApiKey = process.env.NEXT_PUBLIC_PINATA_KEY;
const pinataSecretApiKey = process.env.NEXT_PUBLIC_PINATA_SECRET;

const Home: NextPage = () => {
  const [isConnected, setIsConnected] = useState(false);
  // define rerender state
  const [rerender, setRerender] = useState(false);
  const { address } = useAccount();

  let t: any;
  const { config, error: contractError } = usePrepareContractWrite({
    address: newCCCAddress,
    abi: [
      {
        inputs: [],
        name: 'mint',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
      },
    ],
    functionName: 'mint',
    args: t,
    overrides: {
      from: address,
    },
  });

  // write a force rerender function
  const forceRerender = () => setRerender(!rerender);

  const {
    isLoading,
    isSuccess: isStarted,
    error: mintError,
    data: mintData,
    write,
  } = useContractWrite(config);

  const { data: successfulMintData, isSuccess: isMinted } =
    useWaitForTransaction({
      hash: mintData?.hash,
    });

  let x: any;

  const { data: totalSupply = 0, refetch: supplyRefetch } = useContractRead({
    address: newCCCAddress,
    abi: [
      {
        name: 'totalSupply',
        type: 'function',
        stateMutability: 'view',
        inputs: [],
        outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
      },
    ],
    functionName: 'totalSupply',
    args: x,
  });

  const handleClick = () => {
    window.location.reload();
  };

  let tokenId: BigNumber;

  let tokenImageSrc: string;
  const getTokenData = () => {
    try {
      let id = Number(
        successfulMintData?.logs[0].topics[3].toString() || totalSupply
      );
      let uri = baseURI + id;
      tokenImageSrc = '/Images/' + id + '.png';
      console.log('tokenImageSrc:', tokenImageSrc);
      forceRerender();
    } catch (error) {
      console.error('getTokenData error:', error);
      return null;
    }
  };

  useEffect(() => {
    setIsConnected(!!address);
  }, [address]);

  useEffect(() => {
    if (isMinted) {
      supplyRefetch();
      console.log('tokenId:', successfulMintData?.logs[0].topics[3].toString());
      getTokenData();
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
          <h1 className={styles.title1}>Mint</h1>
          <h1 className={styles.title2}>Cute Cone Club</h1>
          {!isMinted && (
            <>
              <div className={styles.logoContainer}>
                <Image
                  src='/img/logo.gif'
                  alt='Cute Cone Club logo'
                  layout='fill'
                />
              </div>
            </>
          )}
          {isMinted && (
            <>
              <div className={styles.logoContainer}>
                <Image
                  src={'/Images/' + Number(totalSupply.toString()) + '.png'}
                  alt='Cute Cone Club'
                  layout='fill'
                />
              </div>
            </>
          )}

          <ConnectButton showBalance={false} chainStatus='none' />
          {isConnected && (
            <>
              <div className={styles.price}>
                {/* You are about to mint <strong>{quantity}</strong> Cute Cone Club
                NFT{quantity > 1 && 's'} for a total of{' '}
                <strong>
                  {Math.round(quantity * PRICE * 1000) / 1000} WETH
                </strong>
                . Move the slider below to adjust the quantity. */}
              </div>
              {totalSupply && (
                <div className={styles.price}>
                  <strong>{totalSupply.toString()}</strong> /{' '}
                  <strong>{TOTAL_SUPPLY} </strong>
                  minted
                </div>
              )}
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
                  <Button
                    variant='contained'
                    color='primary'
                    size='large'
                    onClick={handleClick}
                    disabled={!!contractError}
                  >
                    Mint
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    variant='contained'
                    color='primary'
                    size='large'
                    onClick={() => {
                      write?.();
                    }}
                    disabled={!!contractError || isLoading || isStarted}
                  >
                    Mint
                  </Button>
                  {isLoading && (
                    <div className={styles.status}>Waiting for approval...</div>
                  )}
                  {isStarted && <div className={styles.status}>Minting...</div>}
                  {mintData && (
                    <>
                      <div className={styles.action}>
                        <a
                          href={`https://etherscan.io/tx/${mintData.hash}`}
                          target='_blank'
                          rel='noreferrer'
                        >
                          View transaction
                        </a>
                      </div>
                    </>
                  )}
                  {contractError && (
                    <div className={styles.error}>
                      An error occurred while preparing the transaction. Make
                      sure you're on the allowlist and haven't already minted
                      your allowance.
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
          )}
          <div className={styles.opensea}>
            <a
              href='https://opensea.io/collection/cuteconeclub'
              target='_blank'
              rel='noreferrer'
              style={{ marginRight: '1.5rem' }}
            >
              <Image
                src='/img/opensea.svg'
                width='50'
                height='50'
                alt='OpenSea logo'
              />
            </a>
            <a
              href='https://polygonscan.com/token/0x773A5914BEB6c395F85F911B244EB44Dc49dCD6E'
              target='_blank'
              rel='noreferrer'
              style={{ marginLeft: '1.5rem' }}
            >
              <Image
                src='/img/polygonscan.svg'
                width='50'
                height='50'
                alt='Polygonscan logo'
              />
            </a>
          </div>
        </div>
      </div>
    </>
  );
};

export default Home;
