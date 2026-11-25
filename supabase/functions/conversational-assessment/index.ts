import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SYSTEM_INSTRUCTION = `You are MindMate, an intelligent, empathetic AI companion for student wellness.
Your goal is to conduct a conversational mental health assessment through natural, warm conversation.
You must evaluate the user's mood, anxiety, and safety.

INSTRUCTIONS:
1. Ask ONE thoughtful question at a time. Keep it conversational and empathetic.
2. If you DO NOT have enough context to confidently assess their risk level (usually takes 3-4 turns), set "isComplete": false and provide your next question in "replyText".
3. If the user mentions self-harm, suicide, or severe crisis, IMMEDIATELY set "isComplete": true and "riskLevel": "High". Provide a highly supportive "replyText" connecting them to crisis support.
4. Once you have a clear picture of their wellness, set "isComplete": true.
5. When "isComplete": true, provide "riskLevel" (Low, Medium, High), a "clinicalSummary" (for a student counselor), and "suggestedHabits" (1-3 actionable habits, e.g., "Sleep routine", "5-min mindfulness").

STRICT RULE: Return ONLY a raw JSON object matching the exact schema below:
{
  "isComplete": boolean,
  "replyText": "Your conversational response or next question to the user",
  "riskLevel": "Low" | "Medium" | "High" | null,
  "clinicalSummary": "Brief summary of their state if complete, else null",
  "suggestedHabits": ["Habit 1", "Habit 2"]
}`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, conversationHistory = [] } = await req.json();
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

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return new Response(JSON.stringify({ error: 'Please enter a message.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const recentHistory = conversationHistory.slice(-8);
    const contents: Array<{ role: string; parts: Array<{ text: string }> }> = [];

    for (const msg of recentHistory) {
      if (!msg.content || typeof msg.content !== 'string') continue;
      contents.push({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }]
      });
    }

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
            response_mime_type: "application/json"
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini error in conversational assessment:', response.status, errorText);
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    let aiMessage = data.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
    aiMessage = aiMessage.replace(/```json/g, '').replace(/```/g, '').trim();

    let parsedResponse;
    try {
      parsedResponse = JSON.parse(aiMessage);
    } catch {
      parsedResponse = {
        isComplete: false,
        replyText: "I'm having a little trouble understanding right now. Could you share a bit more about how you're feeling?",
        riskLevel: null,
        clinicalSummary: null,
        suggestedHabits: []
      };
    }

    return new Response(JSON.stringify(parsedResponse), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Conversational assessment error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error',
      isComplete: false,
      replyText: "I encountered a connection hiccup. How are you feeling today?",
      riskLevel: null,
      clinicalSummary: null,
      suggestedHabits: []
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
