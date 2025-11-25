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
      <div className="min-h-screen p-4 md:p-8 gradient-bg">
        <div className="container mx-auto max-w-7xl">
        <div className="mb-10 animate-fade-in">
          <h1 className="text-5xl md:text-6xl font-bold mb-4 gradient-text">Portfolio</h1>
          <p className="text-muted-foreground/90 text-base md:text-lg">All your tokens across connected wallets</p>
        </div>

        {/* Filters */}
        <div className="mb-8 flex flex-col sm:flex-row gap-4 animate-slide-up">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Search tokens by name or symbol..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 h-12 bg-card/40 backdrop-blur-xl border-border/40 rounded-xl focus:border-primary/50 transition-all"
            />
          </div>

          <div className="flex gap-2 overflow-x-auto pb-2">
            {chains.map(chain => (
              <Badge
                key={chain}
                variant={selectedChain === chain ? "default" : "outline"}
                className={`cursor-pointer whitespace-nowrap px-4 py-2 rounded-xl transition-all duration-300 ${
                  selectedChain === chain 
                    ? "bg-gradient-to-r from-primary to-accent text-white shadow-glow border-transparent" 
                    : "bg-card/40 backdrop-blur-xl hover:border-primary/50"
                }`}
                onClick={() => setSelectedChain(chain)}
              >
                {chain === "all" ? "All Chains" : chain}
              </Badge>
            ))}
          </div>
        </div>

        {/* Token List */}
        {sortedTokens.length === 0 ? (
          <Card className="stat-card p-16 text-center">
            <p className="text-muted-foreground/90 text-lg">
              {connectedWallets.length === 0 
                ? "Connect a wallet to see your portfolio"
                : "No tokens found matching your filters"}
            </p>
          </Card>
        ) : (
          <div className="space-y-3">
            {sortedTokens.map((token, idx) => (
              <Card 
                key={`${token.contractAddress}-${idx}`} 
                className="stat-card p-5 hover:neon-glow cursor-pointer group animate-fade-in"
                style={{ animationDelay: `${idx * 50}ms` }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-5 flex-1">
                    <div className="relative">
                      <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-accent/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                      <div className="relative h-14 w-14 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                        <span className="font-bold text-xl text-primary">{token.symbol.charAt(0)}</span>
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="font-bold text-lg">{token.symbol}</h3>
                        <Badge variant="outline" className="text-xs bg-card/50 border-border/40">
                          {token.chain}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground/90 mb-1">{token.name}</p>
                      <p className="text-xs text-muted-foreground/70">Wallet: {token.walletName}</p>
                    </div>
                  </div>

                  <div className="text-right space-y-1">
                    <p className="font-bold text-xl gradient-text">
                      ${token.usdValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                    <p className="text-sm text-muted-foreground/90 font-medium">
                      {parseFloat(token.balance).toFixed(4)} {token.symbol}
                    </p>
                    <p className="text-xs text-muted-foreground/70">
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
