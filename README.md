# FORMA — AI × Grasshopper Landing Page

A responsive Next.js landing page with live procedural 3D previews built in React Three Fiber, a guided chat demonstration, adjustable parametric geometry, and a Supabase-backed early-access form.

## Run locally

```bash
npm install
cp .env.example .env.local
npm run dev
```

Then open http://localhost:9191.

## Lead capture setup

1. Create a Supabase project.
2. Paste `supabase.sql` into the Supabase SQL editor and execute it.
3. Populate `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` in `.env.local`.
4. Restart Next.js, submit the form, and verify a row appears in `early_access_leads`.

**Security:** The service role key must never be prefixed `NEXT_PUBLIC_` or shared with client code. The API validates inputs and applies a light per-process rate limit and honeypot. Before a large public launch, add shared rate limiting / CAPTCHA (e.g. Cloudflare Turnstile).

Without Supabase credentials, the UI still works and the form returns a clear configuration error; it does not fake a successful submission.

## Launch checklist

- Change the temporary brand name FORMA if desired.
- Replace the `hello@example.com` footer contact email.
- Review the draft Privacy and Terms pages with counsel and add real operator details.
- Configure Supabase environment variables on your deployment host.
- Add analytics / consent configuration based on your jurisdiction.
- Deploy with Vercel or a Node.js host.

## What is functional?

- Procedural WebGL scenes (tower, facade, pavilion, roof).
- Drag-to-rotate previews and live parameter sliders.
- Four-step guided demonstration.
- A **limited deterministic command demo** for phrases like "make it 30 stories", "twist 8 degrees", "create a pavilion", and "make it taller".
- Mobile responsive layout.
- Backend early-access signup with Supabase persistence.

## What's *not* included

This is a landing-page concept prototype, not a functional Rhino/Grasshopper integration. The prompt interface is **not** connected to a live AI model. Real AI and model execution will require the Rhino MCP / Rhino.Compute integration and orchestration discussed separately. This limitation is explicitly displayed inside the demo.

## Tech stack

Next.js 15, React 19, TypeScript, Three.js, React Three Fiber, Drei, Framer Motion, CSS.
