import { createConfig, http } from 'wagmi';
import { mainnet, polygon, arbitrum, optimism, base, bsc, avalanche } from 'wagmi/chains';
import { walletConnect, injected, coinbaseWallet } from 'wagmi/connectors';

const projectId = import.meta.env.VITE_WC_PROJECT_ID || '42a39d25d06085beb92409bac1149989';

export const config = createConfig({
  chains: [mainnet, polygon, arbitrum, optimism, base, bsc, avalanche],
  connectors: [
    // Injected connector for browser extensions (MetaMask, Rabby, Brave, etc.)
    injected({
      shimDisconnect: true,
    }),
    // Coinbase Wallet
    coinbaseWallet({
      appName: 'HAVX',
      headlessMode: false,
    }),
    // WalletConnect v2
    walletConnect({ 
      projectId,
      showQrModal: true,
      metadata: {
        name: 'HAVX',
        description: 'Multi-chain crypto portfolio tracker',
        url: typeof window !== 'undefined' ? window.location.origin : 'https://havx.app',
        icons: ['https://havx.app/icon.png']
      }
    }),
  ],
  transports: {
    [mainnet.id]: http('https://eth.llamarpc.com'),
    [polygon.id]: http('https://polygon.llamarpc.com'),
    [arbitrum.id]: http('https://arbitrum.llamarpc.com'),
    [optimism.id]: http('https://optimism.llamarpc.com'),
    [base.id]: http('https://base.llamarpc.com'),
    [bsc.id]: http('https://bsc-dataseed1.binance.org'),
    [avalanche.id]: http('https://api.avax.network/ext/bc/C/rpc'),
  },
});
