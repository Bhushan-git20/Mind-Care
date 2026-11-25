import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SYSTEM_PROMPT = `You are a mental health screening assistant analyzing student journal entries for risk indicators. 

Analyze the journal entry and return a JSON object with:
1. risk_level: "low", "medium", or "high"
   - "high": mentions of self-harm, suicide, hopelessness, wanting to die, or severe acute distress
   - "medium": significant sadness, anxiety, isolation, or prolonged emotional struggles
   - "low": normal emotional expression, positive or neutral content
2. mood_tags: array of 2-4 mood/emotion tags detected (e.g., "anxious", "hopeful", "stressed", "calm")
3. summary: brief 1-2 sentence supportive observation (do not diagnose, just acknowledge feelings)

IMPORTANT: Be sensitive, supportive, and non-clinical.
Return ONLY valid JSON.`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { content } = await req.json();
    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
    
    // Verify Authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized access.' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY');
    if (SUPABASE_URL && SUPABASE_ANON_KEY) {
      const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        global: { headers: { Authorization: authHeader } }
      });
      const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
      if (userError || !user) {
        return new Response(JSON.stringify({ error: 'Unauthorized user.' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }
    
    if (!GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is not configured in Supabase secrets');
    }

    if (!content || typeof content !== 'string' || content.trim().length < 10) {
      return new Response(JSON.stringify({ 
        risk_level: 'low',
        mood_tags: ['brief'],
        analysis: { summary: 'Entry too short for detailed sentiment analysis.' }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Limit entry length to prevent abusive payload sizes (max 4,000 characters)
    const sanitizedContent = content.slice(0, 4000);

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: {
            parts: [{ text: SYSTEM_PROMPT }],
          },
          contents: [
            {
              role: 'user',
              parts: [{ text: `Analyze this student journal entry:\n\n${sanitizedContent}` }],
            },
          ],
          generationConfig: {
            maxOutputTokens: 600,
            temperature: 0.2,
            response_mime_type: "application/json",
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini API error in analyze-journal:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ 
          error: 'Rate limit exceeded. Please try again later.',
          risk_level: 'low',
          mood_tags: ['reflective'],
          analysis: { summary: 'Sentiment analysis is temporarily busy. Your entry is safely saved.' }
        }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      throw new Error(`Gemini API returned HTTP ${response.status}`);
    }

    const data = await response.json();
    const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!textResponse) {
      throw new Error('Empty candidate response from Gemini API');
    }

    let analysis;
    try {
      analysis = JSON.parse(textResponse);
    } catch {
      // Clean fallback if raw JSON has trailing characters
      const cleanJson = textResponse.replace(/^```json/, '').replace(/```$/, '').trim();
      analysis = JSON.parse(cleanJson);
    }
    
    return new Response(JSON.stringify({
      risk_level: analysis.risk_level || 'low',
      mood_tags: Array.isArray(analysis.mood_tags) ? analysis.mood_tags : ['reflective'],
      analysis: { summary: analysis.summary || 'Entry recorded successfully.' }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in analyze-journal handler:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown internal error',
      risk_level: 'low',
      mood_tags: ['reflective'],
      analysis: { summary: 'Automated sentiment analysis currently unavailable.' }
    }), {
      status: 200, // Return 200 with fallback so client UI saves journal entry smoothly
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
