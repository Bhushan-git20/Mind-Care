import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const CRISIS_PATTERNS = [
  'suicide', 'kill myself', 'end my life', 'want to die', 'better off dead',
  'self-harm', 'cutting', 'overdose', 'hang myself'
];

const SYSTEM_PROMPT = `You are an empathetic AI community moderator for a student mental wellness app.
Analyze the user's community post content. 
If it contains guidelines violations like self-harm instructions or encouragement, severe active crisis, harassment, hate speech, or abuse, flag it as unsafe.
Otherwise, positive student sharing (even expressing sadness or seeking support) is safe.

Return ONLY a valid JSON object:
{
  "isSafe": boolean,
  "reason": "If unsafe, provide a brief, supportive reason why it cannot be posted and offer help (e.g., 'If you are struggling with distressing thoughts, please connect with a helpline at 9152987821.'). If safe, leave as an empty string."
}`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { content } = await req.json();
    // Strictly use GEMINI_API_KEY
    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');

    // Verify Authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ isSafe: false, reason: 'Unauthorized access.' }), {
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
        return new Response(JSON.stringify({ isSafe: false, reason: 'Unauthorized user.' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return new Response(JSON.stringify({ isSafe: false, reason: "Post cannot be empty." }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const trimmedContent = content.trim().slice(0, 2000);
    const lower = trimmedContent.toLowerCase();

    // Fast-path deterministic crisis check before external API call
    const hasCrisis = CRISIS_PATTERNS.some(p => lower.includes(p));
    if (hasCrisis) {
      return new Response(JSON.stringify({
        isSafe: false,
        reason: "Your post mentions severe crisis or self-harm. Please contact the iCall Psychosocial Helpline (9152987821) or NIMHANS (080-46110007) for immediate support."
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!GEMINI_API_KEY) {
      console.warn("GEMINI_API_KEY not configured. Applied deterministic safety guardrail only.");
      return new Response(JSON.stringify({ isSafe: true, reason: "" }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

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
              parts: [{ text: trimmedContent }],
            },
          ],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 300,
            response_mime_type: "application/json",
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Gemini moderation error (${response.status}):`, errorText);
      // Fallback: If AI fails but deterministic crisis check passed, accept post safely
      return new Response(JSON.stringify({ isSafe: true, reason: "" }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const data = await response.json();
    const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!textResponse) {
      throw new Error('No candidate content returned from Gemini');
    }

    let result;
    try {
      result = JSON.parse(textResponse);
    } catch {
      const cleanJson = textResponse.replace(/^```json/, '').replace(/```$/, '').trim();
      result = JSON.parse(cleanJson);
    }
    
    return new Response(JSON.stringify({
      isSafe: result.isSafe ?? true,
      reason: result.reason || ""
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in moderate-post handler:', error);
    return new Response(JSON.stringify({ 
      isSafe: false,
      reason: "Post could not be moderated at this time. Please try again in a few moments." 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
