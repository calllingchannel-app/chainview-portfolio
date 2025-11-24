import { createConfig, http } from 'wagmi';
import { mainnet, polygon, arbitrum, optimism, base, bsc, avalanche } from 'wagmi/chains';
import { walletConnect, injected, coinbaseWallet } from 'wagmi/connectors';

const projectId = import.meta.env.VITE_WC_PROJECT_ID || 'demo-project-id';

export const config = createConfig({
  chains: [mainnet, polygon, arbitrum, optimism, base, bsc, avalanche],
  connectors: [
    walletConnect({ 
      projectId,
      showQrModal: true,
    }),
    injected(),
    coinbaseWallet({
      appName: 'ChainView',
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
