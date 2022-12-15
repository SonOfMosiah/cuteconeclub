import type { AppProps } from 'next/app';
import { ChainId, ThirdwebProvider } from '@thirdweb-dev/react';
import '../styles/globals.css';
import Head from 'next/head';
import BitconeFooter from '../components/GitHubLink';

// This is the chainId your dApp will work on.
const activeChainId = ChainId.Polygon;

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <ThirdwebProvider desiredChainId={activeChainId}>
      <Head>
        <title>CuteConeClub</title>
        <meta name='viewport' content='width=device-width, initial-scale=1.0' />
        <meta
          name='description'
          content='NFT Minting Page for the Cute Cone Club'
        />
        <meta
          name='keywords'
          content='NFT, Polygon, Bitcone, EVM, SonOfMosiah, Thirdweb'
        />
      </Head>
      <Component {...pageProps} />
      <BitconeFooter />
    </ThirdwebProvider>
  );
}

export default MyApp;
