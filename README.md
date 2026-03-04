# Arbitrum DAO Quest Board (v1)

A lightweight quest dashboard that turns governance updates into trackable checklist items.

## v1 Features

- Expandable cards for each governance topic.
- Mark-as-read buttons with live completion progress.
- Wallet login via signature (no gas).
- Supabase-backed progress sync per wallet address.

## Local run

```bash
python3 -m http.server 4173
```

Open `http://127.0.0.1:4173`.

## Wallet + Supabase configuration

This project reads credentials from `localStorage` so you can keep secrets out of source files.

1. Create a Supabase project.
2. Create a table named `quest_reads` with columns:
   - `wallet_address` (text, not null)
   - `quest_id` (text, not null)
   - `read_at` (timestamptz, not null, default `now()`)
3. Add a unique index on `(wallet_address, quest_id)`.
4. In the browser console, run:

```js
localStorage.setItem('supabase_url', 'https://YOUR-PROJECT.supabase.co');
localStorage.setItem('supabase_anon_key', 'YOUR-ANON-KEY');
```

5. Refresh, then click **Connect Wallet** and sign the login message.

If credentials are missing, the app still works in local-only mode.
