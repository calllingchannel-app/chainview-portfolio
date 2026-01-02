import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Fetch real-time market data from CoinGecko
async function fetchMarketData(query: string) {
  // Extract potential crypto/stock symbols from the query
  const symbolPatterns = [
    /\b(bitcoin|btc)\b/i,
    /\b(ethereum|eth)\b/i,
    /\b(solana|sol)\b/i,
    /\b(bnb|binance)\b/i,
    /\b(xrp|ripple)\b/i,
    /\b(cardano|ada)\b/i,
    /\b(dogecoin|doge)\b/i,
    /\b(polygon|matic)\b/i,
    /\b(avalanche|avax)\b/i,
    /\b(chainlink|link)\b/i,
    /\b(polkadot|dot)\b/i,
    /\b(litecoin|ltc)\b/i,
    /\b(uniswap|uni)\b/i,
    /\b(shiba|shib)\b/i,
    /\b(tron|trx)\b/i,
  ];

  const symbolMap: Record<string, string> = {
    'bitcoin': 'bitcoin', 'btc': 'bitcoin',
    'ethereum': 'ethereum', 'eth': 'ethereum',
    'solana': 'solana', 'sol': 'solana',
    'bnb': 'binancecoin', 'binance': 'binancecoin',
    'xrp': 'ripple', 'ripple': 'ripple',
    'cardano': 'cardano', 'ada': 'cardano',
    'dogecoin': 'dogecoin', 'doge': 'dogecoin',
    'polygon': 'matic-network', 'matic': 'matic-network',
    'avalanche': 'avalanche-2', 'avax': 'avalanche-2',
    'chainlink': 'chainlink', 'link': 'chainlink',
    'polkadot': 'polkadot', 'dot': 'polkadot',
    'litecoin': 'litecoin', 'ltc': 'litecoin',
    'uniswap': 'uniswap', 'uni': 'uniswap',
    'shiba': 'shiba-inu', 'shib': 'shiba-inu',
    'tron': 'tron', 'trx': 'tron',
  };

  const detectedCoins: string[] = [];
  
  for (const pattern of symbolPatterns) {
    const match = query.match(pattern);
    if (match) {
      const symbol = match[1].toLowerCase();
      const coinId = symbolMap[symbol];
      if (coinId && !detectedCoins.includes(coinId)) {
        detectedCoins.push(coinId);
      }
    }
  }

  // Default to top cryptos if none detected
  if (detectedCoins.length === 0) {
    detectedCoins.push('bitcoin', 'ethereum');
  }

  try {
    console.log(`Fetching market data for: ${detectedCoins.join(', ')}`);
    
    const ids = detectedCoins.join(',');
    const response = await fetch(
      `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${ids}&order=market_cap_desc&sparkline=true&price_change_percentage=1h,24h,7d,30d`,
      { headers: { 'Accept': 'application/json' } }
    );

    if (!response.ok) {
      console.error(`CoinGecko API error: ${response.status}`);
      return null;
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching market data:', error);
    return null;
  }
}

// Fetch global market data
async function fetchGlobalData() {
  try {
    const response = await fetch(
      'https://api.coingecko.com/api/v3/global',
      { headers: { 'Accept': 'application/json' } }
    );
    
    if (!response.ok) return null;
    
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Error fetching global data:', error);
    return null;
  }
}

// Fetch trending coins
async function fetchTrending() {
  try {
    const response = await fetch(
      'https://api.coingecko.com/api/v3/search/trending',
      { headers: { 'Accept': 'application/json' } }
    );
    
    if (!response.ok) return null;
    
    const data = await response.json();
    return data.coins?.slice(0, 5).map((c: any) => ({
      name: c.item.name,
      symbol: c.item.symbol,
      rank: c.item.market_cap_rank,
    }));
  } catch (error) {
    console.error('Error fetching trending:', error);
    return null;
  }
}

function formatNumber(value: number): string {
  if (!value) return '0';
  if (value >= 1e12) return `$${(value / 1e12).toFixed(2)}T`;
  if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
  if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
  if (value >= 1000) return `$${(value / 1000).toFixed(2)}K`;
  return `$${value.toFixed(2)}`;
}

// Calculate RSI from sparkline
function calculateRSI(prices: number[]): number {
  if (!prices || prices.length < 14) return 50;
  
  const changes = [];
  for (let i = 1; i < prices.length; i++) {
    changes.push(prices[i] - prices[i - 1]);
  }
  
  const gains = changes.filter(c => c > 0);
  const losses = changes.filter(c => c < 0).map(c => Math.abs(c));
  
  const avgGain = gains.length > 0 ? gains.reduce((a, b) => a + b, 0) / 14 : 0;
  const avgLoss = losses.length > 0 ? losses.reduce((a, b) => a + b, 0) / 14 : 0.001;
  
  const rs = avgGain / avgLoss;
  return Math.round(100 - (100 / (1 + rs)));
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

    const { messages, image } = await req.json();
    console.log('Received request with', messages?.length, 'messages');

    // Get the latest user message for context
    const latestUserMessage = messages?.filter((m: any) => m.role === 'user').pop()?.content || '';
    
    // Fetch real-time data based on the query
    const [marketData, globalData, trending] = await Promise.all([
      fetchMarketData(latestUserMessage),
      fetchGlobalData(),
      fetchTrending(),
    ]);

    // Build comprehensive market context
    let marketContext = '\n=== REAL-TIME MARKET DATA ===\n';
    
    if (globalData) {
      marketContext += `\n**Global Market Overview:**\n`;
      marketContext += `- Total Market Cap: ${formatNumber(globalData.total_market_cap?.usd || 0)}\n`;
      marketContext += `- 24h Volume: ${formatNumber(globalData.total_volume?.usd || 0)}\n`;
      marketContext += `- BTC Dominance: ${(globalData.market_cap_percentage?.btc || 0).toFixed(1)}%\n`;
      marketContext += `- ETH Dominance: ${(globalData.market_cap_percentage?.eth || 0).toFixed(1)}%\n`;
      marketContext += `- Active Cryptocurrencies: ${globalData.active_cryptocurrencies?.toLocaleString() || 'N/A'}\n`;
    }

    if (marketData && marketData.length > 0) {
      marketContext += `\n**Asset Analysis:**\n`;
      
      for (const coin of marketData) {
        const rsi = calculateRSI(coin.sparkline_in_7d?.price || []);
        const trend = coin.price_change_percentage_24h >= 0 ? '📈' : '📉';
        
        marketContext += `\n${trend} **${coin.name} (${coin.symbol.toUpperCase()})**\n`;
        marketContext += `- Current Price: $${coin.current_price?.toLocaleString()}\n`;
        marketContext += `- 24h Change: ${coin.price_change_percentage_24h?.toFixed(2)}%\n`;
        marketContext += `- 7d Change: ${coin.price_change_percentage_7d_in_currency?.toFixed(2) || 'N/A'}%\n`;
        marketContext += `- 30d Change: ${coin.price_change_percentage_30d_in_currency?.toFixed(2) || 'N/A'}%\n`;
        marketContext += `- 24h High: $${coin.high_24h?.toLocaleString()}\n`;
        marketContext += `- 24h Low: $${coin.low_24h?.toLocaleString()}\n`;
        marketContext += `- Market Cap: ${formatNumber(coin.market_cap)}\n`;
        marketContext += `- 24h Volume: ${formatNumber(coin.total_volume)}\n`;
        marketContext += `- RSI (14): ${rsi} (${rsi > 70 ? 'Overbought' : rsi < 30 ? 'Oversold' : 'Neutral'})\n`;
        marketContext += `- ATH: $${coin.ath?.toLocaleString()} (${coin.ath_change_percentage?.toFixed(1)}% from ATH)\n`;
      }
    }

    if (trending && trending.length > 0) {
      marketContext += `\n**Trending Now:**\n`;
      trending.forEach((coin: any, i: number) => {
        marketContext += `${i + 1}. ${coin.name} (${coin.symbol}) - Rank #${coin.rank || 'N/A'}\n`;
      });
    }

    marketContext += `\n=== END MARKET DATA ===\n`;
    marketContext += `\n*Data fetched: ${new Date().toISOString()}*\n`;

    const systemPrompt = `You are HAVX AI, an expert cryptocurrency and stock trading analyst with access to REAL-TIME market data.

${marketContext}

You MUST use the real-time data provided above in your responses. Never make up prices or statistics.

Your capabilities:
- Technical analysis using real RSI, price levels, and trends
- Market sentiment analysis based on actual price movements
- Trading strategy recommendations with specific entry/exit prices
- Risk assessment based on volatility and market conditions

Guidelines:
- Always cite the real prices and percentages from the data above
- Be specific with numbers - use the actual values provided
- Mention RSI levels and what they indicate
- Reference support/resistance based on 24h high/low
- Consider market cap and volume for liquidity analysis
- Note: This is not financial advice - always recommend proper risk management

Format responses clearly with:
- **Bold** for key metrics and recommendations
- Bullet points for organized information
- Specific price levels and percentages
- Clear BUY/SELL/HOLD signals when appropriate`;

    // Convert messages to API format
    const apiMessages: any[] = [
      { role: "system", content: systemPrompt }
    ];

    for (const msg of messages || []) {
      if (msg.role === "assistant") {
        apiMessages.push({ role: "assistant", content: msg.content });
      } else if (msg.role === "user") {
        if (msg.imageUrl && msg.imageUrl.startsWith('data:image')) {
          apiMessages.push({
            role: "user",
            content: [
              { type: "text", text: msg.content || "Analyze this trading chart with the real-time market data." },
              { type: "image_url", image_url: { url: msg.imageUrl } }
            ]
          });
        } else {
          // Append market context reminder to user messages
          apiMessages.push({ 
            role: "user", 
            content: `${msg.content}\n\n(Remember to use the real-time market data provided in your system context)`
          });
        }
      }
    }

    if (image && !messages?.some((m: any) => m.imageUrl)) {
      apiMessages.push({
        role: "user",
        content: [
          { type: "text", text: "Analyze this trading chart using the real-time market data provided." },
          { type: "image_url", image_url: { url: image } }
        ]
      });
    }

    console.log('Sending to AI gateway with', apiMessages.length, 'messages and real-time data');

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: apiMessages,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ 
          error: 'Rate limit exceeded',
          response: '⚠️ The service is experiencing high demand. Please try again in a few seconds.'
        }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      if (response.status === 402) {
        return new Response(JSON.stringify({ 
          error: 'Service credits exhausted',
          response: '⚠️ The AI service needs additional credits. Please contact support.'
        }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      throw new Error(`AI service error: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.choices?.[0]?.message?.content || 'I apologize, but I could not generate a response. Please try again.';
    
    console.log('AI response generated successfully, length:', aiResponse.length);

    return new Response(JSON.stringify({ response: aiResponse }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    console.error('Error in trading-agent function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ 
      error: errorMessage,
      response: '❌ I encountered an error processing your request. Please try again.'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
