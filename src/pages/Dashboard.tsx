import { useEffect, useState } from "react";
import { useWalletStore } from "@/stores/walletStore";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Wallet, TrendingUp, TrendingDown, RefreshCw } from "lucide-react";
import { ConnectWalletDialog } from "@/components/wallet/ConnectWalletDialog";
import { WalletCard } from "@/components/wallet/WalletCard";
import { formatCurrency } from "@/lib/utils";

const Dashboard = () => {
  const { connectedWallets, totalPortfolioUSD, isLoading, lastUpdated } = useWalletStore();
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

  const handleRefresh = () => {
    useWalletStore.getState().setLastUpdated(Date.now());
    // In production, this would trigger balance refresh
  };

  return (
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
            <div className="flex items-center gap-2">
              <h2 className="text-sm text-muted-foreground">Total Balance</h2>
              {lastUpdated && (
                <span className="text-xs text-muted-foreground">
                  Updated {new Date(lastUpdated).toLocaleTimeString()}
                </span>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRefresh}
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>

          <div className="flex items-end gap-4 mb-2">
            <h3 className="text-5xl font-bold gradient-text">
              ${totalPortfolioUSD.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h3>
            {portfolioChange24h !== 0 && (
              <div className={`flex items-center gap-1 pb-2 ${portfolioChange24h > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {portfolioChange24h > 0 ? <TrendingUp className="h-5 w-5" /> : <TrendingDown className="h-5 w-5" />}
                <span className="text-lg font-semibold">
                  {portfolioChange24h > 0 ? '+' : ''}{portfolioChange24h.toFixed(2)}%
                </span>
              </div>
            )}
          </div>

          <p className="text-sm text-muted-foreground">
            {connectedWallets.length} {connectedWallets.length === 1 ? 'wallet' : 'wallets'} connected
          </p>
        </Card>

        {/* Wallets Section */}
        {connectedWallets.length === 0 ? (
          <Card className="glass-card p-12 text-center">
            <div className="flex flex-col items-center gap-4 max-w-md mx-auto">
              <div className="h-16 w-16 rounded-full bg-primary/20 flex items-center justify-center">
                <Wallet className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">No Wallets Connected</h3>
                <p className="text-muted-foreground mb-4">
                  Connect your first wallet to start tracking your crypto portfolio
                </p>
              </div>
              <Button
                onClick={() => setShowConnectDialog(true)}
                className="bg-primary text-primary-foreground hover:bg-primary/90 neon-glow"
              >
                <Wallet className="mr-2 h-4 w-4" />
                Connect Wallet
              </Button>
            </div>
          </Card>
        ) : (
          <>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-semibold">Your Wallets</h2>
              <Button
                onClick={() => setShowConnectDialog(true)}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                <Wallet className="mr-2 h-4 w-4" />
                Add Wallet
              </Button>
            </div>

            <div className="grid gap-4">
              {connectedWallets.map((wallet) => (
                <WalletCard key={wallet.id} wallet={wallet} />
              ))}
            </div>
          </>
        )}
      </div>

      <ConnectWalletDialog open={showConnectDialog} onOpenChange={setShowConnectDialog} />
    </div>
  );
};

export default Dashboard;
