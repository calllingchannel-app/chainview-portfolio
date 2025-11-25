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
      <div className="min-h-screen p-6 md:p-10 gradient-bg">
        <div className="container mx-auto max-w-7xl">
        <div className="mb-12 animate-fade-in">
          <h1 className="text-6xl md:text-7xl font-bold mb-4 gradient-text tracking-tight">Portfolio</h1>
          <p className="text-muted-foreground/80 text-lg md:text-xl">All your tokens across connected wallets</p>
        </div>

        {/* Filters */}
        <div className="mb-10 flex flex-col sm:flex-row gap-4 animate-slide-up">
          <div className="relative flex-1">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground/70" />
            <Input
              placeholder="Search tokens by name or symbol..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-14 h-14 bg-card/50 backdrop-blur-2xl border-white/5 rounded-2xl focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all text-base"
            />
          </div>

          <div className="flex gap-3 overflow-x-auto pb-2">
            {chains.map(chain => (
              <Badge
                key={chain}
                variant={selectedChain === chain ? "default" : "outline"}
                className={`cursor-pointer whitespace-nowrap px-5 py-2.5 rounded-xl transition-all duration-300 font-semibold ${
                  selectedChain === chain 
                    ? "bg-gradient-to-r from-primary to-accent text-white shadow-glow border-transparent scale-105" 
                    : "bg-card/50 backdrop-blur-2xl border-white/5 hover:border-primary/50 hover:bg-card/70"
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
          <Card className="stat-card p-20 text-center">
            <p className="text-muted-foreground/80 text-xl">
              {connectedWallets.length === 0 
                ? "Connect a wallet to see your portfolio"
                : "No tokens found matching your filters"}
            </p>
          </Card>
        ) : (
          <div className="space-y-4">
            {sortedTokens.map((token, idx) => (
              <Card 
                key={`${token.contractAddress}-${idx}`} 
                className="stat-card p-6 hover:neon-glow cursor-pointer group animate-fade-in relative overflow-hidden"
                style={{ animationDelay: `${idx * 40}ms` }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative flex items-center justify-between">
                  <div className="flex items-center gap-6 flex-1">
                    <div className="relative">
                      <div className="absolute inset-0 bg-gradient-to-br from-primary/30 to-accent/30 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                      <div className="relative h-16 w-16 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 ring-2 ring-white/5">
                        <span className="font-bold text-2xl text-primary">{token.symbol.charAt(0)}</span>
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-bold text-xl text-foreground">{token.symbol}</h3>
                        <Badge variant="outline" className="text-xs bg-card/60 border-white/10 backdrop-blur-sm">
                          {token.chain}
                        </Badge>
                      </div>
                      <p className="text-base text-muted-foreground/80 mb-1">{token.name}</p>
                      <p className="text-sm text-muted-foreground/60">Wallet: {token.walletName}</p>
                    </div>
                  </div>

                  <div className="text-right space-y-1.5">
                    <p className="font-bold text-2xl gradient-text">
                      ${token.usdValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                    <p className="text-base text-muted-foreground/80 font-semibold">
                      {parseFloat(token.balance).toFixed(4)} {token.symbol}
                    </p>
                    <p className="text-sm text-muted-foreground/60">
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
