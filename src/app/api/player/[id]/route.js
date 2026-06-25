import { NextResponse } from 'next/server';
import '../../../../lib/dns-init';

export async function GET(request, { params }) {
  const { id } = params;
  const { searchParams } = new URL(request.url);
  const season = searchParams.get('season');
  const episode = searchParams.get('episode');

  if (!id) {
    return new NextResponse('IMDb ID is required', { status: 400 });
  }

  // Construct target URL to fetch player HTML from balancer
  let targetUrl = `https://api.namy.ws/embed/imdb/${id}`;
  const queryParts = [];
  if (season) queryParts.push(`season=${season}`);
  if (episode) queryParts.push(`episode=${episode}`);
  if (queryParts.length > 0) {
    targetUrl += `?${queryParts.join('&')}`;
  }

  try {
    const res = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': 'https://api.namy.ws/'
      }
    });

    if (!res.ok) {
      return new NextResponse(`Error fetching player page: ${res.status}`, { status: res.status });
    }

    let html = await res.text();

    // Override adsConfig in the script to block pre-rolls, mid-rolls, and post-rolls
    const cleanAdsConfig = `
      var adsConfig = {
        nonLinear: null,
        pre: null,
        middle: null,
        post: null,
        confirmTimeout: 0,
        confirmOn: [],
        vast: null
      };
    `;

    // Strip/replace the script data-name="ad" block entirely
    html = html.replace(/<script data-name="ad">[\s\S]*?<\/script>/, `<script data-name="ad">${cleanAdsConfig}</script>`);

    // Inject styles to hide any potential floating ad banners
    const injectStyle = `
      <style>
        /* Hide floating ads, popup scripts elements */
        div[class*="ads"], div[id*="ads"], iframe[src*="vuegenesisvue"], div[style*="z-index: 2147483647"], iframe[src*="getsdk"] {
          display: none !important;
          visibility: hidden !important;
          opacity: 0 !important;
          pointer-events: none !important;
          width: 0 !important;
          height: 0 !important;
        }
      </style>
    `;
    html = html.replace('</head>', `${injectStyle}</head>`);

    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-store, max-age=0'
      }
    });
  } catch (error) {
    return new NextResponse(`Server error: ${error.message}`, { status: 500 });
  }
}
