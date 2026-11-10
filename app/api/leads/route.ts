import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

// Light per-instance abuse guard. Add a shared edge/WAF rate limiter before high-traffic launch.
const attempts = new Map<string, { count: number; reset: number }>();
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    const now = Date.now();
    const record = attempts.get(ip);
    const rate = !record || record.reset < now ? { count: 1, reset: now + 60_000 } : { count: record.count + 1, reset: record.reset };
    attempts.set(ip, rate);
    if (rate.count > 6) return NextResponse.json({ error: 'Too many attempts. Please try again later.' }, { status: 429 });

    const input = await request.json();
    if (input.website) return NextResponse.json({ ok: true }); // honeypot
    const name = String(input.name || '').trim().slice(0, 120);
    const email = String(input.email || '').trim().toLowerCase().slice(0, 254);
    const role = String(input.role || '').trim().slice(0, 50);
    const interest = String(input.interest || '').trim().slice(0, 1000);
    const allowedRoles = ['Architect', 'Computational designer', 'Engineer', 'Student', 'Other'];
    if (name.length < 2 || !emailPattern.test(email) || !allowedRoles.includes(role)) {
      return NextResponse.json({ error: 'Please check your name, email and role.' }, { status: 400 });
    }

    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key || url.includes('YOUR_PROJECT')) {
      return NextResponse.json({ error: 'Early access submissions are not configured yet. Please contact the site owner.' }, { status: 503 });
    }

    const result = await fetch(`${url.replace(/\/$/, '')}/rest/v1/early_access_leads?on_conflict=email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', apikey: key, Authorization: `Bearer ${key}`, Prefer: 'resolution=ignore-duplicates,return=minimal' },
      body: JSON.stringify({ name, email, role, interest: interest || null }),
      cache: 'no-store',
    });
    if (!result.ok) {
      console.error('Lead insert failed', result.status, await result.text());
      return NextResponse.json({ error: 'Could not complete registration. Try again shortly.' }, { status: 502 });
    }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }
}
