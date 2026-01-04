import { Layout } from "@/components/Layout";
import { useWalletStore } from "@/stores/walletStore";
import { Card } from "@/components/ui/card";
import { WalletCard } from "@/components/wallet/WalletCard";
import { Wallet, TrendingUp, Layers, Plus, RefreshCw, Activity } from "lucide-react";
import { useState, useEffect } from "react";
import { useBalanceRefresh } from "@/hooks/useBalanceRefresh";
import { ConnectWalletDialog } from "@/components/wallet/ConnectWalletDialog";
import { Button } from "@/components/ui/button";
import { PortfolioPnL } from "@/components/dashboard/PortfolioPnL";

export default function Dashboard() {
  const { connectedWallets, totalPortfolioUSD, lastUpdated } = useWalletStore();
  const { refreshAllWallets } = useBalanceRefresh(12000);
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
        <div className="container mx-auto max-w-7xl">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8 lg:mb-10">
            <div className="animate-fade-in">
              <div className="flex items-center gap-2 mb-2">
                <div className="h-6 w-6 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
                  <Activity className="h-3 w-3 text-primary" />
                </div>
                <p className="text-xs font-semibold text-primary uppercase tracking-widest">Live Portfolio</p>
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold text-foreground tracking-tight">Dashboard</h1>
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
                  className="h-10 px-4 rounded-xl border-border/60 bg-card/50 hover:bg-card/80 backdrop-blur-sm"
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
                <Button
                  size="sm"
                  onClick={() => setShowConnectDialog(true)}
                  className="h-10 px-4 rounded-xl bg-primary hover:bg-primary/90 shadow-glow"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Wallet
                </Button>
              </div>
            )}
          </div>

          {/* Portfolio Value Card */}
          <Card className="glass-card p-6 sm:p-8 lg:p-10 mb-6 animate-slide-up overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/8 via-transparent to-accent/5" />
            <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-primary/5 to-transparent" />
            <div className="relative">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest mb-1">Total Portfolio Value</p>
                  {lastUpdated && (
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
                      <p className="text-xs text-muted-foreground">
                        Updated {new Date(lastUpdated).toLocaleTimeString()}
                      </p>
                    </div>
                  )}
                </div>
                <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted/30 border border-border/30">
                  <span className="text-xs text-muted-foreground">USD</span>
                </div>
              </div>
              
              <h3 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-display font-bold gradient-text tracking-tight font-mono tabular-nums">
                ${totalPortfolioUSD.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </h3>
            </div>
          </Card>

          {/* P&L Analytics */}
          {connectedWallets.length > 0 && (
            <div className="mb-6 animate-fade-in" style={{ animationDelay: '150ms' }}>
              <PortfolioPnL />
            </div>
          )}

          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            <Card className="stat-card animate-fade-in" style={{ animationDelay: '100ms' }}>
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                  <Wallet className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Connected</p>
                  <p className="text-3xl font-display font-bold text-foreground">{connectedWallets.length}</p>
                  <p className="text-xs text-muted-foreground">Wallets</p>
                </div>
              </div>
            </Card>

            <Card className="stat-card animate-fade-in" style={{ animationDelay: '150ms' }}>
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 rounded-2xl bg-success/10 border border-success/20 flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-success" />
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Total</p>
                  <p className="text-3xl font-display font-bold text-foreground">{totalAssets}</p>
                  <p className="text-xs text-muted-foreground">Assets</p>
                </div>
              </div>
            </Card>

            <Card className="stat-card animate-fade-in" style={{ animationDelay: '200ms' }}>
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center">
                  <Layers className="h-6 w-6 text-accent" />
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Active</p>
                  <p className="text-3xl font-display font-bold text-foreground">{activeChains}</p>
                  <p className="text-xs text-muted-foreground">Chains</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Wallet Cards */}
          {connectedWallets.length === 0 ? (
            <Card className="stat-card p-12 lg:p-20 text-center animate-fade-in">
              <div className="max-w-md mx-auto">
                <div className="h-20 w-20 rounded-3xl bg-gradient-to-br from-primary/20 via-primary/10 to-accent/20 border border-primary/20 flex items-center justify-center mx-auto mb-8 animate-float">
                  <Wallet className="h-9 w-9 text-primary" />
                </div>
                <h3 className="text-2xl font-display font-bold text-foreground mb-3">No wallets connected</h3>
                <p className="text-sm text-muted-foreground mb-8 leading-relaxed">
                  Connect your first wallet to start tracking your portfolio across multiple chains in real-time
                </p>
                <Button
                  onClick={() => setShowConnectDialog(true)}
                  size="lg"
                  className="bg-primary hover:bg-primary/90 shadow-glow hover:shadow-glow-lg transition-all px-8"
                >
                  <Wallet className="h-5 w-5 mr-2" />
                  Connect Wallet
                </Button>
              </div>
            </Card>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-lg font-display font-semibold text-foreground">Connected Wallets</h2>
                <span className="text-xs text-muted-foreground">{connectedWallets.length} wallet{connectedWallets.length !== 1 ? 's' : ''}</span>
              </div>
              <div className="grid gap-4 lg:grid-cols-2">
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
            </div>
          )}
        </div>
      </div>
      <ConnectWalletDialog open={showConnectDialog} onOpenChange={setShowConnectDialog} />
    </Layout>
  );
}