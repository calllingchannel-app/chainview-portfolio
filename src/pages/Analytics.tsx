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
      <div className="min-h-screen bg-background p-6">
        <div className="container mx-auto max-w-7xl">
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2">Analytics</h1>
            <p className="text-muted-foreground">Visualize your portfolio distribution</p>
          </div>

          {connectedWallets.length === 0 ? (
            <Card className="glass-card p-12 text-center">
              <p className="text-muted-foreground">Connect wallets to view analytics</p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Chain Distribution */}
              <Card className="glass-card p-6">
                <h2 className="text-xl font-semibold mb-4">Chain Distribution</h2>
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
              </Card>

              {/* Token Allocation */}
              <Card className="glass-card p-6">
                <h2 className="text-xl font-semibold mb-4">Top 6 Token Allocation</h2>
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
              </Card>

              {/* Portfolio Summary */}
              <Card className="glass-card p-6 lg:col-span-2">
                <h2 className="text-xl font-semibold mb-4">Portfolio Summary</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Total Value</p>
                    <p className="text-2xl font-bold gradient-text">
                      ${totalPortfolioUSD.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Wallets</p>
                    <p className="text-2xl font-bold">{connectedWallets.length}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Chains</p>
                    <p className="text-2xl font-bold">{chainData.length}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Assets</p>
                    <p className="text-2xl font-bold">{allTokens.length}</p>
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
