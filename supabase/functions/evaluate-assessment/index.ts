import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { responses, questions } = await req.json();

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

    // Strictly use GEMINI_API_KEY
    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
    if (!GEMINI_API_KEY) {
      throw new Error("Missing GEMINI_API_KEY in environment secrets");
    }

    if (!Array.isArray(responses) || !Array.isArray(questions)) {
      return new Response(JSON.stringify({ error: 'Invalid responses or questions payload.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const prompt = `
    You are an expert student wellness evaluator. A student has just completed a mental wellness screening (PHQ-9 and GAD-7).
    
    Here are the questions and responses (0 = Not at all, 1 = Several days, 2 = More than half the days, 3 = Nearly every day):
    ${questions.map((q: { text: string } | string, i: number) => `Q: ${typeof q === 'string' ? q : q.text} | Answer: ${responses[i] ?? 0}`).join('\n')}

    Analyze these responses with clinical empathy and context.
    Respond in JSON format with exactly this structure:
    {
      "overallRisk": "low" | "medium" | "high",
      "overallInterpretation": "A 2-3 sentence compassionate, non-diagnostic summary of their current mental wellness state."
    }
    `;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: prompt }]
        }],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 400,
          response_mime_type: "application/json",
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Gemini evaluation error (${response.status}):`, errorText);
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
      throw new Error("Empty candidate output from Gemini");
    }

    let aiResponse;
    try {
      aiResponse = JSON.parse(text);
    } catch {
      const cleanJson = text.replace(/^```json/, '').replace(/```$/, '').trim();
      aiResponse = JSON.parse(cleanJson);
    }

    return new Response(JSON.stringify(aiResponse), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error evaluating assessment:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : "Unknown error",
      overallRisk: "medium",
      overallInterpretation: "Your screening scores have been recorded. Please review the breakdown below."
    }), {
      status: 200, // Return graceful fallback to client
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
