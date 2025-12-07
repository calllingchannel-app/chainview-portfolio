import { useEffect, useState } from "react";
import { Layout } from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getTopCryptos } from "@/lib/priceService";
import { TrendingUp, TrendingDown, Loader2 } from "lucide-react";

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
    const interval = setInterval(fetchPrices, 15000);

    return () => clearInterval(interval);
  }, []);

  return (
    <Layout>
      <div className="min-h-screen p-4 sm:p-6 lg:p-8 gradient-bg">
        <div className="container mx-auto max-w-6xl">
          {/* Header */}
          <div className="mb-8 animate-fade-in">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-2 gradient-text tracking-tight">Live Prices</h1>
            <p className="text-sm sm:text-base text-muted-foreground">Real-time cryptocurrency market data</p>
          </div>

          {isLoading ? (
            <Card className="stat-card p-12 lg:p-16 text-center">
              <div className="flex justify-center mb-4">
                <Loader2 className="h-8 w-8 text-primary animate-spin" />
              </div>
              <p className="text-muted-foreground">Loading market data...</p>
            </Card>
          ) : (
            <div className="space-y-2.5">
              {cryptos.map((crypto, idx) => (
                <Card 
                  key={crypto.id} 
                  className="stat-card p-4 sm:p-5 group animate-fade-in"
                  style={{ animationDelay: `${idx * 20}ms` }}
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                      {/* Crypto Icon */}
                      <div className="relative shrink-0">
                        <img
                          src={crypto.image}
                          alt={crypto.name}
                          className="h-10 w-10 sm:h-11 sm:w-11 rounded-full ring-2 ring-border/40 group-hover:ring-primary/40 transition-all group-hover:scale-105"
                        />
                      </div>
                      
                      {/* Crypto Info */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-0.5">
                          <h3 className="font-semibold text-sm sm:text-base text-foreground truncate">{crypto.name}</h3>
                          <Badge variant="outline" className="text-[10px] uppercase bg-card/50 border-border/50 hidden sm:inline-flex">
                            {crypto.symbol}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground hidden sm:block">
                          MCap: ${(crypto.market_cap / 1e9).toFixed(2)}B
                        </p>
                      </div>
                    </div>

                    {/* Price & Change */}
                    <div className="text-right shrink-0">
                      <p className="font-semibold text-sm sm:text-base gradient-text">
                        ${crypto.current_price.toLocaleString('en-US', { 
                          minimumFractionDigits: 2,
                          maximumFractionDigits: crypto.current_price < 1 ? 6 : 2
                        })}
                      </p>
                      <div className={`flex items-center gap-1 justify-end text-xs sm:text-sm font-medium ${
                        crypto.price_change_percentage_24h > 0 ? 'text-emerald-400' : 'text-red-400'
                      }`}>
                        {crypto.price_change_percentage_24h > 0 ? (
                          <TrendingUp className="h-3.5 w-3.5" />
                        ) : (
                          <TrendingDown className="h-3.5 w-3.5" />
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