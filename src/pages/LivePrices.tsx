import { useEffect, useState } from "react";
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
    <div className="min-h-screen bg-background p-6">
      <div className="container mx-auto max-w-7xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Live Prices</h1>
          <p className="text-muted-foreground">Real-time cryptocurrency market data</p>
        </div>

        {isLoading ? (
          <Card className="glass-card p-12 text-center">
            <p className="text-muted-foreground">Loading market data...</p>
          </Card>
        ) : (
          <div className="space-y-2">
            {cryptos.map((crypto) => (
              <Card key={crypto.id} className="glass-card p-4 hover:neon-glow transition-all">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1">
                    <img
                      src={crypto.image}
                      alt={crypto.name}
                      className="h-10 w-10 rounded-full"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{crypto.name}</h3>
                        <Badge variant="outline" className="text-xs uppercase">
                          {crypto.symbol}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        MCap: ${(crypto.market_cap / 1e9).toFixed(2)}B
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="font-semibold gradient-text text-lg">
                      ${crypto.current_price.toLocaleString('en-US', { 
                        minimumFractionDigits: 2,
                        maximumFractionDigits: crypto.current_price < 1 ? 6 : 2
                      })}
                    </p>
                    <div className={`flex items-center gap-1 justify-end ${
                      crypto.price_change_percentage_24h > 0 ? 'text-emerald-400' : 'text-red-400'
                    }`}>
                      {crypto.price_change_percentage_24h > 0 ? (
                        <TrendingUp className="h-4 w-4" />
                      ) : (
                        <TrendingDown className="h-4 w-4" />
                      )}
                      <span className="text-sm font-semibold">
                        {crypto.price_change_percentage_24h.toFixed(2)}%
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
  );
};

export default LivePrices;
