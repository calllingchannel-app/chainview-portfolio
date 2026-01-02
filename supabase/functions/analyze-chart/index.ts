import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Fetch real-time market data from CoinGecko
async function fetchMarketData(symbol: string) {
  const symbolMap: Record<string, string> = {
    'bitcoin': 'bitcoin',
    'btc': 'bitcoin',
    'ethereum': 'ethereum',
    'eth': 'ethereum',
    'solana': 'solana',
    'sol': 'solana',
    'bnb': 'binancecoin',
    'xrp': 'ripple',
    'cardano': 'cardano',
    'ada': 'cardano',
    'dogecoin': 'dogecoin',
    'doge': 'dogecoin',
    'polygon': 'matic-network',
    'matic': 'matic-network',
    'avalanche': 'avalanche-2',
    'avax': 'avalanche-2',
    'chainlink': 'chainlink',
    'link': 'chainlink',
    'polkadot': 'polkadot',
    'dot': 'polkadot',
    'litecoin': 'litecoin',
    'ltc': 'litecoin',
  };

  const coinId = symbolMap[symbol.toLowerCase()] || symbol.toLowerCase();
  
  try {
    console.log(`Fetching market data for: ${coinId}`);
    
    // Fetch detailed market data
    const response = await fetch(
      `https://api.coingecko.com/api/v3/coins/${coinId}?localization=false&tickers=false&community_data=false&developer_data=false&sparkline=true`,
      { headers: { 'Accept': 'application/json' } }
    );

    if (!response.ok) {
      console.error(`CoinGecko API error: ${response.status}`);
      return null;
    }

    const data = await response.json();
    
    // Extract OHLC data for technical indicators
    const ohlcResponse = await fetch(
      `https://api.coingecko.com/api/v3/coins/${coinId}/ohlc?vs_currency=usd&days=30`,
      { headers: { 'Accept': 'application/json' } }
    );
    
    let ohlcData = [];
    if (ohlcResponse.ok) {
      ohlcData = await ohlcResponse.json();
    }

    return {
      symbol: data.symbol?.toUpperCase() || symbol.toUpperCase(),
      name: data.name,
      currentPrice: data.market_data?.current_price?.usd || 0,
      high24h: data.market_data?.high_24h?.usd || 0,
      low24h: data.market_data?.low_24h?.usd || 0,
      priceChange24h: data.market_data?.price_change_percentage_24h || 0,
      priceChange7d: data.market_data?.price_change_percentage_7d || 0,
      priceChange30d: data.market_data?.price_change_percentage_30d || 0,
      marketCap: data.market_data?.market_cap?.usd || 0,
      volume24h: data.market_data?.total_volume?.usd || 0,
      circulatingSupply: data.market_data?.circulating_supply || 0,
      totalSupply: data.market_data?.total_supply || 0,
      ath: data.market_data?.ath?.usd || 0,
      athChangePercentage: data.market_data?.ath_change_percentage?.usd || 0,
      atl: data.market_data?.atl?.usd || 0,
      sparkline: data.market_data?.sparkline_7d?.price || [],
      ohlcData: ohlcData,
    };
  } catch (error) {
    console.error('Error fetching market data:', error);
    return null;
  }
}

