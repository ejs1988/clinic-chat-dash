import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const n8nWebhookUrl = Deno.env.get('N8N_WEBHOOK_URL')!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { sessionId, message, senderType = 'human' } = await req.json();

    console.log('Received message:', { sessionId, message, senderType });

    if (!sessionId || !message) {
      return new Response(
        JSON.stringify({ error: 'sessionId and message are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Insert human message into Supabase
    const messageData = {
      session_id: sessionId,
      message: {
        type: senderType,
        content: message,
        timestamp: new Date().toISOString()
      }
    };

    const { error: insertError } = await supabase
      .from('n8n_chat_histories')
      .insert(messageData);

    if (insertError) {
      console.error('Error inserting message:', insertError);
      return new Response(
        JSON.stringify({ error: 'Failed to save message' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Message saved to database');

    // Send to n8n webhook
    const n8nPayload = {
      sessionId,
      message,
      senderType,
      timestamp: new Date().toISOString()
    };

    const n8nResponse = await fetch(n8nWebhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(n8nPayload),
    });

    console.log('n8n response status:', n8nResponse.status);

    if (n8nResponse.ok) {
      const n8nData = await n8nResponse.json();
      console.log('n8n response:', n8nData);

      // If n8n returns a response message, save it too
      if (n8nData.response) {
        const aiMessageData = {
          session_id: sessionId,
          message: {
            type: 'ai',
            content: n8nData.response,
            timestamp: new Date().toISOString()
          }
        };

        const { error: aiInsertError } = await supabase
          .from('n8n_chat_histories')
          .insert(aiMessageData);

        if (aiInsertError) {
          console.error('Error inserting AI message:', aiInsertError);
        } else {
          console.log('AI response saved to database');
        }
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Message sent successfully',
          n8nResponse: n8nData 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else {
      console.error('n8n webhook failed:', n8nResponse.status, await n8nResponse.text());
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Message saved but n8n webhook failed',
          error: 'n8n webhook error'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

  } catch (error) {
    console.error('Error in chat-proxy function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});