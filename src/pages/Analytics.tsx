import { useWalletStore } from "@/stores/walletStore";
import { Layout } from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";

const COLORS = ['#4ECCA3', '#3B82F6', '#8B5CF6', '#EC4899', '#F59E0B', '#10B981'];

const Analytics = () => {
  const { connectedWallets, totalPortfolioUSD } = useWalletStore();

  // Chain distribution data
  const chainData = connectedWallets.reduce((acc: any[], wallet) => {
    const existing = acc.find(item => item.name === wallet.chain);
    if (existing) {
      existing.value += wallet.totalUsdValue;
    } else {
      acc.push({
        name: wallet.chain || 'Unknown',
        value: wallet.totalUsdValue,
      });
    }
    return acc;
  }, []);

  // Token allocation data
  const allTokens = connectedWallets.flatMap(w => w.balances);
  const tokenData = allTokens.reduce((acc: any[], token) => {
    const existing = acc.find(item => item.name === token.symbol);
    if (existing) {
      existing.value += token.usdValue;
    } else {
      acc.push({
        name: token.symbol,
        value: token.usdValue,
      });
    }
    return acc;
  }, []).sort((a, b) => b.value - a.value).slice(0, 6);

  return (
    <Layout>
      <div className="min-h-screen p-6 md:p-10 gradient-bg">
        <div className="container mx-auto max-w-7xl">
          <div className="mb-12 animate-fade-in">
            <h1 className="text-6xl md:text-7xl font-bold mb-4 gradient-text tracking-tight">Analytics</h1>
            <p className="text-muted-foreground/80 text-lg md:text-xl">Visualize your portfolio distribution</p>
          </div>

          {connectedWallets.length === 0 ? (
            <Card className="stat-card p-20 text-center">
              <p className="text-muted-foreground/80 text-xl">Connect wallets to view analytics</p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Chain Distribution */}
              <Card className="stat-card animate-fade-in relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative">
                  <h2 className="text-2xl font-bold mb-6 gradient-text">Chain Distribution</h2>
                  <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={chainData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {chainData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => `$${value.toFixed(2)}`} />
                    <Legend />
                  </PieChart>
                  </ResponsiveContainer>
                </div>
              </Card>

              {/* Token Allocation */}
              <Card className="stat-card animate-fade-in relative overflow-hidden group" style={{ animationDelay: '100ms' }}>
                <div className="absolute inset-0 bg-gradient-to-br from-accent/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative">
                  <h2 className="text-2xl font-bold mb-6 gradient-text">Top 6 Token Allocation</h2>
                  <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={tokenData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {tokenData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => `$${value.toFixed(2)}`} />
                    <Legend />
                  </PieChart>
                  </ResponsiveContainer>
                </div>
              </Card>

              {/* Portfolio Summary */}
              <Card className="stat-card lg:col-span-2 animate-fade-in relative overflow-hidden group" style={{ animationDelay: '200ms' }}>
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-accent/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative">
                  <h2 className="text-2xl font-bold mb-8 gradient-text">Portfolio Summary</h2>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    <div className="space-y-2">
                      <p className="text-xs text-muted-foreground/70 uppercase tracking-widest font-bold">Total Value</p>
                      <p className="text-3xl font-bold gradient-text">
                        ${totalPortfolioUSD.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-xs text-muted-foreground/70 uppercase tracking-widest font-bold">Wallets</p>
                      <p className="text-3xl font-bold text-foreground">{connectedWallets.length}</p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-xs text-muted-foreground/70 uppercase tracking-widest font-bold">Chains</p>
                      <p className="text-3xl font-bold text-foreground">{chainData.length}</p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-xs text-muted-foreground/70 uppercase tracking-widest font-bold">Assets</p>
                      <p className="text-3xl font-bold text-foreground">{allTokens.length}</p>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Analytics;