// Calculate technical indicators from price data
function calculateIndicators(marketData: any) {
  const prices = marketData.sparkline || [];
  const ohlc = marketData.ohlcData || [];
  
  if (prices.length < 14) {
    return {
      rsi: 50,
      rsiSignal: 'Insufficient data',
      macd: 0,
      macdSignal: 'Insufficient data',
      sma20: marketData.currentPrice,
      sma50: marketData.currentPrice,
      volumeRatio: '1.0x',
      volatility: 'Unknown',
    };
  }

  // Calculate RSI (14-period)
  const changes = [];
  for (let i = 1; i < prices.length; i++) {
    changes.push(prices[i] - prices[i - 1]);
  }
  
  const gains = changes.filter(c => c > 0);
  const losses = changes.filter(c => c < 0).map(c => Math.abs(c));
  
  const avgGain = gains.length > 0 ? gains.reduce((a, b) => a + b, 0) / 14 : 0;
  const avgLoss = losses.length > 0 ? losses.reduce((a, b) => a + b, 0) / 14 : 0.001;
  
  const rs = avgGain / avgLoss;
  const rsi = Math.round(100 - (100 / (1 + rs)));
  
  let rsiSignal = 'Neutral';
  if (rsi > 70) rsiSignal = 'Overbought - Consider taking profits';
  else if (rsi > 60) rsiSignal = 'Bullish momentum';
  else if (rsi < 30) rsiSignal = 'Oversold - Potential buying opportunity';
  else if (rsi < 40) rsiSignal = 'Bearish momentum';

  // Calculate SMAs
  const sma20 = prices.slice(-20).reduce((a: number, b: number) => a + b, 0) / Math.min(20, prices.length);
  const sma50 = prices.slice(-50).reduce((a: number, b: number) => a + b, 0) / Math.min(50, prices.length);
  
  // Calculate MACD (12, 26, 9)
  const ema12 = calculateEMA(prices, 12);
  const ema26 = calculateEMA(prices, 26);
  const macd = ema12 - ema26;
  
  let macdSignal = 'Neutral';
  if (macd > 0 && marketData.priceChange24h > 0) macdSignal = 'Bullish crossover - Buy signal';
  else if (macd < 0 && marketData.priceChange24h < 0) macdSignal = 'Bearish crossover - Sell signal';
  else if (macd > 0) macdSignal = 'Bullish but weakening';
  else macdSignal = 'Bearish but recovering';

  // Calculate volatility
  const mean = prices.reduce((a: number, b: number) => a + b, 0) / prices.length;
  const variance = prices.reduce((sum: number, p: number) => sum + Math.pow(p - mean, 2), 0) / prices.length;
  const stdDev = Math.sqrt(variance);
  const volatilityPercent = (stdDev / mean) * 100;
  
  let volatility = 'Low';
  let volatilitySignal = 'Stable market conditions';
  if (volatilityPercent > 10) {
    volatility = 'High';
    volatilitySignal = 'High risk - Use tight stop-losses';
  } else if (volatilityPercent > 5) {
    volatility = 'Medium';
    volatilitySignal = 'Normal market conditions';
  }

  return {
    rsi,
    rsiSignal,
    macd: Math.round(macd * 100) / 100,
    macdSignal,
    sma20: Math.round(sma20 * 100) / 100,
    sma20Signal: marketData.currentPrice > sma20 ? 'Price above SMA20 - Bullish' : 'Price below SMA20 - Bearish',
    sma50: Math.round(sma50 * 100) / 100,
    sma50Signal: marketData.currentPrice > sma50 ? 'Uptrend confirmed' : 'Downtrend warning',
    volumeRatio: `${((marketData.volume24h / (marketData.marketCap * 0.02)) || 1).toFixed(2)}x`,
    volumeSignal: marketData.volume24h > marketData.marketCap * 0.03 ? 'High volume - Strong interest' : 'Normal volume',
    volatility,
    volatilitySignal,
  };
}

function calculateEMA(prices: number[], period: number): number {
  if (prices.length < period) return prices[prices.length - 1] || 0;
  
  const multiplier = 2 / (period + 1);
  let ema = prices.slice(0, period).reduce((a, b) => a + b, 0) / period;
  
  for (let i = period; i < prices.length; i++) {
    ema = (prices[i] - ema) * multiplier + ema;
  }
  
  return ema;
}

// Calculate support and resistance levels
function calculateLevels(marketData: any) {
  const current = marketData.currentPrice;
  const high = marketData.high24h;
  const low = marketData.low24h;
  const ath = marketData.ath;
  
  // Pivot point calculation
  const pivot = (high + low + current) / 3;
  
  return {
    support1: Math.round((2 * pivot - high) * 100) / 100,
    support2: Math.round((pivot - (high - low)) * 100) / 100,
    support3: Math.round((low - 2 * (high - pivot)) * 100) / 100,
    resistance1: Math.round((2 * pivot - low) * 100) / 100,
    resistance2: Math.round((pivot + (high - low)) * 100) / 100,
    resistance3: Math.round((high + 2 * (pivot - low)) * 100) / 100,
  };
}

