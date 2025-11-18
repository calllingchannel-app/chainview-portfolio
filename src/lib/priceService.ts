import axios from 'axios';

const COINGECKO_API = 'https://api.coingecko.com/api/v3';
const DEXSCREENER_API = 'https://api.dexscreener.com/latest/dex';

interface CoinGeckoPrice {
  [key: string]: {
    usd: number;
  };
}

// CoinGecko token ID mappings
const TOKEN_ID_MAP: Record<string, string> = {
  ETH: 'ethereum',
  BTC: 'bitcoin',
  USDT: 'tether',
  USDC: 'usd-coin',
  BNB: 'binancecoin',
  SOL: 'solana',
  MATIC: 'matic-network',
  AVAX: 'avalanche-2',
  FTM: 'fantom',
  ARB: 'arbitrum',
  OP: 'optimism',
};

export async function getTokenPrice(symbol: string): Promise<number> {
  try {
    // Try CoinGecko first
    const tokenId = TOKEN_ID_MAP[symbol.toUpperCase()] || symbol.toLowerCase();
    const response = await axios.get<CoinGeckoPrice>(
      `${COINGECKO_API}/simple/price?ids=${tokenId}&vs_currencies=usd`
    );
    
    if (response.data[tokenId]?.usd) {
      return response.data[tokenId].usd;
    }
  } catch (error) {
    console.error(`CoinGecko failed for ${symbol}:`, error);
  }

  // Fallback to DexScreener
  try {
    const response = await axios.get(`${DEXSCREENER_API}/search?q=${symbol}`);
    if (response.data?.pairs?.[0]?.priceUsd) {
      return parseFloat(response.data.pairs[0].priceUsd);
    }
  } catch (error) {
    console.error(`DexScreener failed for ${symbol}:`, error);
  }

  return 0;
}

// Cache for price data (15 second TTL)
const priceCache = new Map<string, { price: number; timestamp: number }>();
const CACHE_TTL = 15000; // 15 seconds

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
      const ids = uncachedIds.join(',');
      const response = await axios.get<CoinGeckoPrice>(
        `${COINGECKO_API}/simple/price?ids=${ids}&vs_currencies=usd`,
        { timeout: 10000 }
      );

      uncachedIds.forEach((id) => {
        const price = response.data[id]?.usd || 0;
        prices[id] = price;
        priceCache.set(id, { price, timestamp: now });
      });
    } catch (error) {
      console.error('Failed to fetch prices from CoinGecko:', error);
      
      // Fallback to DexScreener for missing prices
      for (const id of uncachedIds) {
        if (!prices[id]) {
          try {
            const response = await axios.get(`${DEXSCREENER_API}/search?q=${id}`, { timeout: 8000 });
            if (response.data?.pairs?.[0]?.priceUsd) {
              const price = parseFloat(response.data.pairs[0].priceUsd);
              prices[id] = price;
              priceCache.set(id, { price, timestamp: now });
            }
          } catch (err) {
            console.error(`DexScreener fallback failed for ${id}:`, err);
            prices[id] = 0;
          }
        }
      }
    }
  }

  return prices;
}

export async function getMultipleTokenPrices(symbols: string[]): Promise<Record<string, number>> {
  const ids = symbols.map((s) => TOKEN_ID_MAP[s.toUpperCase()] || s.toLowerCase());
  const pricesById = await fetchPricesByIds(ids);
  
  const prices: Record<string, number> = {};
  symbols.forEach((symbol, index) => {
    prices[symbol] = pricesById[ids[index]] || 0;
  });

  return prices;
}

export async function getTopCryptos(limit: number = 50) {
  try {
    const response = await axios.get(
      `${COINGECKO_API}/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=${limit}&page=1&sparkline=true&price_change_percentage=24h`
    );
    return response.data;
  } catch (error) {
    console.error('Failed to fetch top cryptos:', error);
    return [];
  }
}
