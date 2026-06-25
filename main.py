import os
import time
import json
from datetime import datetime
import asyncio
import logging
import httpx
from fastapi import FastAPI, Request, Response, HTTPException
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.templating import Jinja2Templates

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("movister")

app = FastAPI(title="Movister")

# Setup templates
templates = Jinja2Templates(directory="templates")

TMDB_API_KEY = "431a8708161bcd1f1fbe7536137e61ed"
PROWLARR_API_KEY = "b5c11c9835d047a18d28bffb2b72cf4a"
PROWLARR_URL = "http://prowlarr-filmix:9696"
QB_URL = "http://qbittorrent-filmix:8089"
QB_USER = "remap"
QB_PASS = "525587gg"

async def qb_login(client: httpx.AsyncClient) -> httpx.Cookies:
    login_url = f"{QB_URL}/api/v2/auth/login"
    r = await client.post(login_url, data={"username": QB_USER, "password": QB_PASS})
    if r.status_code in (200, 204):
        return r.cookies
    raise Exception(f"Status {r.status_code}: {r.text}")

@app.get("/", response_class=HTMLResponse)
async def read_root(request: Request):
    return templates.TemplateResponse(request=request, name="index.html", context={})

# Watchlist Helpers
WATCHLIST_PATH = "/config/watchlist.json"