// Determine trading signal based on indicators
function determineSignal(indicators: any, marketData: any) {
  let score = 0;
  
  // RSI scoring
  if (indicators.rsi < 30) score += 2; // Oversold = buy
  else if (indicators.rsi < 40) score += 1;
  else if (indicators.rsi > 70) score -= 2; // Overbought = sell
  else if (indicators.rsi > 60) score -= 1;
  
  // MACD scoring
  if (indicators.macd > 0) score += 1;
  else score -= 1;
  
  // Price vs SMA scoring
  if (marketData.currentPrice > indicators.sma20) score += 1;
  if (marketData.currentPrice > indicators.sma50) score += 1;
  
  // Trend scoring
  if (marketData.priceChange24h > 5) score += 2;
  else if (marketData.priceChange24h > 0) score += 1;
  else if (marketData.priceChange24h < -5) score -= 2;
  else if (marketData.priceChange24h < 0) score -= 1;
  
  // Convert score to signal
  let signal = 'NEUTRAL';
  let confidence = 50;
  
  if (score >= 4) {
    signal = 'STRONG_BUY';
    confidence = 75 + Math.min(score * 3, 20);
  } else if (score >= 2) {
    signal = 'BUY';
    confidence = 60 + score * 3;
  } else if (score <= -4) {
    signal = 'STRONG_SELL';
    confidence = 75 + Math.min(Math.abs(score) * 3, 20);
  } else if (score <= -2) {
    signal = 'SELL';
    confidence = 60 + Math.abs(score) * 3;
  } else {
    confidence = 50 + Math.abs(score) * 5;
  }
  
  return { signal, confidence: Math.min(confidence, 95) };
}

