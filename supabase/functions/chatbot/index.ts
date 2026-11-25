import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const CRISIS_KEYWORDS = [
  'suicide', 'kill myself', 'end my life', 'want to die', 'better off dead',
  'self-harm', 'hurt myself', 'cutting', 'overdose', 'no reason to live'
];

const CRISIS_RESPONSE = {
  type: 'crisis',
  message: `I'm concerned about what you've shared. Your safety matters, and I want to make sure you get the right support.

**If you're in immediate danger, please:**
- Call **9152987821** (iCall Psychosocial Helpline)
- Call **1860-2662-345** (Vandrevala Foundation — 24/7)
- Call **080-46110007** (NIMHANS Helpline)
- Go to your nearest hospital emergency ward
- Contact your campus counseling centre

You don't have to face this alone. A trained counsellor can help you through this moment.

Would you like me to share some campus resources?`
};

const SYSTEM_INSTRUCTION = `You are a supportive, empathetic mental wellness assistant for a student platform. Your role is to:

1. Provide psychoeducation about common student challenges (anxiety, stress, depression, sleep, exam pressure)
2. Suggest evidence-based coping strategies and mindfulness exercises
3. Offer encouragement and validation
4. Guide users to appropriate student and campus resources

STRICT BOUNDARIES - You must NEVER:
- Provide clinical diagnoses
- Prescribe medications or dosages
- Offer therapy or psychiatric treatment
- Claim to replace professional healthcare
- Give medical advice

ALWAYS:
- Remind students this is a self-guided support tool, not medical therapy
- Encourage seeking professional counseling for persistent distress
- If crisis or self-harm is mentioned, prioritize safety immediately
- Keep responses warm, brief (2-3 paragraphs max), and actionable
- Use "I" statements sparingly, focus on "you"`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, conversationHistory = [] } = await req.json();
    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SERVICE_ROLE_KEY');
    const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY');

    // Verify Authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ type: 'error', message: 'Unauthorized access.' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (SUPABASE_URL && SUPABASE_ANON_KEY) {
      const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        global: { headers: { Authorization: authHeader } }
      });
      const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
      if (userError || !user) {
        return new Response(JSON.stringify({ type: 'error', message: 'Unauthorized user.' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return new Response(JSON.stringify({ type: 'error', message: 'Please enter a message.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const lowerMessage = message.toLowerCase();

    // =========================================================================
    // Tier 1: Crisis Keyword Check (Deterministic Safety Guardrail)
    // =========================================================================
    const hasCrisisKeyword = CRISIS_KEYWORDS.some(keyword => lowerMessage.includes(keyword));
    if (hasCrisisKeyword) {
      return new Response(JSON.stringify(CRISIS_RESPONSE), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // =========================================================================
    // Tier 2: FAQ Knowledge Base Matching (Database Lookup)
    // =========================================================================
    if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
      const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
      
      const { data: faqs } = await supabase
        .from('chatbot_faqs')
        .select('*')
        .eq('is_active', true);

      if (faqs && faqs.length > 0) {
        for (const faq of faqs) {
          const keywords = faq.keywords || [];
          const matchesKeyword = keywords.some((kw: string) => lowerMessage.includes(kw.toLowerCase()));
          const matchesQuestion = faq.question.toLowerCase().split(' ').some((word: string) => 
            word.length > 3 && lowerMessage.includes(word)
          );

          if (matchesKeyword || matchesQuestion) {
            return new Response(JSON.stringify({
              type: 'faq',
              message: faq.answer,
              category: faq.category
            }), {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          }
        }
      }
    }

    // =========================================================================
    // Tier 3: Direct Google Gemini 2.5 Flash API (Decoupled from 3rd-party gateways)
    // =========================================================================
    if (!GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is not configured in Supabase secrets');
    }

    // Prepare multi-turn contents for Gemini API (user / model roles)
    const recentHistory = conversationHistory.slice(-8);
    const contents: Array<{ role: string; parts: Array<{ text: string }> }> = [];

    for (const msg of recentHistory) {
      if (!msg.content || typeof msg.content !== 'string') continue;
      contents.push({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }]
      });
    }

    // Append current user message
    contents.push({
      role: 'user',
      parts: [{ text: message.trim() }]
    });

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          system_instruction: {
            parts: [{ text: SYSTEM_INSTRUCTION }]
          },
          contents,
          generationConfig: {
            maxOutputTokens: 600,
            temperature: 0.7,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini API error in chatbot:', response.status, errorText);

      if (response.status === 429) {
        return new Response(JSON.stringify({ 
          type: 'error',
          message: "I'm experiencing high demand right now. Please take a mindful breath and try again in a moment." 
        }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    const aiMessage = data.candidates?.[0]?.content?.parts?.[0]?.text
      ?? "I'm here to listen. Could you share a bit more about what you're experiencing?";

    return new Response(JSON.stringify({
      type: 'ai',
      message: aiMessage
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Chatbot error:', error);
    return new Response(JSON.stringify({ 
      type: 'error',
      message: 'I encountered an issue connecting right now. Please try again or reach out to campus counseling for immediate support.'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
