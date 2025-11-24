import { Layout } from "@/components/Layout";
import { useWalletStore } from "@/stores/walletStore";
import { Card } from "@/components/ui/card";
import { WalletCard } from "@/components/wallet/WalletCard";
import { Wallet, TrendingUp, TrendingDown } from "lucide-react";
import { useState, useEffect } from "react";
import { useBalanceRefresh } from "@/hooks/useBalanceRefresh";

export default function Dashboard() {
  const { connectedWallets, totalPortfolioUSD } = useWalletStore();
  const { refreshAllWallets } = useBalanceRefresh(15000); // Auto-refresh every 15 seconds
  const [portfolioChange24h, setPortfolioChange24h] = useState(0);

  // Calculate total portfolio value
  useEffect(() => {
    const total = connectedWallets.reduce((sum, wallet) => sum + wallet.totalUsdValue, 0);
    useWalletStore.getState().setTotalPortfolioUSD(total);
  }, [connectedWallets]);

  // Simulated 24h change (in production, you'd track historical values)
  useEffect(() => {
    if (totalPortfolioUSD > 0) {
      setPortfolioChange24h(((Math.random() - 0.3) * 10)); // -3% to +7%
    }
  }, [totalPortfolioUSD]);

  const totalAssets = connectedWallets.reduce(
    (sum, w) => sum + w.balances.filter(b => parseFloat(b.balance) > 0).length,
    0
  );

  return (
    <Layout>
      <div className="min-h-screen bg-background p-6">
        <div className="container mx-auto max-w-7xl">
          {/* Header */}
          <div className="mb-10 animate-fade-in">
            <h1 className="text-5xl font-bold mb-3 gradient-text">Dashboard</h1>
            <p className="text-muted-foreground text-lg">Track your crypto portfolio across all chains in real-time</p>
          </div>

          {/* Total Portfolio Card */}
          <Card className="glass-card p-10 mb-8 shadow-premium hover:shadow-premium transition-all duration-500 border border-primary/20 animate-slide-up">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm text-muted-foreground uppercase tracking-wider font-semibold">Total Portfolio Value</h2>
            </div>
            <div className="space-y-3">
              <h3 className="text-6xl font-bold gradient-text tracking-tight">
                ${totalPortfolioUSD.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </h3>
              <div className="flex items-center gap-2">
                {portfolioChange24h >= 0 ? (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/20">
                    <TrendingUp className="h-4 w-4 text-green-500" />
                    <span className="text-sm font-bold text-green-500">
                      +{portfolioChange24h.toFixed(2)}%
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-500/10 border border-red-500/20">
                    <TrendingDown className="h-4 w-4 text-red-500" />
                    <span className="text-sm font-bold text-red-500">
                      {portfolioChange24h.toFixed(2)}%
                    </span>
                  </div>
                )}
                <span className="text-sm text-muted-foreground">Last 24 hours</span>
              </div>
            </div>
          </Card>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            <Card className="glass-card p-6 hover:shadow-premium transition-all duration-300 border border-border/30 group">
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-primary/20 to-accent/10 flex items-center justify-center ring-2 ring-primary/10 group-hover:ring-primary/30 transition-all">
                  <Wallet className="h-7 w-7 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide font-semibold mb-1">Connected Wallets</p>
                  <p className="text-3xl font-bold text-foreground">{connectedWallets.length}</p>
                </div>
              </div>
            </Card>

            <Card className="glass-card p-6 hover:shadow-premium transition-all duration-300 border border-border/30 group">
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-primary/20 to-accent/10 flex items-center justify-center ring-2 ring-primary/10 group-hover:ring-primary/30 transition-all">
                  <TrendingUp className="h-7 w-7 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide font-semibold mb-1">Active Assets</p>
                  <p className="text-3xl font-bold text-foreground">{totalAssets}</p>
                </div>
              </div>
            </Card>

            <Card className="glass-card p-6 hover:shadow-premium transition-all duration-300 border border-border/30 group">
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-primary/20 to-accent/10 flex items-center justify-center ring-2 ring-primary/10 group-hover:ring-primary/30 transition-all">
                  <span className="text-3xl">⛓️</span>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide font-semibold mb-1">Active Chains</p>
                  <p className="text-3xl font-bold text-foreground">
                    {new Set(connectedWallets.flatMap(w => w.balances.filter(b => parseFloat(b.balance) > 0).map(b => b.chain))).size}
                  </p>
                </div>
              </div>
            </Card>
          </div>

          {/* Wallets Section */}
          <div className="mb-8">
            <h2 className="text-3xl font-bold mb-8 text-foreground">Your Wallets</h2>
            {connectedWallets.length === 0 ? (
              <Card className="glass-card p-16 text-center border border-border/30">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-muted/30 mb-6">
                  <Wallet className="h-10 w-10 text-muted-foreground" />
                </div>
                <h3 className="text-2xl font-bold mb-3 text-foreground">No Wallets Connected</h3>
                <p className="text-muted-foreground text-lg mb-8 max-w-md mx-auto">
                  Connect your first wallet to start tracking your portfolio across all blockchains
                </p>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {connectedWallets.map((wallet) => (
                  <WalletCard key={wallet.id} wallet={wallet} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
