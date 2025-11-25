import { createConfig, http } from 'wagmi';
import { mainnet, polygon, arbitrum, optimism, base, bsc, avalanche } from 'wagmi/chains';
import { walletConnect, injected, coinbaseWallet } from 'wagmi/connectors';

const projectId = import.meta.env.VITE_WC_PROJECT_ID;

export const config = createConfig({
  chains: [mainnet, polygon, arbitrum, optimism, base, bsc, avalanche],
  connectors: [
    // Only include WalletConnect if projectId is provided
    ...(projectId ? [walletConnect({ 
      projectId,
      showQrModal: true,
      metadata: {
        name: 'HAVX',
        description: 'Multi-chain crypto portfolio tracker',
        url: 'https://havx.app',
        icons: ['https://havx.app/icon.png']
      }
    })] : []),
    injected({
      shimDisconnect: true,
    }),
    coinbaseWallet({
      appName: 'HAVX',
      appLogoUrl: 'https://havx.app/icon.png'
    }),
  ],
  transports: {
    [mainnet.id]: http(),
    [polygon.id]: http(),
    [arbitrum.id]: http(),
    [optimism.id]: http(),
    [base.id]: http(),
    [bsc.id]: http(),
    [avalanche.id]: http(),
  },
});
