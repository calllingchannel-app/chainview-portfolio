import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
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

    const systemPrompt = `You are an expert cryptocurrency and stock technical analyst. Analyze the provided trading chart image and return a detailed analysis in JSON format.

You MUST respond with ONLY valid JSON, no additional text. The JSON must follow this exact structure:

{
  "symbol": "${symbol?.toUpperCase() || 'BTC'}",
  "currentPrice": 95000,
  "high24h": 96500,
  "low24h": 93200,
  "marketCap": "1.87T",
  "volume24h": "42.3B",
  "signal": "STRONG_BUY",
  "confidence": 78,
  "pattern": "Ascending Triangle",
  "rsi": 58,
  "rsiSignal": "Neutral - Room to grow",
  "macd": 125.5,
  "macdSignal": "Bullish crossover",
  "sma20": 94200,
  "sma20Signal": "Price above SMA20",
  "sma50": 92800,
  "sma50Signal": "Bullish trend confirmed",
  "volumeRatio": "1.35x",
  "volumeSignal": "Above average volume",
  "volatility": "Medium",
  "volatilitySignal": "Normal market conditions",
  "support1": 93000,
  "support2": 91500,
  "support3": 89000,
  "resistance1": 97000,
  "resistance2": 99500,
  "resistance3": 102000,
  "prediction24h": "+2.5%",
  "prediction7d": "+8.2%",
  "prediction30d": "+15.4%",
  "analysis": "The chart shows a strong bullish pattern with price consolidating above key support. Volume is increasing and momentum indicators are positive. Key resistance at $97,000 needs to break for continuation.",
  "recommendations": [
    "Consider accumulating on dips to support levels",
    "Set stop-loss below $91,500 for risk management",
    "Take partial profits at resistance levels",
    "Watch for breakout above $97,000 for continuation signal"
  ]
}

Analyze the actual chart image provided and generate realistic values based on what you see. Signal should be one of: STRONG_BUY, BUY, NEUTRAL, SELL, STRONG_SELL. Confidence should be 0-100.`;

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
              { type: "text", text: `Analyze this ${symbol || 'cryptocurrency'} trading chart and provide detailed technical analysis in JSON format.` },
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
          symbol: symbol?.toUpperCase() || 'BTC',
          currentPrice: 0,
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
    
    console.log('AI response received, parsing JSON');

    // Extract JSON from the response (handle markdown code blocks)
    let jsonStr = aiResponse;
    const jsonMatch = aiResponse.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1].trim();
    }
    
    // Try to find JSON object if not in code block
    if (!jsonStr.startsWith('{')) {
      const objectMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (objectMatch) {
        jsonStr = objectMatch[0];
      }
    }

    let analysis;
    try {
      analysis = JSON.parse(jsonStr);
    } catch (parseError) {
      console.error('Failed to parse AI response as JSON:', parseError);
      // Return a default response
      analysis = {
        symbol: symbol?.toUpperCase() || 'BTC',
        currentPrice: 95000,
        high24h: 96500,
        low24h: 93200,
        marketCap: "1.87T",
        volume24h: "42.3B",
        signal: "NEUTRAL",
        confidence: 50,
        pattern: "Consolidation",
        rsi: 50,
        rsiSignal: "Neutral",
        macd: 0,
        macdSignal: "Neutral",
        sma20: 94000,
        sma20Signal: "Neutral",
        sma50: 93000,
        sma50Signal: "Neutral",
        volumeRatio: "1.0x",
        volumeSignal: "Average",
        volatility: "Medium",
        volatilitySignal: "Normal",
        support1: 92000,
        support2: 90000,
        support3: 88000,
        resistance1: 97000,
        resistance2: 99000,
        resistance3: 101000,
        prediction24h: "+1.0%",
        prediction7d: "+3.0%",
        prediction30d: "+5.0%",
        analysis: "Analysis could not be completed. Please upload a clearer chart image.",
        recommendations: ["Upload a clearer chart image for better analysis"]
      };
    }

    console.log('Returning analysis for', analysis.symbol);

    return new Response(JSON.stringify(analysis), {
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