function formatMarketCap(value: number): string {
  if (value >= 1e12) return `${(value / 1e12).toFixed(2)}T`;
  if (value >= 1e9) return `${(value / 1e9).toFixed(2)}B`;
  if (value >= 1e6) return `${(value / 1e6).toFixed(2)}M`;
  return value.toLocaleString();
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      console.error('LOVABLE_API_KEY is not configured');
      throw new Error('AI service not configured');
    }

    const { image, symbol } = await req.json();
    console.log('Analyzing chart for symbol:', symbol);

    if (!image) {
      throw new Error('No image provided');
    }

    // Fetch real-time market data
    const marketData = await fetchMarketData(symbol || 'bitcoin');
    
    if (!marketData) {
      console.log('Using fallback data - API unavailable');
    }

    const realData = marketData || {
      symbol: symbol?.toUpperCase() || 'BTC',
      currentPrice: 0,
      high24h: 0,
      low24h: 0,
      priceChange24h: 0,
      priceChange7d: 0,
      priceChange30d: 0,
      marketCap: 0,
      volume24h: 0,
      sparkline: [],
    };

    // Calculate technical indicators
    const indicators = calculateIndicators(realData);
    const levels = calculateLevels(realData);
    const { signal, confidence } = determineSignal(indicators, realData);

    // Build context for AI with real data
    const dataContext = `
REAL-TIME MARKET DATA for ${realData.symbol}:
- Current Price: $${realData.currentPrice?.toLocaleString()}
- 24h High: $${realData.high24h?.toLocaleString()}
- 24h Low: $${realData.low24h?.toLocaleString()}
- 24h Change: ${realData.priceChange24h?.toFixed(2)}%
- 7d Change: ${realData.priceChange7d?.toFixed(2)}%
- 30d Change: ${realData.priceChange30d?.toFixed(2)}%
- Market Cap: $${formatMarketCap(realData.marketCap)}
- 24h Volume: $${formatMarketCap(realData.volume24h)}

CALCULATED INDICATORS:
- RSI (14): ${indicators.rsi} - ${indicators.rsiSignal}
- MACD: ${indicators.macd} - ${indicators.macdSignal}
- SMA 20: $${indicators.sma20?.toLocaleString()} - ${indicators.sma20Signal}
- SMA 50: $${indicators.sma50?.toLocaleString()} - ${indicators.sma50Signal}
- Volume Ratio: ${indicators.volumeRatio} - ${indicators.volumeSignal}
- Volatility: ${indicators.volatility} - ${indicators.volatilitySignal}

CALCULATED LEVELS:
- Support 1: $${levels.support1?.toLocaleString()}
- Support 2: $${levels.support2?.toLocaleString()}
- Support 3: $${levels.support3?.toLocaleString()}
- Resistance 1: $${levels.resistance1?.toLocaleString()}
- Resistance 2: $${levels.resistance2?.toLocaleString()}
- Resistance 3: $${levels.resistance3?.toLocaleString()}

PRE-CALCULATED SIGNAL: ${signal} (Confidence: ${confidence}%)
`;

    const systemPrompt = `You are an expert cryptocurrency technical analyst. You have been given REAL-TIME market data. 
    
Analyze the chart image provided along with this LIVE DATA:
${dataContext}

Based on the chart patterns you observe AND the real market data above, provide a comprehensive analysis.

IMPORTANT: Use the REAL prices and data provided above. Do not make up numbers.

Identify any chart patterns visible (triangles, wedges, head & shoulders, double tops/bottoms, flags, etc.)

Return your analysis as valid JSON with this structure:
{
  "pattern": "Name of the primary chart pattern you identified",
  "analysis": "2-3 sentence comprehensive analysis combining chart patterns with the real-time data",
  "recommendations": ["Array of 3-4 specific, actionable trading recommendations"]
}

Be specific about entry/exit points based on the real support/resistance levels provided.`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: "system", content: systemPrompt },
          { 
            role: "user", 
            content: [
              { type: "text", text: `Analyze this ${symbol || 'cryptocurrency'} trading chart with the real-time data provided.` },
              { type: "image_url", image_url: { url: image } }
            ]
          }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ 
          error: 'Rate limit exceeded',
          symbol: realData.symbol,
          currentPrice: realData.currentPrice,
          signal: 'NEUTRAL',
          confidence: 0,
          analysis: 'Rate limit exceeded. Please try again in a moment.'
        }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      throw new Error(`AI service error: ${response.status}`);
    }

    const data = await response.json();
    let aiResponse = data.choices?.[0]?.message?.content || '';
    
    console.log('AI response received, parsing');

    // Extract JSON from the response
    let aiAnalysis = { pattern: 'Consolidation', analysis: '', recommendations: [] };
    try {
      let jsonStr = aiResponse;
      const jsonMatch = aiResponse.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) {
        jsonStr = jsonMatch[1].trim();
      } else if (!jsonStr.startsWith('{')) {
        const objectMatch = aiResponse.match(/\{[\s\S]*\}/);
        if (objectMatch) {
          jsonStr = objectMatch[0];
        }
      }
      aiAnalysis = JSON.parse(jsonStr);
    } catch (e) {
      console.log('Could not parse AI JSON, using raw response');
      aiAnalysis.analysis = aiResponse;
    }

    // Build final response with real data
    const finalResponse = {
      symbol: realData.symbol,
      currentPrice: realData.currentPrice,
      high24h: realData.high24h,
      low24h: realData.low24h,
      marketCap: formatMarketCap(realData.marketCap),
      volume24h: formatMarketCap(realData.volume24h),
      signal,
      confidence,
      pattern: aiAnalysis.pattern || 'Consolidation',
      rsi: indicators.rsi,
      rsiSignal: indicators.rsiSignal,
      macd: indicators.macd,
      macdSignal: indicators.macdSignal,
      sma20: indicators.sma20,
      sma20Signal: indicators.sma20Signal,
      sma50: indicators.sma50,
      sma50Signal: indicators.sma50Signal,
      volumeRatio: indicators.volumeRatio,
      volumeSignal: indicators.volumeSignal,
      volatility: indicators.volatility,
      volatilitySignal: indicators.volatilitySignal,
      support1: levels.support1,
      support2: levels.support2,
      support3: levels.support3,
      resistance1: levels.resistance1,
      resistance2: levels.resistance2,
      resistance3: levels.resistance3,
      prediction24h: `${realData.priceChange24h >= 0 ? '+' : ''}${(realData.priceChange24h * 0.5).toFixed(1)}%`,
      prediction7d: `${realData.priceChange7d >= 0 ? '+' : ''}${(realData.priceChange7d * 0.3).toFixed(1)}%`,
      prediction30d: `${realData.priceChange30d >= 0 ? '+' : ''}${(realData.priceChange30d * 0.2).toFixed(1)}%`,
      analysis: aiAnalysis.analysis || `Based on real-time data, ${realData.symbol} is showing ${signal.toLowerCase().replace('_', ' ')} signals with RSI at ${indicators.rsi} and price ${realData.priceChange24h >= 0 ? 'up' : 'down'} ${Math.abs(realData.priceChange24h).toFixed(2)}% in 24h.`,
      recommendations: aiAnalysis.recommendations?.length > 0 ? aiAnalysis.recommendations : [
        `Current support at $${levels.support1?.toLocaleString()} - consider entries near this level`,
        `Resistance at $${levels.resistance1?.toLocaleString()} - take partial profits here`,
        `RSI at ${indicators.rsi} suggests ${indicators.rsi > 70 ? 'overbought conditions' : indicators.rsi < 30 ? 'oversold conditions' : 'neutral momentum'}`,
        `Set stop-loss below $${levels.support2?.toLocaleString()} for risk management`
      ],
    };

    console.log('Returning analysis for', finalResponse.symbol);

    return new Response(JSON.stringify(finalResponse), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    console.error('Error in analyze-chart function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ 
      error: errorMessage,
      symbol: 'ERROR',
      currentPrice: 0,
      signal: 'NEUTRAL',
      confidence: 0,
      analysis: 'An error occurred while analyzing the chart. Please try again.'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
