import { NextResponse } from 'next/server';

export async function GET(request, { params }) {
  const { size, path } = params;
  
  if (!size || !path) {
    return new Response(null, { status: 400 });
  }
  
  const cleanPath = Array.isArray(path) ? path.join('/') : path;
  const url = `https://i0.wp.com/image.tmdb.org/t/p/${size}/${cleanPath}`;

  try {
    const res = await fetch(url);
    if (!res.ok) {
      return new Response(null, { status: res.status });
    }

    const blob = await res.blob();
    const contentType = res.headers.get('content-type') || 'image/jpeg';

    return new Response(blob, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=2592000', // 30 days cache
      },
    });
  } catch (error) {
    return new Response(null, { status: 500 });
  }
}
