import { useWalletStore } from "@/stores/walletStore";
import { Layout } from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { BarChart3 } from "lucide-react";

const COLORS = ['hsl(262, 83%, 58%)', 'hsl(330, 80%, 60%)', 'hsl(217, 91%, 60%)', 'hsl(160, 84%, 39%)', 'hsl(38, 92%, 50%)', 'hsl(180, 70%, 50%)'];

const Analytics = () => {
  const { connectedWallets, totalPortfolioUSD } = useWalletStore();

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

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card/95 backdrop-blur-xl border border-border/50 rounded-lg p-3 shadow-lg">
          <p className="text-sm font-medium text-foreground">{payload[0].name}</p>
          <p className="text-sm text-primary font-semibold">
            ${payload[0].value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <Layout>
      <div className="min-h-screen p-4 sm:p-6 lg:p-8 gradient-bg">
        <div className="container mx-auto max-w-6xl">
          {/* Header */}
          <div className="mb-8 animate-fade-in">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-2 gradient-text tracking-tight">Analytics</h1>
            <p className="text-sm sm:text-base text-muted-foreground">Visualize your portfolio distribution</p>
          </div>

          {connectedWallets.length === 0 ? (
            <Card className="stat-card p-12 lg:p-16 text-center">
              <div className="h-14 w-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-4">
                <BarChart3 className="h-6 w-6 text-primary" />
              </div>
              <p className="text-lg font-medium text-foreground mb-2">No data to display</p>
              <p className="text-sm text-muted-foreground">Connect wallets to view analytics</p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
              {/* Chain Distribution */}
              <Card className="stat-card animate-fade-in">
                <h2 className="text-lg font-semibold mb-4 text-foreground">Chain Distribution</h2>
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie
                      data={chainData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={90}
                      innerRadius={50}
                      fill="#8884d8"
                      dataKey="value"
                      strokeWidth={0}
                    >
                      {chainData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                    <Legend 
                      wrapperStyle={{ fontSize: '12px' }}
                      formatter={(value) => <span className="text-muted-foreground">{value}</span>}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </Card>

              {/* Token Allocation */}
              <Card className="stat-card animate-fade-in" style={{ animationDelay: '100ms' }}>
                <h2 className="text-lg font-semibold mb-4 text-foreground">Top Token Allocation</h2>
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie
                      data={tokenData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={90}
                      innerRadius={50}
                      fill="#8884d8"
                      dataKey="value"
                      strokeWidth={0}
                    >
                      {tokenData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                    <Legend 
                      wrapperStyle={{ fontSize: '12px' }}
                      formatter={(value) => <span className="text-muted-foreground">{value}</span>}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </Card>

              {/* Portfolio Summary */}
              <Card className="stat-card lg:col-span-2 animate-fade-in" style={{ animationDelay: '200ms' }}>
                <h2 className="text-lg font-semibold mb-6 text-foreground">Portfolio Summary</h2>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 lg:gap-6">
                  <div className="p-4 rounded-xl bg-card/50 border border-border/30">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Total Value</p>
                    <p className="text-xl sm:text-2xl font-bold gradient-text">
                      ${totalPortfolioUSD.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div className="p-4 rounded-xl bg-card/50 border border-border/30">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Wallets</p>
                    <p className="text-xl sm:text-2xl font-bold text-foreground">{connectedWallets.length}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-card/50 border border-border/30">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Chains</p>
                    <p className="text-xl sm:text-2xl font-bold text-foreground">{chainData.length}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-card/50 border border-border/30">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Assets</p>
                    <p className="text-xl sm:text-2xl font-bold text-foreground">{allTokens.length}</p>
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