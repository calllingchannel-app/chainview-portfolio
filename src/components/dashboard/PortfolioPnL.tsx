import { useEffect, useState, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Clock, RefreshCw } from 'lucide-react';
import { useWalletStore } from '@/stores/walletStore';
import { calculatePortfolioPnL, formatPnL, type PortfolioPnL as PnLType, type TimePeriod } from '@/lib/priceHistoryService';
import { EVM_TOKENS, SOLANA_TOKENS } from '@/lib/tokenLists';

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

const SYMBOL_TO_COINGECKO: Record<string, string> = {
  ETH: 'ethereum',
  WETH: 'weth',
  MATIC: 'matic-network',
  BNB: 'binancecoin',
  AVAX: 'avalanche-2',
  SOL: 'solana',
  WSOL: 'solana',
  USDT: 'tether',
  USDC: 'usd-coin',
  DAI: 'dai',
  WBTC: 'wrapped-bitcoin',
  LINK: 'chainlink',
  AAVE: 'aave',
  UNI: 'uniswap',
  ARB: 'arbitrum',
  BONK: 'bonk',
  JUP: 'jupiter-exchange-solana',
  PYTH: 'pyth-network',
  RAY: 'raydium',
};

interface PnLCardProps {
  period: TimePeriod;
  label: string;
  pnl: { absoluteStr: string; percentStr: string; isPositive: boolean } | null;
  isLoading: boolean;
}

function PnLCard({ period, label, pnl, isLoading }: PnLCardProps) {
  return (
    <Card className="glass-card p-5 relative overflow-hidden group">
      <div className={`absolute inset-0 bg-gradient-to-br ${pnl?.isPositive ? 'from-success/5' : pnl ? 'from-destructive/5' : 'from-primary/5'} via-transparent to-transparent transition-all`} />
      <div className="relative">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Clock className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-widest">
              {label}
            </span>
          </div>
          {pnl && !isLoading && (
            <div className={`h-6 w-6 rounded-lg flex items-center justify-center ${pnl.isPositive ? 'bg-success/15' : 'bg-destructive/15'}`}>
              {pnl.isPositive ? (
                <TrendingUp className="h-3.5 w-3.5 text-success" />
              ) : (
                <TrendingDown className="h-3.5 w-3.5 text-destructive" />
              )}
            </div>
          )}
        </div>
        
        {isLoading ? (
          <div className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4 animate-spin text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Calculating...</span>
          </div>
        ) : pnl ? (
          <div className="space-y-1">
            <p className={`text-2xl font-display font-bold ${pnl.isPositive ? 'text-success' : 'text-destructive'} tabular-nums`}>
              {pnl.percentStr}
            </p>
            <p className={`text-sm font-medium font-mono tabular-nums ${pnl.isPositive ? 'text-success/70' : 'text-destructive/70'}`}>
              {pnl.absoluteStr}
            </p>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No data</p>
        )}
      </div>
    </Card>
  );
}

export function PortfolioPnL() {
  const { connectedWallets, totalPortfolioUSD } = useWalletStore();
  const [pnlData, setPnlData] = useState<PnLType | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [lastCalculated, setLastCalculated] = useState<number | null>(null);

  const calculatePnL = useCallback(async () => {
    if (connectedWallets.length === 0) {
      setPnlData(null);
      return;
    }

    setIsLoading(true);

    try {
      const holdings: Array<{
        coingeckoId: string;
        balance: number;
        currentPrice: number;
      }> = [];

      connectedWallets.forEach((wallet) => {
        wallet.balances.forEach((token) => {
          let coingeckoId: string | undefined;

          if (!token.contractAddress) {
            coingeckoId = NATIVE_TOKEN_IDS[token.chain];
          } else if (token.chain === 'solana') {
            const info = SOLANA_TOKENS.find((t) => t.address === token.contractAddress);
            coingeckoId = info?.coingeckoId;
          } else {
            const chainTokens = EVM_TOKENS[token.chain];
            const info = chainTokens?.find(
              (t) => t.address.toLowerCase() === token.contractAddress?.toLowerCase()
            );
            coingeckoId = info?.coingeckoId;
          }

          if (!coingeckoId) {
            coingeckoId = SYMBOL_TO_COINGECKO[token.symbol.toUpperCase()];
          }

          if (coingeckoId) {
            holdings.push({
              coingeckoId,
              balance: parseFloat(token.balance) || 0,
              currentPrice: token.priceUsd || 0,
            });
          }
        });
      });

      if (holdings.length === 0) {
        setPnlData(null);
        return;
      }

      const pnl = await calculatePortfolioPnL(holdings);
      setPnlData(pnl);
      setLastCalculated(Date.now());
    } catch (error) {
      console.error('Failed to calculate P&L:', error);
    } finally {
      setIsLoading(false);
    }
  }, [connectedWallets]);

  useEffect(() => {
    calculatePnL();
    const interval = setInterval(calculatePnL, 2 * 60 * 1000);
    return () => clearInterval(interval);
  }, [calculatePnL, totalPortfolioUSD]);

  if (connectedWallets.length === 0) {
    return null;
  }

  const pnl24h = pnlData ? formatPnL(pnlData['24h']) : null;
  const pnl7d = pnlData ? formatPnL(pnlData['7d']) : null;
  const pnl30d = pnlData ? formatPnL(pnlData['30d']) : null;

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-display font-semibold text-foreground uppercase tracking-widest">
          Performance
        </h2>
        {lastCalculated && (
          <span className="text-xs text-muted-foreground font-mono">
            {new Date(lastCalculated).toLocaleTimeString()}
          </span>
        )}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <PnLCard period="24h" label="24 Hours" pnl={pnl24h} isLoading={isLoading} />
        <PnLCard period="7d" label="7 Days" pnl={pnl7d} isLoading={isLoading} />
        <PnLCard period="30d" label="30 Days" pnl={pnl30d} isLoading={isLoading} />
      </div>
    </div>
  );
}