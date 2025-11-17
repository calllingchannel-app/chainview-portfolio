import { useWalletStore } from "@/stores/walletStore";
import { Layout } from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { useState } from "react";

const Portfolio = () => {
  const { connectedWallets } = useWalletStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedChain, setSelectedChain] = useState<string>("all");

  // Aggregate all tokens from all wallets
  const allTokens = connectedWallets.flatMap(wallet => 
    wallet.balances.map(token => ({
      ...token,
      walletAddress: wallet.address,
      walletName: wallet.name,
    }))
  );

  // Get unique chains
  const chains = ["all", ...Array.from(new Set(allTokens.map(t => t.chain)))];

  // Filter tokens
  const filteredTokens = allTokens.filter(token => {
    const matchesSearch = token.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         token.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesChain = selectedChain === "all" || token.chain === selectedChain;
    return matchesSearch && matchesChain;
  });

  // Sort by USD value
  const sortedTokens = [...filteredTokens].sort((a, b) => b.usdValue - a.usdValue);

  return (
    <Layout>
      <div className="min-h-screen bg-background p-6">
        <div className="container mx-auto max-w-7xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Portfolio</h1>
          <p className="text-muted-foreground">All your tokens across connected wallets</p>
        </div>

        {/* Filters */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search tokens..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-secondary border-border"
            />
          </div>

          <div className="flex gap-2 overflow-x-auto pb-2">
            {chains.map(chain => (
              <Badge
                key={chain}
                variant={selectedChain === chain ? "default" : "outline"}
                className="cursor-pointer whitespace-nowrap"
                onClick={() => setSelectedChain(chain)}
              >
                {chain === "all" ? "All Chains" : chain}
              </Badge>
            ))}
          </div>
        </div>

        {/* Token List */}
        {sortedTokens.length === 0 ? (
          <Card className="glass-card p-12 text-center">
            <p className="text-muted-foreground">
              {connectedWallets.length === 0 
                ? "Connect a wallet to see your portfolio"
                : "No tokens found matching your filters"}
            </p>
          </Card>
        ) : (
          <div className="space-y-2">
            {sortedTokens.map((token, idx) => (
              <Card key={`${token.contractAddress}-${idx}`} className="glass-card p-4 hover:neon-glow transition-all">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center">
                      <span className="font-bold text-primary">{token.symbol.charAt(0)}</span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{token.symbol}</h3>
                        <Badge variant="outline" className="text-xs">
                          {token.chain}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{token.name}</p>
                      <p className="text-xs text-muted-foreground">From: {token.walletName}</p>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="font-semibold gradient-text">
                      ${token.usdValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {parseFloat(token.balance).toFixed(4)} {token.symbol}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      @ ${token.priceUsd.toFixed(2)}
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
        </div>
      </div>
    </Layout>
  );
};

export default Portfolio;
