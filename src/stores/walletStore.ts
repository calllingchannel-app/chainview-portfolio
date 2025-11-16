import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface TokenBalance {
  symbol: string;
  name: string;
  balance: string;
  decimals: number;
  usdValue: number;
  priceUsd: number;
  chain: string;
  logo?: string;
  contractAddress?: string;
}

export interface ConnectedWallet {
  id: string;
  address: string;
  type: 'evm' | 'solana';
  name: string;
  chain?: string;
  balances: TokenBalance[];
  totalUsdValue: number;
  connectedAt: number;
}

interface WalletStore {
  connectedWallets: ConnectedWallet[];
  totalPortfolioUSD: number;
  isLoading: boolean;
  lastUpdated: number | null;
  priceCache: Record<string, { price: number; timestamp: number }>;
  
  addWallet: (wallet: ConnectedWallet) => void;
  removeWallet: (walletId: string) => void;
  updateWalletBalances: (walletId: string, balances: TokenBalance[]) => void;
  setTotalPortfolioUSD: (total: number) => void;
  setLoading: (loading: boolean) => void;
  setLastUpdated: (timestamp: number) => void;
  updatePriceCache: (tokenId: string, price: number) => void;
  clearWallets: () => void;
}

export const useWalletStore = create<WalletStore>()(
  persist(
    (set, get) => ({
      connectedWallets: [],
      totalPortfolioUSD: 0,
      isLoading: false,
      lastUpdated: null,
      priceCache: {},

      addWallet: (wallet) =>
        set((state) => ({
          connectedWallets: [...state.connectedWallets, wallet],
        })),

      removeWallet: (walletId) =>
        set((state) => ({
          connectedWallets: state.connectedWallets.filter((w) => w.id !== walletId),
        })),

      updateWalletBalances: (walletId, balances) =>
        set((state) => ({
          connectedWallets: state.connectedWallets.map((w) =>
            w.id === walletId
              ? {
                  ...w,
                  balances,
                  totalUsdValue: balances.reduce((sum, b) => sum + b.usdValue, 0),
                }
              : w
          ),
        })),

      setTotalPortfolioUSD: (total) => set({ totalPortfolioUSD: total }),
      
      setLoading: (loading) => set({ isLoading: loading }),
      
      setLastUpdated: (timestamp) => set({ lastUpdated: timestamp }),

      updatePriceCache: (tokenId, price) =>
        set((state) => ({
          priceCache: {
            ...state.priceCache,
            [tokenId]: { price, timestamp: Date.now() },
          },
        })),

      clearWallets: () =>
        set({
          connectedWallets: [],
          totalPortfolioUSD: 0,
          lastUpdated: null,
        }),
    }),
    {
      name: 'chainview-wallets',
    }
  )
);
