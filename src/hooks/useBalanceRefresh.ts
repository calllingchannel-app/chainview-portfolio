import { useEffect, useRef, useCallback } from 'react';
import { useWalletStore } from '@/stores/walletStore';
import { getAllChainBalances } from '@/lib/blockchainService';
import { fetchPricesByIds } from '@/lib/priceService';
import { EVM_TOKENS, SOLANA_TOKENS } from '@/lib/tokenLists';

// Map chain names to their native token CoinGecko IDs
const NATIVE_TOKEN_IDS: Record<string, string> = {
  ethereum: 'ethereum',
  polygon: 'matic-network',
  arbitrum: 'ethereum',
  optimism: 'ethereum',
  base: 'ethereum',
  bsc: 'binancecoin',
  avalanche: 'avalanche-2',
  solana: 'solana',
};

// Map token symbols to CoinGecko IDs
const SYMBOL_TO_COINGECKO: Record<string, string> = {
  ETH: 'ethereum',
  WETH: 'weth',
  MATIC: 'matic-network',
  BNB: 'binancecoin',
  AVAX: 'avalanche-2',
  SOL: 'solana',
  USDT: 'tether',
  USDC: 'usd-coin',
  DAI: 'dai',
  WBTC: 'wrapped-bitcoin',
  LINK: 'chainlink',
  AAVE: 'aave',
  UNI: 'uniswap',
  ARB: 'arbitrum',
  OP: 'optimism',
  mSOL: 'marinade-staked-sol',
  BONK: 'bonk',
};

export function useBalanceRefresh(intervalMs: number = 15000) {
  const { connectedWallets, updateWalletBalances, setTotalPortfolioUSD, setLastUpdated, setLoading } = useWalletStore();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isRefreshingRef = useRef(false);

  const refreshAllWallets = useCallback(async () => {
    if (connectedWallets.length === 0 || isRefreshingRef.current) return;
    
    isRefreshingRef.current = true;
    setLoading(true);
    console.log('🔄 Refreshing balances for', connectedWallets.length, 'wallet(s)...');

    try {
      // Refresh each wallet in parallel
      const refreshPromises = connectedWallets.map(async (wallet) => {
        try {
          console.log(`📡 Fetching balances for ${wallet.name} (${wallet.type})...`);
          const balances = await getAllChainBalances(wallet.address, wallet.type);
          console.log(`✅ Got ${balances.length} token(s) for ${wallet.name}`);

          // Collect all unique CoinGecko IDs for price fetching
          const coingeckoIds = new Set<string>();
          
          balances.forEach((token) => {
            // Native tokens - use chain-based lookup
            if (!token.contractAddress) {
              const nativeId = NATIVE_TOKEN_IDS[token.chain];
              if (nativeId) coingeckoIds.add(nativeId);
            } else if (token.chain === 'solana') {
              const info = SOLANA_TOKENS.find((t) => t.address === token.contractAddress);
              if (info?.coingeckoId) coingeckoIds.add(info.coingeckoId);
            } else {
              const chainTokens = EVM_TOKENS[token.chain];
              const info = chainTokens?.find((t) => t.address.toLowerCase() === token.contractAddress?.toLowerCase());
              if (info?.coingeckoId) coingeckoIds.add(info.coingeckoId);
            }
            
            // Also try symbol-based lookup as fallback
            const symbolId = SYMBOL_TO_COINGECKO[token.symbol.toUpperCase()];
            if (symbolId) coingeckoIds.add(symbolId);
          });

          let prices: Record<string, number> = {};
          if (coingeckoIds.size > 0) {
            console.log(`💰 Fetching prices for ${coingeckoIds.size} tokens...`);
            prices = await fetchPricesByIds(Array.from(coingeckoIds));
            console.log('📊 Prices fetched:', Object.keys(prices).length);
          }

          // Update balances with USD values
          const balancesWithPrices = balances.map((token) => {
            let priceId: string | undefined;
            
            // Native tokens
            if (!token.contractAddress) {
              priceId = NATIVE_TOKEN_IDS[token.chain];
            } else if (token.chain === 'solana') {
              const info = SOLANA_TOKENS.find((t) => t.address === token.contractAddress);
              priceId = info?.coingeckoId;
            } else {
              const chainTokens = EVM_TOKENS[token.chain];
              const info = chainTokens?.find((t) => t.address.toLowerCase() === token.contractAddress?.toLowerCase());
              priceId = info?.coingeckoId;
            }
            
            // Fallback to symbol lookup
            if (!priceId || !prices[priceId]) {
              priceId = SYMBOL_TO_COINGECKO[token.symbol.toUpperCase()];
            }

            const price = priceId ? (prices[priceId] || 0) : 0;
            const balanceNum = parseFloat(token.balance) || 0;
            
            return {
              ...token,
              priceUsd: price,
              usdValue: balanceNum * price
            };
          });

          updateWalletBalances(wallet.id, balancesWithPrices);
        } catch (error) {
          console.error(`❌ Failed to refresh wallet ${wallet.name}:`, error);
        }
      });

      await Promise.allSettled(refreshPromises);

      // Recalculate total portfolio value from fresh state
      const store = useWalletStore.getState();
      const totalUSD = store.connectedWallets.reduce((sum, w) => sum + w.totalUsdValue, 0);
      setTotalPortfolioUSD(totalUSD);
      setLastUpdated(Date.now());

      console.log('✅ Balance refresh complete. Total portfolio: $' + totalUSD.toFixed(2));
    } catch (error) {
      console.error('❌ Failed to refresh balances:', error);
    } finally {
      isRefreshingRef.current = false;
      setLoading(false);
    }
  }, [connectedWallets, updateWalletBalances, setTotalPortfolioUSD, setLastUpdated, setLoading]);

  useEffect(() => {
    if (connectedWallets.length === 0) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // Refresh immediately on mount/wallet change
    refreshAllWallets();

    // Set up interval for auto-refresh
    intervalRef.current = setInterval(refreshAllWallets, intervalMs);

    // Cleanup on unmount
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [connectedWallets.length, intervalMs, refreshAllWallets]);

  return { refreshAllWallets };
}
