import { NextResponse } from 'next/server';

const TMDB_API_KEY = "431a8708161bcd1f1fbe7536137e61ed";

export async function GET(request, { params }) {
  const { id, seasonNum } = params;

  if (!id || !seasonNum) {
    return NextResponse.json({ error: 'TV ID and Season Number are required' }, { status: 400 });
  }

  const url = `https://api.themoviedb.org/3/tv/${id}/season/${seasonNum}`;

  try {
    const targetUrl = new URL(url);
    targetUrl.searchParams.set('api_key', TMDB_API_KEY);
    targetUrl.searchParams.set('language', 'ru-RU');

    const res = await fetch(targetUrl.toString());
    if (!res.ok) {
      return NextResponse.json({ error: 'TMDB API error' }, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
