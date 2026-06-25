import { NextResponse } from 'next/server';
import '../../../lib/dns-init';

const TMDB_API_KEY = "431a8708161bcd1f1fbe7536137e61ed";

function isFutureDate(dateStr) {
  if (!dateStr) return false;
  try {
    const releaseDate = new Date(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    releaseDate.setHours(0, 0, 0, 0);
    return releaseDate > today;
  } catch (e) {
    return false;
  }
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type') || 'movie';
  const category = searchParams.get('category') || 'trending';
  const page = searchParams.get('page') || '1';

  let url = '';
  if (category === 'trending') {
    url = `https://api.themoviedb.org/3/trending/${type}/week`;
  } else if (type === 'movie') {
    if (category === 'popular') url = "https://api.themoviedb.org/3/movie/popular";
    else if (category === 'now_playing') url = "https://api.themoviedb.org/3/movie/now_playing";
    else if (category === 'top_rated') url = "https://api.themoviedb.org/3/movie/top_rated";
    else if (category === 'upcoming') url = "https://api.themoviedb.org/3/movie/upcoming";
  } else if (type === 'tv') {
    if (category === 'popular') url = "https://api.themoviedb.org/3/tv/popular";
    else if (category === 'on_the_air') url = "https://api.themoviedb.org/3/tv/on_the_air";
    else if (category === 'top_rated') url = "https://api.themoviedb.org/3/tv/top_rated";
    else if (category === 'airing_today') url = "https://api.themoviedb.org/3/tv/airing_today";
  }

  if (!url) {
    return NextResponse.json({ error: 'Invalid category or type' }, { status: 400 });
  }

  try {
    const targetUrl = new URL(url);
    targetUrl.searchParams.set('api_key', TMDB_API_KEY);
    targetUrl.searchParams.set('language', 'ru-RU');
    targetUrl.searchParams.set('page', page);

    const res = await fetch(targetUrl.toString());
    if (!res.ok) {
      const errorText = await res.text();
      return NextResponse.json({ error: `TMDB API error: ${errorText}` }, { status: res.status });
    }

    const data = await res.json();
    const results = data.results || [];
    const filteredResults = [];

    for (const item of results) {
      const dateStr = item.release_date || item.first_air_date || '';
      const future = isFutureDate(dateStr);

      if (category === 'upcoming') {
        if (future) filteredResults.push(item);
      } else {
        if (!future) filteredResults.push(item);
      }
    }

    data.results = filteredResults;
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
