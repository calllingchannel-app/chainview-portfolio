import { useEffect, useState } from "react";
import { Layout } from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { getTopCryptos } from "@/lib/priceService";
import { TrendingUp, TrendingDown, Loader2, Search, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CryptoData {
  id: string;
  symbol: string;
  name: string;
  current_price: number;
  price_change_percentage_24h: number;
  market_cap: number;
  total_volume: number;
  image: string;
}

const LivePrices = () => {
  const [cryptos, setCryptos] = useState<CryptoData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchPrices = async () => {
    setIsLoading(true);
    const data = await getTopCryptos(50);
    setCryptos(data);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchPrices();
    const interval = setInterval(fetchPrices, 30000);
    return () => clearInterval(interval);
  }, []);

  const filteredCryptos = cryptos.filter(crypto => 
    crypto.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    crypto.symbol.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Layout>
      <div className="min-h-screen p-4 sm:p-6 lg:p-8 gradient-bg">
        <div className="container mx-auto max-w-6xl">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
            <div className="animate-fade-in">
              <p className="text-xs font-semibold text-primary uppercase tracking-wider mb-2">Market Data</p>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground tracking-tight">Live Prices</h1>
            </div>
            
            <div className="flex items-center gap-3 animate-fade-in" style={{ animationDelay: '100ms' }}>
              <div className="relative flex-1 sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search tokens..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-10 bg-card/50 border-border/50 rounded-xl focus:border-primary/50"
                />
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={fetchPrices}
                disabled={isLoading}
                className="h-10 w-10 rounded-xl border-border/50"
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>

          {isLoading && cryptos.length === 0 ? (
            <Card className="stat-card p-12 lg:p-16 text-center">
              <div className="flex justify-center mb-4">
                <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <Loader2 className="h-6 w-6 text-primary animate-spin" />
                </div>
              </div>
              <p className="text-muted-foreground font-medium">Loading market data...</p>
            </Card>
          ) : filteredCryptos.length === 0 ? (
            <Card className="stat-card p-12 text-center">
              <p className="text-muted-foreground">No tokens found matching "{searchQuery}"</p>
            </Card>
          ) : (
            <div className="space-y-2">
              {filteredCryptos.map((crypto, idx) => (
                <Card 
                  key={crypto.id} 
                  className="stat-card p-4 sm:p-5 group animate-fade-in"
                  style={{ animationDelay: `${idx * 15}ms` }}
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                      {/* Rank */}
                      <span className="text-xs font-medium text-muted-foreground w-6 text-center shrink-0">
                        {idx + 1}
                      </span>
                      
                      {/* Crypto Icon */}
                      <div className="relative shrink-0">
                        <img
                          src={crypto.image}
                          alt={crypto.name}
                          className="h-10 w-10 sm:h-11 sm:w-11 rounded-full ring-2 ring-border/30 group-hover:ring-primary/30 transition-all group-hover:scale-105"
                        />
                      </div>
                      
                      {/* Crypto Info */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-0.5">
                          <h3 className="font-semibold text-sm sm:text-base text-foreground truncate">{crypto.name}</h3>
                          <Badge variant="outline" className="text-[10px] uppercase bg-muted/30 border-border/40 text-muted-foreground hidden sm:inline-flex">
                            {crypto.symbol}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span className="hidden sm:inline">MCap: ${(crypto.market_cap / 1e9).toFixed(2)}B</span>
                          <span className="hidden md:inline">Vol: ${(crypto.total_volume / 1e9).toFixed(2)}B</span>
                        </div>
                      </div>
                    </div>

                    {/* Price & Change */}
                    <div className="text-right shrink-0">
                      <p className="font-bold text-sm sm:text-base text-foreground">
                        ${crypto.current_price.toLocaleString('en-US', { 
                          minimumFractionDigits: 2,
                          maximumFractionDigits: crypto.current_price < 1 ? 6 : 2
                        })}
                      </p>
                      <div className={`inline-flex items-center gap-1 text-xs sm:text-sm font-semibold px-2 py-0.5 rounded-md ${
                        crypto.price_change_percentage_24h > 0 
                          ? 'text-success bg-success/10' 
                          : 'text-destructive bg-destructive/10'
                      }`}>
                        {crypto.price_change_percentage_24h > 0 ? (
                          <TrendingUp className="h-3 w-3" />
                        ) : (
                          <TrendingDown className="h-3 w-3" />
                        )}
                        <span>
                          {crypto.price_change_percentage_24h > 0 ? '+' : ''}{crypto.price_change_percentage_24h.toFixed(2)}%
                        </span>
                      </div>
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

export default LivePrices;
