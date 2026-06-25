import { NextResponse } from 'next/server';
import '../../../lib/dns-init';

const TMDB_API_KEY = "431a8708161bcd1f1fbe7536137e61ed";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('query');
  const type = searchParams.get('type') || 'movie';
  const page = searchParams.get('page') || '1';

  if (!query) {
    return NextResponse.json({ error: 'Query parameter is required' }, { status: 400 });
  }

  let url = '';
  if (type === 'movie') {
    url = "https://api.themoviedb.org/3/search/movie";
  } else if (type === 'tv') {
    url = "https://api.themoviedb.org/3/search/tv";
  } else {
    return NextResponse.json({ error: 'Invalid search type' }, { status: 400 });
  }

  try {
    const targetUrl = new URL(url);
    targetUrl.searchParams.set('api_key', TMDB_API_KEY);
    targetUrl.searchParams.set('query', query);
    targetUrl.searchParams.set('language', 'ru-RU');
    targetUrl.searchParams.set('page', page);

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
