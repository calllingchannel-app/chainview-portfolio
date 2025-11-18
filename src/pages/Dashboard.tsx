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

  return (
    <Layout>
      <div className="min-h-screen bg-background p-6">
        <div className="container mx-auto max-w-7xl">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2">Dashboard</h1>
            <p className="text-muted-foreground">Track your crypto portfolio across all chains</p>
          </div>

          {/* Total Portfolio Card */}
          <Card className="glass-card p-8 mb-8 neon-glow">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm text-muted-foreground">Total Balance</h2>
            </div>
            <div className="space-y-2">
              <h3 className="text-5xl font-bold gradient-text">
                ${totalPortfolioUSD.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </h3>
              <div className="flex items-center gap-2">
                {portfolioChange24h >= 0 ? (
                  <TrendingUp className="h-4 w-4 text-green-500" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-500" />
                )}
                <span className={`text-sm font-medium ${portfolioChange24h >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {portfolioChange24h >= 0 ? '+' : ''}{portfolioChange24h.toFixed(2)}% (24h)
                </span>
              </div>
            </div>
          </Card>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card className="glass-card p-6">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-lg bg-primary/20 flex items-center justify-center">
                  <Wallet className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Connected Wallets</p>
                  <p className="text-2xl font-bold">{connectedWallets.length}</p>
                </div>
              </div>
            </Card>

            <Card className="glass-card p-6">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-lg bg-primary/20 flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Assets</p>
                  <p className="text-2xl font-bold">
                    {connectedWallets.reduce((sum, w) => sum + w.balances.length, 0)}
                  </p>
                </div>
              </div>
            </Card>

            <Card className="glass-card p-6">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-lg bg-primary/20 flex items-center justify-center">
                  <span className="text-2xl">⛓️</span>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Active Chains</p>
                  <p className="text-2xl font-bold">
                    {new Set(connectedWallets.flatMap(w => w.balances.map(b => b.chain))).size}
                  </p>
                </div>
              </div>
            </Card>
          </div>

          {/* Wallets Section */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-6">Your Wallets</h2>
            {connectedWallets.length === 0 ? (
              <Card className="glass-card p-12 text-center">
                <Wallet className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-xl font-semibold mb-2">No Wallets Connected</h3>
                <p className="text-muted-foreground mb-6">
                  Connect your first wallet to start tracking your portfolio
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
