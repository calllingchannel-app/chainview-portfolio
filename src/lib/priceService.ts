import axios from 'axios';

const COINGECKO_API = 'https://api.coingecko.com/api/v3';

interface CoinGeckoPrice {
  [key: string]: {
    usd: number;
  };
}

// Price cache with 15 second TTL for more real-time data
const priceCache = new Map<string, { price: number; timestamp: number }>();
const CACHE_TTL = 15000; // 15 seconds - shorter for real-time accuracy

// Fetch prices from CoinGecko by IDs
export async function fetchPricesByIds(coingeckoIds: string[]): Promise<Record<string, number>> {
  if (coingeckoIds.length === 0) return {};

  const now = Date.now();
  const prices: Record<string, number> = {};
  const uncachedIds: string[] = [];

  // Check cache first
  coingeckoIds.forEach((id) => {
    const cached = priceCache.get(id);
    if (cached && now - cached.timestamp < CACHE_TTL) {
      prices[id] = cached.price;
    } else {
      uncachedIds.push(id);
    }
  });

  // Fetch uncached prices
  if (uncachedIds.length > 0) {
    try {
      console.log(`💰 Fetching prices for: ${uncachedIds.join(', ')}`);
      const ids = uncachedIds.join(',');
      
      const response = await axios.get<CoinGeckoPrice>(
        `${COINGECKO_API}/simple/price?ids=${ids}&vs_currencies=usd`,
        { 
          timeout: 10000,
          headers: {
            'Accept': 'application/json',
          }
        }
      );

      uncachedIds.forEach((id) => {
        const price = response.data[id]?.usd || 0;
        prices[id] = price;
        priceCache.set(id, { price, timestamp: now });
        if (price > 0) {
          console.log(`  ${id}: $${price}`);
        }
      });
    } catch (error: any) {
      console.error('CoinGecko API error:', error.message);
      
      // Set prices to 0 for failed fetches
      uncachedIds.forEach((id) => {
        if (prices[id] === undefined) {
          prices[id] = 0;
        }
      });
    }
  }

  return prices;
}

// Fetch top cryptos by market cap
export async function getTopCryptos(limit: number = 50) {
  try {
    const response = await axios.get(
      `${COINGECKO_API}/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=${limit}&page=1&sparkline=true&price_change_percentage=24h`,
      { timeout: 15000 }
    );
    return response.data;
  } catch (error) {
    console.error('Failed to fetch top cryptos:', error);
    return [];
  }
}

// Get single token price by symbol
export async function getTokenPrice(symbol: string): Promise<number> {
  const symbolMap: Record<string, string> = {
    ETH: 'ethereum',
    BTC: 'bitcoin',
    USDT: 'tether',
    USDC: 'usd-coin',
    BNB: 'binancecoin',
    SOL: 'solana',
    MATIC: 'matic-network',
    AVAX: 'avalanche-2',
  };
  
  const id = symbolMap[symbol.toUpperCase()] || symbol.toLowerCase();
  const prices = await fetchPricesByIds([id]);
  return prices[id] || 0;
}

// Get multiple token prices by symbols
export async function getMultipleTokenPrices(symbols: string[]): Promise<Record<string, number>> {
  const symbolMap: Record<string, string> = {
    ETH: 'ethereum',
    BTC: 'bitcoin',
    USDT: 'tether',
    USDC: 'usd-coin',
    BNB: 'binancecoin',
    SOL: 'solana',
    MATIC: 'matic-network',
    AVAX: 'avalanche-2',
  };

  const ids = symbols.map((s) => symbolMap[s.toUpperCase()] || s.toLowerCase());
  const pricesById = await fetchPricesByIds(ids);

  const prices: Record<string, number> = {};
  symbols.forEach((symbol, index) => {
    prices[symbol] = pricesById[ids[index]] || 0;
  });

  return prices;
}
