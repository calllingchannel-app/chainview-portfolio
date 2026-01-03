import axios from 'axios';

const COINGECKO_API = 'https://api.coingecko.com/api/v3';

interface PriceHistoryCache {
  [tokenId: string]: {
    [period: string]: {
      price: number;
      timestamp: number;
    };
  };
}

// Cache for historical prices - 5 minute TTL
const priceHistoryCache: PriceHistoryCache = {};
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Periods for P&L calculation
export type TimePeriod = '24h' | '7d' | '30d';

const PERIOD_DAYS: Record<TimePeriod, number> = {
  '24h': 1,
  '7d': 7,
  '30d': 30,
};

// Fetch historical price for a token at a specific period ago
export async function getHistoricalPrice(
  coingeckoId: string,
  period: TimePeriod
): Promise<number> {
  const now = Date.now();
  const cached = priceHistoryCache[coingeckoId]?.[period];
  
  if (cached && now - cached.timestamp < CACHE_TTL) {
    return cached.price;
  }

  try {
    const days = PERIOD_DAYS[period];
    const response = await axios.get(
      `${COINGECKO_API}/coins/${coingeckoId}/market_chart?vs_currency=usd&days=${days}&interval=daily`,
      { timeout: 10000 }
    );

    const prices = response.data.prices;
    if (prices && prices.length > 0) {
      // Get the first price point (from X days ago)
      const historicalPrice = prices[0][1];
      
      // Cache the result
      if (!priceHistoryCache[coingeckoId]) {
        priceHistoryCache[coingeckoId] = {};
      }
      priceHistoryCache[coingeckoId][period] = {
        price: historicalPrice,
        timestamp: now,
      };
      
      return historicalPrice;
    }
  } catch (error) {
    console.warn(`Failed to get historical price for ${coingeckoId}:`, error);
  }

  return 0;
}

// Fetch historical prices for multiple tokens at once
export async function getHistoricalPrices(
  coingeckoIds: string[],
  period: TimePeriod
): Promise<Record<string, number>> {
  const results: Record<string, number> = {};
  const now = Date.now();
  const uncachedIds: string[] = [];

  // Check cache first
  coingeckoIds.forEach((id) => {
    const cached = priceHistoryCache[id]?.[period];
    if (cached && now - cached.timestamp < CACHE_TTL) {
      results[id] = cached.price;
    } else {
      uncachedIds.push(id);
    }
  });

  // Fetch uncached prices in batches
  if (uncachedIds.length > 0) {
    const batchSize = 5;
    for (let i = 0; i < uncachedIds.length; i += batchSize) {
      const batch = uncachedIds.slice(i, i + batchSize);
      const promises = batch.map((id) => getHistoricalPrice(id, period));
      const prices = await Promise.allSettled(promises);
      
      prices.forEach((result, index) => {
        const id = batch[index];
        if (result.status === 'fulfilled') {
          results[id] = result.value;
        } else {
          results[id] = 0;
        }
      });
    }
  }

  return results;
}

// Calculate P&L for a portfolio
export interface PnLResult {
  absoluteChange: number;
  percentageChange: number;
  previousValue: number;
  currentValue: number;
}

export interface PortfolioPnL {
  '24h': PnLResult;
  '7d': PnLResult;
  '30d': PnLResult;
}

export async function calculatePortfolioPnL(
  holdings: Array<{
    coingeckoId: string;
    balance: number;
    currentPrice: number;
  }>
): Promise<PortfolioPnL> {
  const periods: TimePeriod[] = ['24h', '7d', '30d'];
  const coingeckoIds = [...new Set(holdings.map((h) => h.coingeckoId).filter(Boolean))];
  
  // Calculate current total value
  const currentValue = holdings.reduce((sum, h) => sum + h.balance * h.currentPrice, 0);

  const result: PortfolioPnL = {
    '24h': { absoluteChange: 0, percentageChange: 0, previousValue: currentValue, currentValue },
    '7d': { absoluteChange: 0, percentageChange: 0, previousValue: currentValue, currentValue },
    '30d': { absoluteChange: 0, percentageChange: 0, previousValue: currentValue, currentValue },
  };

  // Fetch historical prices for all periods in parallel
  const historicalPricesPromises = periods.map(async (period) => {
    const prices = await getHistoricalPrices(coingeckoIds, period);
    return { period, prices };
  });

  const allHistoricalPrices = await Promise.all(historicalPricesPromises);

  // Calculate P&L for each period
  allHistoricalPrices.forEach(({ period, prices }) => {
    let previousValue = 0;
    
    holdings.forEach((holding) => {
      const historicalPrice = prices[holding.coingeckoId] || holding.currentPrice;
      previousValue += holding.balance * historicalPrice;
    });

    const absoluteChange = currentValue - previousValue;
    const percentageChange = previousValue > 0 ? ((currentValue - previousValue) / previousValue) * 100 : 0;

    result[period] = {
      absoluteChange,
      percentageChange,
      previousValue,
      currentValue,
    };
  });

  return result;
}

// Format P&L for display
export function formatPnL(pnl: PnLResult): {
  absoluteStr: string;
  percentStr: string;
  isPositive: boolean;
} {
  const isPositive = pnl.absoluteChange >= 0;
  const sign = isPositive ? '+' : '';
  
  return {
    absoluteStr: `${sign}$${Math.abs(pnl.absoluteChange).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`,
    percentStr: `${sign}${pnl.percentageChange.toFixed(2)}%`,
    isPositive,
  };
}
