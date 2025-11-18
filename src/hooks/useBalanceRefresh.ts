import { useEffect, useRef } from 'react';
import { useWalletStore } from '@/stores/walletStore';
import { getAllChainBalances } from '@/lib/blockchainService';
import { fetchPricesByIds } from '@/lib/priceService';
import { NATIVE_COINGECKO_IDS, EVM_TOKENS, SOLANA_TOKENS } from '@/lib/tokenLists';

export function useBalanceRefresh(intervalMs: number = 15000) {
  const { connectedWallets, updateWalletBalances, setTotalPortfolioUSD, setLastUpdated } = useWalletStore();
  const intervalRef = useRef<NodeJS.Timeout>();

  const refreshAllWallets = async () => {
    if (connectedWallets.length === 0) return;

    console.log('Refreshing balances for all wallets...');

    try {
      // Refresh each wallet in parallel
      const refreshPromises = connectedWallets.map(async (wallet) => {
        try {
          const balances = await getAllChainBalances(wallet.address, wallet.type);

          // Fetch prices
          if (balances.length > 0) {
            const coingeckoIds = new Set<string>();
            
            balances.forEach((token) => {
              if (!token.contractAddress) {
                const nativeId = NATIVE_COINGECKO_IDS[token.chain];
                if (nativeId) coingeckoIds.add(nativeId);
              } else if (token.chain === 'solana') {
                const info = SOLANA_TOKENS.find((t) => t.address === token.contractAddress);
                if (info?.coingeckoId) coingeckoIds.add(info.coingeckoId);
              } else {
                const list = (EVM_TOKENS as any)[token.chain] as Array<any> | undefined;
                const info = list?.find((t) => t.address.toLowerCase() === token.contractAddress?.toLowerCase());
                if (info?.coingeckoId) coingeckoIds.add(info.coingeckoId);
              }
            });

            const prices = await fetchPricesByIds(Array.from(coingeckoIds));

            // Update balances with USD values
            balances.forEach((token) => {
              if (!token.contractAddress) {
                const nativeId = NATIVE_COINGECKO_IDS[token.chain];
                if (nativeId && prices[nativeId]) {
                  token.priceUsd = prices[nativeId];
                  token.usdValue = parseFloat(token.balance) * prices[nativeId];
                }
              } else if (token.chain === 'solana') {
                const info = SOLANA_TOKENS.find((t) => t.address === token.contractAddress);
                if (info?.coingeckoId && prices[info.coingeckoId]) {
                  token.priceUsd = prices[info.coingeckoId];
                  token.usdValue = parseFloat(token.balance) * prices[info.coingeckoId];
                }
              } else {
                const list = (EVM_TOKENS as any)[token.chain] as Array<any> | undefined;
                const info = list?.find((t) => t.address.toLowerCase() === token.contractAddress?.toLowerCase());
                if (info?.coingeckoId && prices[info.coingeckoId]) {
                  token.priceUsd = prices[info.coingeckoId];
                  token.usdValue = parseFloat(token.balance) * prices[info.coingeckoId];
                }
              }
            });
          }

          updateWalletBalances(wallet.id, balances);
        } catch (error) {
          console.error(`Failed to refresh wallet ${wallet.id}:`, error);
        }
      });

      await Promise.allSettled(refreshPromises);

      // Recalculate total portfolio value
      const store = useWalletStore.getState();
      const totalUSD = store.connectedWallets.reduce((sum, w) => sum + w.totalUsdValue, 0);
      setTotalPortfolioUSD(totalUSD);
      setLastUpdated(Date.now());

      console.log('Balance refresh complete. Total portfolio:', totalUSD);
    } catch (error) {
      console.error('Failed to refresh balances:', error);
    }
  };

  useEffect(() => {
    if (connectedWallets.length === 0) return;

    // Refresh immediately on mount
    refreshAllWallets();

    // Set up interval for auto-refresh
    intervalRef.current = setInterval(refreshAllWallets, intervalMs);

    // Cleanup on unmount
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [connectedWallets.length, intervalMs]);

  return { refreshAllWallets };
}
