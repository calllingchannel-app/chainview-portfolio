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

    const { messages, image } = await req.json();
    console.log('Received request with', messages?.length, 'messages, image:', !!image);

    // Build the messages for the AI
    const systemPrompt = `You are HAVX AI, an expert cryptocurrency and stock trading analyst. You provide accurate, real-time market analysis and trading insights.

Your capabilities:
- Technical analysis of charts and price patterns
- Fundamental analysis of crypto projects and stocks
- Market sentiment analysis
- Trading strategy recommendations
- Risk assessment and portfolio advice

Guidelines:
- Be concise but thorough
- Use specific numbers and data when possible
- Always mention that this is not financial advice
- Identify patterns like head and shoulders, double tops/bottoms, triangles, etc.
- Calculate and mention key indicators like RSI, MACD, support/resistance levels
- Consider both bullish and bearish scenarios

Format responses with clear sections using markdown:
- Use **bold** for emphasis
- Use bullet points for lists
- Use code blocks for specific values
- Keep paragraphs short and readable`;

    // Convert messages to API format
    const apiMessages: any[] = [
      { role: "system", content: systemPrompt }
    ];

    for (const msg of messages || []) {
      if (msg.role === "assistant") {
        apiMessages.push({ role: "assistant", content: msg.content });
      } else if (msg.role === "user") {
        // Handle multimodal (image + text)
        if (msg.imageUrl && msg.imageUrl.startsWith('data:image')) {
          apiMessages.push({
            role: "user",
            content: [
              { type: "text", text: msg.content || "Analyze this trading chart in detail." },
              { 
                type: "image_url", 
                image_url: { url: msg.imageUrl }
              }
            ]
          });
        } else {
          apiMessages.push({ role: "user", content: msg.content });
        }
      }
    }

    // If there's a standalone image, add it
    if (image && !messages?.some((m: any) => m.imageUrl)) {
      apiMessages.push({
        role: "user",
        content: [
          { type: "text", text: "Analyze this trading chart in detail. Identify patterns, trends, support/resistance levels, and provide trading recommendations." },
          { type: "image_url", image_url: { url: image } }
        ]
      });
    }

    console.log('Sending to AI gateway with', apiMessages.length, 'messages');

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
          error: 'Rate limit exceeded. Please try again in a moment.',
          response: 'I apologize, but the service is currently experiencing high demand. Please try again in a few seconds.'
        }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      if (response.status === 402) {
        return new Response(JSON.stringify({ 
          error: 'Service credits exhausted.',
          response: 'The AI service needs additional credits. Please contact support.'
        }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      throw new Error(`AI service error: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.choices?.[0]?.message?.content || 'I apologize, but I could not generate a response. Please try again.';
    
    console.log('AI response received, length:', aiResponse.length);

    return new Response(JSON.stringify({ response: aiResponse }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    console.error('Error in trading-agent function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ 
      error: errorMessage,
      response: 'I encountered an error processing your request. Please try again.'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
