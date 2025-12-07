import { useWalletStore } from "@/stores/walletStore";
import { Layout } from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, Coins } from "lucide-react";
import { useState } from "react";

const Portfolio = () => {
  const { connectedWallets } = useWalletStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedChain, setSelectedChain] = useState<string>("all");

  const allTokens = connectedWallets.flatMap(wallet => 
    wallet.balances.map(token => ({
      ...token,
      walletAddress: wallet.address,
      walletName: wallet.name,
    }))
  );

  const chains = ["all", ...Array.from(new Set(allTokens.map(t => t.chain)))];

  const filteredTokens = allTokens.filter(token => {
    const matchesSearch = token.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         token.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesChain = selectedChain === "all" || token.chain === selectedChain;
    return matchesSearch && matchesChain;
  });

  const sortedTokens = [...filteredTokens].sort((a, b) => b.usdValue - a.usdValue);

  return (
    <Layout>
      <div className="min-h-screen p-4 sm:p-6 lg:p-8 gradient-bg">
        <div className="container mx-auto max-w-6xl">
          {/* Header */}
          <div className="mb-8 animate-fade-in">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-2 gradient-text tracking-tight">Portfolio</h1>
            <p className="text-sm sm:text-base text-muted-foreground">All your tokens across connected wallets</p>
          </div>

          {/* Filters */}
          <div className="mb-6 flex flex-col sm:flex-row gap-3 animate-slide-up">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search tokens..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-11 h-11 bg-card/50 border-border/50 rounded-xl focus:border-primary/50 transition-colors"
              />
            </div>

            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
              {chains.map(chain => (
                <Badge
                  key={chain}
                  variant={selectedChain === chain ? "default" : "outline"}
                  className={`cursor-pointer whitespace-nowrap px-4 py-2 rounded-lg transition-all duration-200 font-medium ${
                    selectedChain === chain 
                      ? "bg-primary text-primary-foreground border-transparent" 
                      : "bg-card/50 border-border/50 text-muted-foreground hover:text-foreground hover:border-border"
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
            <Card className="stat-card p-12 lg:p-16 text-center">
              <div className="h-14 w-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-4">
                <Coins className="h-6 w-6 text-primary" />
              </div>
              <p className="text-lg font-medium text-foreground mb-2">
                {connectedWallets.length === 0 ? "No wallets connected" : "No tokens found"}
              </p>
              <p className="text-sm text-muted-foreground">
                {connectedWallets.length === 0 
                  ? "Connect a wallet to see your portfolio"
                  : "Try adjusting your search or filters"}
              </p>
            </Card>
          ) : (
            <div className="space-y-3">
              {sortedTokens.map((token, idx) => (
                <Card 
                  key={`${token.contractAddress}-${idx}`} 
                  className="stat-card p-4 sm:p-5 group animate-fade-in"
                  style={{ animationDelay: `${idx * 30}ms` }}
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                      {/* Token Icon */}
                      <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                        <span className="font-bold text-base sm:text-lg text-primary">{token.symbol.charAt(0)}</span>
                      </div>
                      
                      {/* Token Info */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <h3 className="font-semibold text-sm sm:text-base text-foreground">{token.symbol}</h3>
                          <Badge variant="outline" className="text-[10px] bg-card/50 border-border/50 hidden sm:inline-flex">
                            {token.chain}
                          </Badge>
                        </div>
                        <p className="text-xs sm:text-sm text-muted-foreground truncate">{token.name}</p>
                      </div>
                    </div>

                    {/* Token Value */}
                    <div className="text-right shrink-0">
                      <p className="font-semibold text-sm sm:text-base gradient-text">
                        ${token.usdValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                      <p className="text-xs sm:text-sm text-muted-foreground">
                        {parseFloat(token.balance).toFixed(4)} {token.symbol}
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