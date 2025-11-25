import { useEffect, useState } from "react";
import { Layout } from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getTopCryptos } from "@/lib/priceService";
import { TrendingUp, TrendingDown } from "lucide-react";

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

  useEffect(() => {
    const fetchPrices = async () => {
      setIsLoading(true);
      const data = await getTopCryptos(50);
      setCryptos(data);
      setIsLoading(false);
    };

    fetchPrices();
    const interval = setInterval(fetchPrices, 15000); // Update every 15s

    return () => clearInterval(interval);
  }, []);

  return (
    <Layout>
      <div className="min-h-screen p-4 md:p-8 gradient-bg">
        <div className="container mx-auto max-w-7xl">
          <div className="mb-10 animate-fade-in">
            <h1 className="text-5xl md:text-6xl font-bold mb-4 gradient-text">Live Prices</h1>
            <p className="text-muted-foreground/90 text-base md:text-lg">Real-time cryptocurrency market data</p>
          </div>

          {isLoading ? (
            <Card className="stat-card p-16 text-center">
              <div className="flex justify-center mb-4">
                <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center animate-pulse">
                  <TrendingUp className="h-8 w-8 text-primary" />
                </div>
              </div>
              <p className="text-muted-foreground/90 text-lg">Loading market data...</p>
            </Card>
          ) : (
            <div className="space-y-3">
              {cryptos.map((crypto, idx) => (
                <Card 
                  key={crypto.id} 
                  className="stat-card p-5 hover:neon-glow cursor-pointer group animate-fade-in"
                  style={{ animationDelay: `${idx * 30}ms` }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-5 flex-1">
                      <div className="relative">
                        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-accent/20 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                        <img
                          src={crypto.image}
                          alt={crypto.name}
                          className="relative h-14 w-14 rounded-full ring-2 ring-border/40 group-hover:ring-primary/50 transition-all duration-300 group-hover:scale-110"
                        />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          <h3 className="font-bold text-lg">{crypto.name}</h3>
                          <Badge variant="outline" className="text-xs uppercase bg-card/50 border-border/40">
                            {crypto.symbol}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground/90">
                          MCap: ${(crypto.market_cap / 1e9).toFixed(2)}B • Vol: ${(crypto.total_volume / 1e9).toFixed(2)}B
                        </p>
                      </div>
                    </div>

                    <div className="text-right space-y-2">
                      <p className="font-bold text-xl gradient-text">
                        ${crypto.current_price.toLocaleString('en-US', { 
                          minimumFractionDigits: 2,
                          maximumFractionDigits: crypto.current_price < 1 ? 6 : 2
                        })}
                      </p>
                      <div className={`flex items-center gap-2 justify-end font-semibold ${
                        crypto.price_change_percentage_24h > 0 ? 'text-emerald-400' : 'text-red-400'
                      }`}>
                        {crypto.price_change_percentage_24h > 0 ? (
                          <TrendingUp className="h-5 w-5" />
                        ) : (
                          <TrendingDown className="h-5 w-5" />
                        )}
                        <span className="text-base">
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
