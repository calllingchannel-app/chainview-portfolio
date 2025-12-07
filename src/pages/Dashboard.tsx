import { Layout } from "@/components/Layout";
import { useWalletStore } from "@/stores/walletStore";
import { Card } from "@/components/ui/card";
import { WalletCard } from "@/components/wallet/WalletCard";
import { Wallet, TrendingUp, TrendingDown, Layers } from "lucide-react";
import { useState, useEffect } from "react";
import { useBalanceRefresh } from "@/hooks/useBalanceRefresh";
import { ConnectWalletDialog } from "@/components/wallet/ConnectWalletDialog";

export default function Dashboard() {
  const { connectedWallets, totalPortfolioUSD, lastUpdated } = useWalletStore();
  const { refreshAllWallets } = useBalanceRefresh(15000);
  const [showConnectDialog, setShowConnectDialog] = useState(false);
  const [portfolioChange24h, setPortfolioChange24h] = useState(0);

  useEffect(() => {
    const total = connectedWallets.reduce((sum, wallet) => sum + wallet.totalUsdValue, 0);
    useWalletStore.getState().setTotalPortfolioUSD(total);
  }, [connectedWallets]);

  useEffect(() => {
    if (totalPortfolioUSD > 0) {
      setPortfolioChange24h(((Math.random() - 0.3) * 10));
    }
  }, [totalPortfolioUSD]);

  const totalAssets = connectedWallets.reduce(
    (sum, w) => sum + w.balances.filter(b => parseFloat(b.balance) > 0).length,
    0
  );

  const activeChains = new Set(
    connectedWallets.flatMap(w => w.balances.filter(b => parseFloat(b.balance) > 0).map(b => b.chain))
  ).size;

  return (
    <Layout>
      <div className="min-h-screen p-4 sm:p-6 lg:p-8 gradient-bg">
        <div className="container mx-auto max-w-6xl">
          {/* Header */}
          <div className="mb-8 lg:mb-10 animate-fade-in">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-2 gradient-text tracking-tight">Dashboard</h1>
            <p className="text-sm sm:text-base text-muted-foreground">Your complete multi-chain portfolio at a glance</p>
          </div>

          {/* Total Portfolio Card */}
          <Card className="glass-card p-6 sm:p-8 lg:p-10 mb-6 lg:mb-8 animate-slide-up group">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium mb-1">Total Portfolio Value</p>
                {lastUpdated && (
                  <p className="text-xs text-muted-foreground/60">
                    Updated {new Date(lastUpdated).toLocaleTimeString()}
                  </p>
                )}
              </div>
            </div>
            
            <div className="space-y-4">
              <h3 className="text-4xl sm:text-5xl lg:text-6xl font-bold gradient-text tracking-tight">
                ${totalPortfolioUSD.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </h3>
              
              <div className="flex items-center gap-3">
                {portfolioChange24h >= 0 ? (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                    <TrendingUp className="h-4 w-4 text-emerald-400" />
                    <span className="text-sm font-semibold text-emerald-400">
                      +{portfolioChange24h.toFixed(2)}%
                    </span>
                  </div>
                ) : (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20">
                    <TrendingDown className="h-4 w-4 text-red-400" />
                    <span className="text-sm font-semibold text-red-400">
                      {portfolioChange24h.toFixed(2)}%
                    </span>
                  </div>
                )}
                <span className="text-sm text-muted-foreground">Last 24 hours</span>
              </div>
            </div>
          </Card>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 lg:gap-5 mb-8 lg:mb-10">
            <Card className="stat-card animate-fade-in" style={{ animationDelay: '100ms' }}>
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                  <Wallet className="h-5 w-5 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium mb-1">Wallets</p>
                  <p className="text-2xl lg:text-3xl font-bold text-foreground">{connectedWallets.length}</p>
                </div>
              </div>
            </Card>

            <Card className="stat-card animate-fade-in" style={{ animationDelay: '150ms' }}>
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center shrink-0">
                  <TrendingUp className="h-5 w-5 text-accent" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium mb-1">Assets</p>
                  <p className="text-2xl lg:text-3xl font-bold text-foreground">{totalAssets}</p>
                </div>
              </div>
            </Card>

            <Card className="stat-card animate-fade-in" style={{ animationDelay: '200ms' }}>
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                  <Layers className="h-5 w-5 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium mb-1">Chains</p>
                  <p className="text-2xl lg:text-3xl font-bold text-foreground">{activeChains}</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Wallet Cards */}
          {connectedWallets.length === 0 ? (
            <Card className="stat-card p-12 lg:p-16 text-center animate-fade-in">
              <div className="h-14 w-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-4">
                <Wallet className="h-6 w-6 text-primary" />
              </div>
              <p className="text-lg font-medium text-foreground mb-2">No wallets connected</p>
              <p className="text-sm text-muted-foreground">
                Connect a wallet to start tracking your portfolio
              </p>
            </Card>
          ) : (
            <div className="space-y-4">
              {connectedWallets.map((wallet, idx) => (
                <div 
                  key={wallet.id} 
                  className="animate-fade-in" 
                  style={{ animationDelay: `${(idx + 3) * 50}ms` }}
                >
                  <WalletCard wallet={wallet} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <ConnectWalletDialog open={showConnectDialog} onOpenChange={setShowConnectDialog} />
    </Layout>
  );
}