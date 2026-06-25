import { NextResponse } from 'next/server';

export async function GET() {
  const results = {};

  // Test 1: Google
  try {
    const res = await fetch("https://www.google.com", { next: { revalidate: 0 } });
    results["google"] = { status: res.status, ok: res.ok };
  } catch (e) {
    results["google"] = { ok: false, error: e.message, type: e.name };
  }

  // Test 2: Httpbin (external IP check)
  try {
    const res = await fetch("https://httpbin.org/ip", { next: { revalidate: 0 } });
    if (res.ok) {
      const data = await res.json();
      results["httpbin"] = { status: res.status, data, ok: true };
    } else {
      results["httpbin"] = { status: res.status, ok: false };
    }
  } catch (e) {
    results["httpbin"] = { ok: false, error: e.message, type: e.name };
  }

  // Test 3: TMDB API
  try {
    const res = await fetch("https://api.themoviedb.org/3/trending/movie/week?api_key=431a8708161bcd1f1fbe7536137e61ed", { next: { revalidate: 0 } });
    results["tmdb"] = { status: res.status, ok: res.ok };
  } catch (e) {
    results["tmdb"] = { ok: false, error: e.message, type: e.name };
  }

  return NextResponse.json(results);
}
