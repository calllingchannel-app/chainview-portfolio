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

export async function getMultipleTokenPrices(symbols: string[]): Promise<Record<string, number>> {
  try {
    const ids = symbols
      .map((s) => TOKEN_ID_MAP[s.toUpperCase()] || s.toLowerCase())
      .join(',');
    
    const response = await axios.get<CoinGeckoPrice>(
      `${COINGECKO_API}/simple/price?ids=${ids}&vs_currencies=usd`
    );

    const prices: Record<string, number> = {};
    symbols.forEach((symbol) => {
      const tokenId = TOKEN_ID_MAP[symbol.toUpperCase()] || symbol.toLowerCase();
      prices[symbol] = response.data[tokenId]?.usd || 0;
    });

    return prices;
  } catch (error) {
    console.error('Failed to fetch multiple prices:', error);
    return {};
  }
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
