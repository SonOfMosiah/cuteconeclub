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

import styles from './index.module.css';
import abi from 'abi/contract-abi.json';
import wethAbi from 'abi/weth-abi.json';
import { success } from 'helpers/effects';

const PRICE = 0.01;
const cccAddress = '0xCe2871dc8cA2Faf5F92aC78F68Dce1bA158b0Aed';

const Home: NextPage = () => {
  const [approved, setApproved] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [quantity, setQuantity] = useState<number>(3);

  const { address } = useAccount();

  const { config, error: contractError } = usePrepareContractWrite({
    address: cccAddress,
    abi: [
      {
        name: 'mint',
        type: 'function',
        stateMutability: 'nonpayable',
        inputs: [{ internalType: 'uint256', name: 'amount', type: 'uint256' }],
        outputs: [],
      },
    ],
    functionName: 'mint',
    args: [BigNumber.from(quantity)],
    overrides: {
      from: address,
      // value: ethers.utils.parseEther((quantity * PRICE).toString()),
    },
  });

  const { config: approveConfig, error: wethContractError } =
    usePrepareContractWrite({
      address: '0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619',
      abi: [
        {
          name: 'approve',
          type: 'function',
          stateMutability: 'nonpayable',
          inputs: [
            { internalType: 'address', name: 'spender', type: 'address' },
            { internalType: 'uint256', name: 'amount', type: 'uint256' },
          ],
          outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
        },
      ],
      functionName: 'approve',
      args: [
        cccAddress, // address of contract that you want to approve
        ethers.utils.parseEther((quantity * PRICE).toString()), // maximum amount of tokens that you want to allow the contract to spend
      ],
      overrides: {
        from: address,
      },
    });

  const {
    data: approveData,
    isLoading: approveLoading,
    isSuccess: approveSuccess,
    write: approve,
  } = useContractWrite(approveConfig);

  const {
    isLoading,
    isSuccess: isStarted,
    error: mintError,
    data: mintData,
    write,
  } = useContractWrite(config);

  const {
    data: allowanceData,
    isError: allowanceError,
    isLoading: allowanceLoading,
    refetch,
  } = useContractRead({
    address: '0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619', // address of WETH contract
    abi: wethAbi,
    functionName: 'allowance',
    args: [
      address, // user's address
      cccAddress, // address of contract that you want to approve
    ],
  });

  const { isSuccess: isMinted } = useWaitForTransaction({
    hash: mintData?.hash,
  });

  const { isSuccess: isApproved } = useWaitForTransaction({
    hash: approveData?.hash,
  });

  const handleChange = (event: Event, newValue: number | number[]) => {
    setQuantity(newValue as number);
  };

  const checkIfWalletIsApproved = async () => {
    refetch();
    if (
      allowanceData &&
      BigNumber.from(allowanceData).gte(
        ethers.utils.parseEther((quantity * PRICE).toString())
      )
    ) {
      setApproved(true);
    } else {
      setApproved(false);
    }
  };

  useEffect(() => {
    if (isConnected && !approved) {
      checkIfWalletIsApproved();
    }
  }, [isConnected, approved]);

  useEffect(() => {
    if (allowanceData) {
      checkIfWalletIsApproved();
    }
  }, [allowanceData]);

  useEffect(() => {
    checkIfWalletIsApproved();
  }, [quantity]);

  useEffect(() => {
    setIsConnected(!!address);
  }, [address]);

  useEffect(() => {
    if (isMinted) {
      success();
    }
  }, [isMinted]);

  useEffect(() => {
    if (isApproved) {
      checkIfWalletIsApproved();
    }
  }, [isApproved]);

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
      {/* {contractError && (
        <toast.error>{`Error preparing contract write: ${contractError}`}</toast.error>
      )}
      {wethContractError && (
        <toast.error>{`Error preparing contract write: ${wethContractError}`}</toast.error>
      )}
      {mintError && (
        <toast.error>{`Error writing to contract: ${mintError}`}</toast.error>
      )} */}
      <div className={styles.container}>
        <div className={styles.main}>
          <h1 className={styles.title1}>Mint</h1>
          <h1 className={styles.title2}>Cute Cone Club</h1>
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
              {approved ? (
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
                  <div className={styles.price}>
                    You are about to mint <strong>{quantity}</strong> Cute Cone
                    Club NFT{quantity > 1 && 's'} for a total of{' '}
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
                  <div>Please approve WETH contract before proceeding</div>
                  <Button
                    variant='contained'
                    color='secondary'
                    size='large'
                    onClick={() => {
                      approve?.();
                    }}
                    disabled={!!wethContractError}
                  >
                    Approve WETH
                  </Button>
                  {approveLoading && !approveSuccess && (
                    <div className={styles.status}>Waiting for approval...</div>
                  )}
                  {approveSuccess && !approveData && (
                    <div className={styles.status}>Approving WETH...</div>
                  )}
                  {approveData && (
                    <div className={styles.action}>
                      <a
                        href={`https://etherscan.io/tx/${approveData.hash}`}
                        target='_blank'
                        rel='noreferrer'
                      >
                        View transaction
                      </a>
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
