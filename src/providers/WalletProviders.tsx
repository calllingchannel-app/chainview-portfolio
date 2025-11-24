import { ReactNode, useMemo } from 'react';
import { WagmiProvider } from 'wagmi';
import { config } from '@/config/wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  ConnectionProvider,
  WalletProvider,
} from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { 
  PhantomWalletAdapter, 
  SolflareWalletAdapter,
  Coin98WalletAdapter,
  TrustWalletAdapter,
} from '@solana/wallet-adapter-wallets';
import { BackpackWalletAdapter } from '@solana/wallet-adapter-backpack';
import { GlowWalletAdapter } from '@solana/wallet-adapter-glow';
import { SlopeWalletAdapter } from '@solana/wallet-adapter-slope';
import { clusterApiUrl } from '@solana/web3.js';

// Import Solana wallet adapter styles
import '@solana/wallet-adapter-react-ui/styles.css';

const queryClient = new QueryClient();

interface WalletProvidersProps {
  children: ReactNode;
}

export function WalletProviders({ children }: WalletProvidersProps) {
  // Solana configuration
  const endpoint = useMemo(() => {
    const heliusUrl = import.meta.env.VITE_HELIUS_RPC_URL;
    return heliusUrl || clusterApiUrl('mainnet-beta');
  }, []);

  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter(),
      new SolflareWalletAdapter(),
      new BackpackWalletAdapter(),
      new GlowWalletAdapter(),
      new SlopeWalletAdapter(),
      new Coin98WalletAdapter(),
      new TrustWalletAdapter(),
    ],
    []
  );

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <ConnectionProvider endpoint={endpoint}>
          <WalletProvider wallets={wallets} autoConnect={false}>
            <WalletModalProvider>
              {children}
            </WalletModalProvider>
          </WalletProvider>
        </ConnectionProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
