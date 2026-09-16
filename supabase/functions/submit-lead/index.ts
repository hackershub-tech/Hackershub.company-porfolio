import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

const json = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  const payload = await request.json();
  const name = String(payload.name || '').trim();
  const email = String(payload.email || '').trim();
  const projectType = String(payload.project_type || '').trim();
  const message = String(payload.message || '').trim();

  if (name.length < 2 || name.length > 120 ||
      email.length < 5 || email.length > 254 ||
      projectType.length < 2 || projectType.length > 120 ||
      message.length < 10 || message.length > 5000) {
    return json({ error: 'Please provide valid enquiry details.' }, 400);
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  const { data: lead, error: insertError } = await supabase
    .from('project_leads')
    .insert({ name, email, project_type: projectType, message, source: 'website-contact' })
    .select('id, name, email, project_type, message, created_at')
    .single();

  if (insertError) {
    console.error('Lead insert failed:', insertError);
    return json({ error: 'Could not save enquiry.' }, 500);
  }

  const resendKey = Deno.env.get('RESEND_API_KEY');
  const notifyEmail = Deno.env.get('NOTIFY_EMAIL') ?? 'hackershub.company@gmail.com';
  const fromEmail = Deno.env.get('FROM_EMAIL') ?? 'HeackersHub Website <onboarding@resend.dev>';

  if (!resendKey) {
    console.error('RESEND_API_KEY is not configured.');
    return json({ success: false, leadId: lead.id }, 503);
  }

  const emailResponse = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${resendKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from: fromEmail,
      to: [notifyEmail],
      reply_to: email,
      subject: `New project enquiry from ${name}`,
      text: [
        `Name: ${name}`,
        `Email: ${email}`,
        `Project type: ${projectType}`,
        '',
        'Message:',
        message,
        '',
        `Lead ID: ${lead.id}`
      ].join('\n')
    })
  });

  if (!emailResponse.ok) {
    console.error('Notification email failed:', await emailResponse.text());
    return json({ success: false, leadId: lead.id }, 502);
  }

  return json({ success: true, leadId: lead.id });
});
