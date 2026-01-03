import { Layout } from "@/components/Layout";
import { useWalletStore } from "@/stores/walletStore";
import { Card } from "@/components/ui/card";
import { WalletCard } from "@/components/wallet/WalletCard";
import { Wallet, TrendingUp, Layers, Plus, RefreshCw } from "lucide-react";
import { useState, useEffect } from "react";
import { useBalanceRefresh } from "@/hooks/useBalanceRefresh";
import { ConnectWalletDialog } from "@/components/wallet/ConnectWalletDialog";
import { Button } from "@/components/ui/button";
import { PortfolioPnL } from "@/components/dashboard/PortfolioPnL";

export default function Dashboard() {
  const { connectedWallets, totalPortfolioUSD, lastUpdated } = useWalletStore();
  const { refreshAllWallets } = useBalanceRefresh(12000); // 12 second refresh
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showConnectDialog, setShowConnectDialog] = useState(false);

  useEffect(() => {
    const total = connectedWallets.reduce((sum, wallet) => sum + wallet.totalUsdValue, 0);
    useWalletStore.getState().setTotalPortfolioUSD(total);
  }, [connectedWallets]);

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
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8 lg:mb-10">
            <div className="animate-fade-in">
              <p className="text-xs font-semibold text-primary uppercase tracking-wider mb-2">Portfolio Overview</p>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground tracking-tight">Dashboard</h1>
            </div>
            
            {connectedWallets.length > 0 && (
              <div className="flex items-center gap-2 animate-fade-in" style={{ animationDelay: '100ms' }}>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    setIsRefreshing(true);
                    await refreshAllWallets();
                    setIsRefreshing(false);
                  }}
                  disabled={isRefreshing}
                  className="h-9 px-3 rounded-lg border-border/50 hover:bg-muted/50"
                >
                  <RefreshCw className={`h-4 w-4 mr-1.5 ${isRefreshing ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
                <Button
                  size="sm"
                  onClick={() => setShowConnectDialog(true)}
                  className="h-9 px-3 rounded-lg bg-primary hover:bg-primary/90 shadow-glow"
                >
                  <Plus className="h-4 w-4 mr-1.5" />
                  Add Wallet
                </Button>
              </div>
            )}
          </div>

          {/* Portfolio Value Card */}
          <Card className="glass-card p-6 sm:p-8 mb-6 animate-slide-up overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
            <div className="relative">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Total Portfolio Value</p>
                  {lastUpdated && (
                    <p className="text-xs text-muted-foreground/60">
                      Updated {new Date(lastUpdated).toLocaleTimeString()}
                    </p>
                  )}
                </div>
              </div>
              
              <h3 className="text-4xl sm:text-5xl lg:text-6xl font-bold gradient-text tracking-tight">
                ${totalPortfolioUSD.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </h3>
            </div>
          </Card>

          {/* P&L Analytics */}
          {connectedWallets.length > 0 && (
            <div className="mb-6">
              <PortfolioPnL />
            </div>
          )}

          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            <Card className="stat-card animate-fade-in" style={{ animationDelay: '100ms' }}>
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                  <Wallet className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-0.5">Wallets</p>
                  <p className="text-2xl font-bold text-foreground">{connectedWallets.length}</p>
                </div>
              </div>
            </Card>

            <Card className="stat-card animate-fade-in" style={{ animationDelay: '150ms' }}>
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-xl bg-success/10 border border-success/20 flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-success" />
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-0.5">Assets</p>
                  <p className="text-2xl font-bold text-foreground">{totalAssets}</p>
                </div>
              </div>
            </Card>

            <Card className="stat-card animate-fade-in" style={{ animationDelay: '200ms' }}>
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center">
                  <Layers className="h-5 w-5 text-accent" />
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-0.5">Chains</p>
                  <p className="text-2xl font-bold text-foreground">{activeChains}</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Wallet Cards */}
          {connectedWallets.length === 0 ? (
            <Card className="stat-card p-12 lg:p-16 text-center animate-fade-in">
              <div className="max-w-sm mx-auto">
                <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 border border-primary/20 flex items-center justify-center mx-auto mb-6">
                  <Wallet className="h-7 w-7 text-primary" />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-2">No wallets connected</h3>
                <p className="text-sm text-muted-foreground mb-6">
                  Connect your first wallet to start tracking your portfolio in real-time
                </p>
                <Button
                  onClick={() => setShowConnectDialog(true)}
                  className="bg-primary hover:bg-primary/90 shadow-glow hover:shadow-glow-lg transition-all"
                >
                  <Wallet className="h-4 w-4 mr-2" />
                  Connect Wallet
                </Button>
              </div>
            </Card>
          ) : (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-foreground mb-4 animate-fade-in">Connected Wallets</h2>
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
