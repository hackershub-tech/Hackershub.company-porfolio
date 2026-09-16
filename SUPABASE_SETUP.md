# Supabase setup

1. Create a Supabase project.
2. Open **SQL Editor** and run [`supabase-schema.sql`](./supabase-schema.sql).
3. In **Project Settings > API**, copy the Project URL and the `anon` public key.
4. Paste them into [`supabase-config.js`](./supabase-config.js):

```js
window.HEACKERSHUB_SUPABASE = {
  url: 'https://your-project.supabase.co',
  anonKey: 'your-anon-key'
};
```

Only the public `anon` key belongs in this browser app. Never use the
`service_role` key in frontend files.

The contact form stores new enquiries in `project_leads` and calls the
`submit-lead` Edge Function to send an email notification.

## Email notifications

Install the Supabase CLI, log in, link the project, then run these commands
from the project folder:

```bash
supabase functions deploy submit-lead --no-verify-jwt
supabase secrets set RESEND_API_KEY=re_xxxxxxxxx
supabase secrets set NOTIFY_EMAIL=hackershub.company@gmail.com
supabase secrets set FROM_EMAIL="HeackersHub Website <onboarding@resend.dev>"
```

Create a free account at [Resend](https://resend.com), copy its API key, and
replace `re_xxxxxxxxx` above. Resend's `onboarding@resend.dev` sender is
intended for testing and can send to the email address used for the Resend
account. For production, verify the company's domain in Resend and set
`FROM_EMAIL` to an address on that domain.

The function uses the Supabase service role key only on the server and sends
notifications to `hackershub.company@gmail.com`. Never put either API secret
in browser files.
