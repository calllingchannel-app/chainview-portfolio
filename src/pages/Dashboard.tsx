import { Layout } from "@/components/Layout";
import { useWalletStore } from "@/stores/walletStore";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { WalletCard } from "@/components/wallet/WalletCard";
import { Wallet, TrendingUp, TrendingDown, Plus, Coins } from "lucide-react";
import { useState, useEffect } from "react";
import { useBalanceRefresh } from "@/hooks/useBalanceRefresh";
import { ConnectWalletDialog } from "@/components/wallet/ConnectWalletDialog";

export default function Dashboard() {
  const { connectedWallets, totalPortfolioUSD, lastUpdated } = useWalletStore();
  const { refreshAllWallets } = useBalanceRefresh(15000);
  const [showConnectDialog, setShowConnectDialog] = useState(false);
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
      <div className="min-h-screen p-6 md:p-10 gradient-bg">
        <div className="container mx-auto max-w-7xl">
          <div className="mb-12 animate-fade-in">
            <h1 className="text-6xl md:text-7xl font-bold mb-4 gradient-text tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground/80 text-lg md:text-xl">Your complete multi-chain portfolio at a glance</p>
          </div>

          {/* Total Portfolio Card */}
          <Card className="glass-card p-12 mb-10 shadow-premium hover:neon-glow transition-all duration-500 animate-slide-up relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-accent/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="relative">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-xs text-muted-foreground/70 uppercase tracking-widest font-bold">Total Portfolio Value</h2>
              </div>
              <div className="space-y-4">
                <h3 className="text-7xl md:text-8xl font-bold gradient-text tracking-tighter">
                  ${totalPortfolioUSD.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </h3>
                <div className="flex items-center gap-3">
                  {portfolioChange24h >= 0 ? (
                    <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-green-500/10 border border-green-500/20 backdrop-blur-sm">
                      <TrendingUp className="h-5 w-5 text-green-400" />
                      <span className="text-base font-bold text-green-400">
                        +{portfolioChange24h.toFixed(2)}%
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500/10 border border-red-500/20 backdrop-blur-sm">
                      <TrendingDown className="h-5 w-5 text-red-400" />
                      <span className="text-base font-bold text-red-400">
                        {portfolioChange24h.toFixed(2)}%
                      </span>
                    </div>
                  )}
                  <span className="text-base text-muted-foreground/70">Last 24 hours</span>
                </div>
              </div>
            </div>
          </Card>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <Card className="glass-card p-7 hover:neon-glow transition-all duration-500 group relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative flex items-center gap-5">
                <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center ring-2 ring-white/5 group-hover:ring-primary/30 group-hover:scale-110 transition-all duration-300">
                  <Wallet className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground/70 uppercase tracking-widest font-bold mb-2">Connected Wallets</p>
                  <p className="text-4xl font-bold text-foreground">{connectedWallets.length}</p>
                </div>
              </div>
            </Card>

            <Card className="glass-card p-7 hover:neon-glow transition-all duration-500 group relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-accent/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative flex items-center gap-5">
                <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-accent/20 to-primary/20 flex items-center justify-center ring-2 ring-white/5 group-hover:ring-accent/30 group-hover:scale-110 transition-all duration-300">
                  <TrendingUp className="h-8 w-8 text-accent" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground/70 uppercase tracking-widest font-bold mb-2">Active Assets</p>
                  <p className="text-4xl font-bold text-foreground">{totalAssets}</p>
                </div>
              </div>
            </Card>

            <Card className="glass-card p-7 hover:neon-glow transition-all duration-500 group relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-accent/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative flex items-center gap-5">
                <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-primary/20 via-accent/20 to-primary/10 flex items-center justify-center ring-2 ring-white/5 group-hover:ring-primary/30 group-hover:scale-110 transition-all duration-300">
                  <span className="text-4xl">⛓️</span>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground/70 uppercase tracking-widest font-bold mb-2">Active Chains</p>
                  <p className="text-4xl font-bold text-foreground">
                    {new Set(connectedWallets.flatMap(w => w.balances.filter(b => parseFloat(b.balance) > 0).map(b => b.chain))).size}
                  </p>
                </div>
              </div>
            </Card>
          </div>

          <div className="space-y-5">
            {connectedWallets.map((wallet, idx) => (
              <div key={wallet.id} className="animate-slide-up" style={{ animationDelay: `${idx * 100}ms` }}>
                <WalletCard wallet={wallet} />
              </div>
            ))}
          </div>
        </div>
      </div>
      <ConnectWalletDialog open={showConnectDialog} onOpenChange={setShowConnectDialog} />
    </Layout>
  );
}