def read_watchlist() -> list:
    if not os.path.exists(WATCHLIST_PATH):
        return []
    try:
        with open(WATCHLIST_PATH, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception as e:
        logger.error(f"Error reading watchlist: {e}")
        return []

def write_watchlist(data: list):
    try:
        os.makedirs(os.path.dirname(WATCHLIST_PATH), exist_ok=True)
        with open(WATCHLIST_PATH, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
    except Exception as e:
        logger.error(f"Error writing watchlist: {e}")

async def get_tv_watchlist_details(client: httpx.AsyncClient, item: dict):
    item["new_episode"] = False
    if item.get("type") != "tv":
        return item
    try:
        url = f"https://api.themoviedb.org/3/tv/{item['id']}"
        r = await client.get(url, params={"api_key": TMDB_API_KEY, "language": "ru-RU"})
        if r.status_code == 200:
            tv_data = r.json()
            last_ep = tv_data.get("last_episode_to_air")
            if last_ep and last_ep.get("air_date"):
                air_date_str = last_ep["air_date"]
                air_date = datetime.strptime(air_date_str, "%Y-%m-%d").date()
                today = datetime.now().date()
                delta = today - air_date
                if 0 <= delta.days <= 7:
                    item["new_episode"] = True
                    item["new_episode_info"] = f"С{last_ep.get('season_number')}Э{last_ep.get('episode_number')}"
    except Exception as e:
        logger.error(f"Error checking TV show {item['id']} for watchlist: {e}")
    return item

@app.get("/api/trending")
async def get_trending_legacy():
    return await get_catalog(type="movie", category="trending", page=1)

def is_future_date(date_str: str) -> bool:
    if not date_str:
        return False
    try:
        release_date = datetime.strptime(date_str, "%Y-%m-%d").date()
        return release_date > datetime.now().date()
    except Exception:
        return False

@app.get("/api/catalog")
async def get_catalog(type: str = "movie", category: str = "trending", page: int = 1):
    if category == "trending":
        url = f"https://api.themoviedb.org/3/trending/{type}/week"
    elif type == "movie":
        if category == "popular":
            url = "https://api.themoviedb.org/3/movie/popular"
        elif category == "now_playing":
            url = "https://api.themoviedb.org/3/movie/now_playing"
        elif category == "top_rated":
            url = "https://api.themoviedb.org/3/movie/top_rated"
        elif category == "upcoming":
            url = "https://api.themoviedb.org/3/movie/upcoming"
        else:
            raise HTTPException(status_code=400, detail="Invalid category for movie")
    elif type == "tv":
        if category == "popular":
            url = "https://api.themoviedb.org/3/tv/popular"
        elif category == "on_the_air":
            url = "https://api.themoviedb.org/3/tv/on_the_air"
        elif category == "top_rated":
            url = "https://api.themoviedb.org/3/tv/top_rated"
        elif category == "airing_today":
            url = "https://api.themoviedb.org/3/tv/airing_today"
        else:
            raise HTTPException(status_code=400, detail="Invalid category for TV")
    else:
        raise HTTPException(status_code=400, detail="Invalid type")

    params = {
        "api_key": TMDB_API_KEY,
        "language": "ru-RU",
        "page": page
    }
    async with httpx.AsyncClient(timeout=15.0) as client:
        try:
            r = await client.get(url, params=params)
            if r.status_code != 200:
                raise HTTPException(status_code=r.status_code, detail=f"TMDB API error: {r.text}")
            
            data = r.json()
            results = data.get("results", [])
            filtered_results = []
            
            for item in results:
                date_str = item.get("release_date") or item.get("first_air_date") or ""
                future = is_future_date(date_str)
                
                if category == "upcoming":
                    if future:
                        filtered_results.append(item)
                else:
                    if not future:
                        filtered_results.append(item)
                        
            data["results"] = filtered_results
            return data
        except Exception as e:
            logger.exception(f"Error fetching catalog '{category}' for {type}")
            raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/search")
async def search_catalog(query: str, type: str = "movie", page: int = 1):
    if type == "movie":
        url = "https://api.themoviedb.org/3/search/movie"
    elif type == "tv":
        url = "https://api.themoviedb.org/3/search/tv"
    else:
        raise HTTPException(status_code=400, detail="Invalid type")

    params = {
        "api_key": TMDB_API_KEY,
        "query": query,
        "language": "ru-RU",
        "page": page
    }
    async with httpx.AsyncClient(timeout=15.0) as client:
        try:
            r = await client.get(url, params=params)
            if r.status_code != 200:
                raise HTTPException(status_code=r.status_code, detail="TMDB API error")
            return r.json()
        except Exception as e:
            logger.exception(f"Error searching TMDB {type} for '{query}'")
            raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/movie/{movie_id}")
async def get_movie_details(movie_id: int):
    url = f"https://api.themoviedb.org/3/movie/{movie_id}"
    params = {
        "api_key": TMDB_API_KEY,
        "language": "ru-RU",
        "append_to_response": "credits"
    }
    async with httpx.AsyncClient(timeout=10.0) as client:
        try:
            r = await client.get(url, params=params)
            if r.status_code != 200:
                raise HTTPException(status_code=r.status_code, detail="TMDB API error")
            return r.json()
        except Exception as e:
            logger.exception(f"Error fetching movie details for {movie_id}")
            raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/tv/{tv_id}")
async def get_tv_details(tv_id: int):
    url = f"https://api.themoviedb.org/3/tv/{tv_id}"
    params = {
        "api_key": TMDB_API_KEY,
        "language": "ru-RU",
        "append_to_response": "credits,external_ids"
    }
    async with httpx.AsyncClient(timeout=10.0) as client:
        try:
            r = await client.get(url, params=params)
            if r.status_code != 200:
                raise HTTPException(status_code=r.status_code, detail="TMDB API error")
            return r.json()
        except Exception as e:
            logger.exception(f"Error fetching TV details for {tv_id}")
            raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/tv/{tv_id}/season/{season_num}")
async def get_tv_season_details(tv_id: int, season_num: int):
    url = f"https://api.themoviedb.org/3/tv/{tv_id}/season/{season_num}"
    params = {
        "api_key": TMDB_API_KEY,
        "language": "ru-RU"
    }
    async with httpx.AsyncClient(timeout=10.0) as client:
        try:
            r = await client.get(url, params=params)
            if r.status_code != 200:
                raise HTTPException(status_code=r.status_code, detail="TMDB API error")
            return r.json()
        except Exception as e:
            logger.exception(f"Error fetching TV season details for {tv_id} S{season_num}")
            raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/watchlist")
async def get_watchlist():
    data = read_watchlist()
    async with httpx.AsyncClient(timeout=15.0) as client:
        tasks = [get_tv_watchlist_details(client, item) for item in data]
        updated_data = await asyncio.gather(*tasks)
    return updated_data

@app.post("/api/watchlist/toggle")
async def toggle_watchlist(request: Request):
    try:
        item = await request.json()
        item_id = item.get("id")
        item_type = item.get("type", "movie")
        if not item_id:
            raise HTTPException(status_code=400, detail="Missing id")
        
        data = read_watchlist()
        exists = False
        for idx, val in enumerate(data):
            if val.get("id") == item_id and val.get("type", "movie") == item_type:
                data.pop(idx)
                exists = True
                break
        
        if exists:
            write_watchlist(data)
            return {"status": "removed"}
        else:
            entry = {
                "id": item_id,
                "type": item_type,
                "title": item.get("title") or item.get("name") or "Unknown",
                "poster_path": item.get("poster_path"),
                "vote_average": item.get("vote_average"),
                "release_date": item.get("release_date") or item.get("first_air_date") or ""
            }
            data.append(entry)
            write_watchlist(data)
            return {"status": "added"}
    except Exception as e:
        logger.exception("Error toggling watchlist")
        raise HTTPException(status_code=500, detail=str(e))

# History Helpers
HISTORY_PATH = "/config/history.json"

def read_history() -> list:
    if not os.path.exists(HISTORY_PATH):
        return []
    try:
        with open(HISTORY_PATH, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception as e:
        logger.error(f"Error reading history: {e}")
        return []

def write_history(data: list):
    try:
        os.makedirs(os.path.dirname(HISTORY_PATH), exist_ok=True)
        with open(HISTORY_PATH, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
    except Exception as e:
        logger.error(f"Error writing history: {e}")

@app.get("/api/history")
async def get_history():
    return read_history()

@app.post("/api/history")
async def add_to_history(request: Request):
    try:
        item = await request.json()
        item_id = item.get("id")
        item_type = item.get("type", "movie")
        if not item_id:
            raise HTTPException(status_code=400, detail="Missing id")
        
        history = read_history()
        
        # Check if already in history
        existing_idx = -1
        for idx, val in enumerate(history):
            if val.get("id") == item_id and val.get("type") == item_type:
                existing_idx = idx
                break
        
        now_str = datetime.now().isoformat()
        
        entry = {
            "id": item_id,
            "type": item_type,
            "title": item.get("title") or item.get("name") or "Unknown",
            "poster_path": item.get("poster_path"),
            "vote_average": item.get("vote_average"),
            "release_date": item.get("release_date") or item.get("first_air_date") or "",
            "watched_at": now_str,
            "season": item.get("season"),
            "episode": item.get("episode"),
            "episode_title": item.get("episode_title")
        }
        
        if existing_idx != -1:
            history.pop(existing_idx)
            
        history.insert(0, entry)
        
        if len(history) > 50:
            history = history[:50]
            
        write_history(history)
        return {"status": "success"}
    except Exception as e:
        logger.exception("Error updating watch history")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/image")
async def proxy_image(path: str, size: str = "w500"):
    if not path.startswith("/"):
        path = "/" + path
    clean_path = path.lstrip("/")
    url = f"https://i0.wp.com/image.tmdb.org/t/p/{size}/{clean_path}"
    async with httpx.AsyncClient(timeout=15.0) as client:
        try:
            r = await client.get(url)
            if r.status_code == 200:
                return Response(
                    content=r.content, 
                    media_type=r.headers.get("content-type", "image/jpeg"),
                    headers={"Cache-Control": "public, max-age=2592000"}
                )
            else:
                return Response(status_code=r.status_code, headers={"Cache-Control": "no-store"})
        except Exception as e:
            logger.exception(f"Error proxying image {path}")
            return Response(status_code=500, content=str(e), headers={"Cache-Control": "no-store"})

@app.get("/img/{size}/{path:path}")
async def proxy_image_clean(size: str, path: str):
    clean_path = path.lstrip("/")
    url = f"https://i0.wp.com/image.tmdb.org/t/p/{size}/{clean_path}"
    async with httpx.AsyncClient(timeout=15.0) as client:
        try:
            r = await client.get(url)
            if r.status_code == 200:
                return Response(
                    content=r.content, 
                    media_type=r.headers.get("content-type", "image/jpeg"),
                    headers={"Cache-Control": "public, max-age=2592000"}
                )
            else:
                return Response(status_code=r.status_code, headers={"Cache-Control": "no-store"})
        except Exception as e:
            logger.exception(f"Error proxying image {path}")
            return Response(status_code=500, content=str(e), headers={"Cache-Control": "no-store"})

@app.get("/api/public-url")
async def get_public_url():
    log_path = "/config/tunnel.log"
    if not os.path.exists(log_path):
        return {"url": None}
    try:
        import re
        with open(log_path, "r", encoding="utf-8") as f:
            content = f.read()
        match = re.search(r"https://[a-zA-Z0-9\-]+\.trycloudflare\.com", content)
        if match:
            return {"url": match.group(0)}
    except Exception as e:
        logger.error(f"Error reading tunnel log: {e}")
    return {"url": None}

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 5055))
    uvicorn.run(app, host="0.0.0.0", port=port)
