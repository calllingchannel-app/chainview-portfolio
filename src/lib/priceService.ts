import axios from 'axios';

const COINGECKO_API = 'https://api.coingecko.com/api/v3';

interface CoinGeckoPrice {
  [key: string]: {
    usd: number;
  };
}

// Price cache with 10 second TTL for real-time accuracy
const priceCache = new Map<string, { price: number; timestamp: number }>();
const CACHE_TTL = 10000; // 10 seconds - faster refresh for real-time data

// Request deduplication to prevent duplicate API calls
const pendingRequests = new Map<string, Promise<Record<string, number>>>();

// Fetch prices from CoinGecko by IDs with deduplication
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

  if (uncachedIds.length === 0) return prices;

  // Create a unique key for this request
  const requestKey = uncachedIds.sort().join(',');

  // Check if there's already a pending request for these IDs
  const pending = pendingRequests.get(requestKey);
  if (pending) {
    console.log(`⏳ Waiting for pending price request...`);
    const fetchedPrices = await pending;
    return { ...prices, ...fetchedPrices };
  }

  // Create new request
  const fetchPromise = (async (): Promise<Record<string, number>> => {
    const fetchedPrices: Record<string, number> = {};
    
    try {
      console.log(`💰 Fetching prices for: ${uncachedIds.join(', ')}`);
      const ids = uncachedIds.join(',');
      
      const response = await axios.get<CoinGeckoPrice>(
        `${COINGECKO_API}/simple/price?ids=${ids}&vs_currencies=usd`,
        { 
          timeout: 8000,
          headers: {
            'Accept': 'application/json',
          }
        }
      );

      const fetchTime = Date.now();
      uncachedIds.forEach((id) => {
        const price = response.data[id]?.usd || 0;
        fetchedPrices[id] = price;
        priceCache.set(id, { price, timestamp: fetchTime });
      });
      
      console.log(`✅ Fetched ${Object.keys(fetchedPrices).length} prices`);
    } catch (error: any) {
      console.error('CoinGecko API error:', error.message);
      // Return 0 for failed fetches
      uncachedIds.forEach((id) => {
        if (fetchedPrices[id] === undefined) {
          fetchedPrices[id] = 0;
        }
      });
    }
    
    return fetchedPrices;
  })();

  // Store the pending request
  pendingRequests.set(requestKey, fetchPromise);

  try {
    const fetchedPrices = await fetchPromise;
    return { ...prices, ...fetchedPrices };
  } finally {
    // Clean up pending request
    pendingRequests.delete(requestKey);
  }
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
