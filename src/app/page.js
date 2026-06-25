"use client";

import { useState, useEffect, useRef } from 'react';

// Categories Configuration
const MOVIE_CATEGORIES = [
  { id: 'trending', name: 'Тренды недели' },
  { id: 'popular', name: 'Популярные' },
  { id: 'now_playing', name: 'В прокате (новинки)' },
  { id: 'top_rated', name: 'Топ рейтинга' },
  { id: 'upcoming', name: 'Скоро выйдут' }
];

const TV_CATEGORIES = [
  { id: 'trending', name: 'Тренды недели' },
  { id: 'popular', name: 'Популярные' },
  { id: 'on_the_air', name: 'В эфире (новые серии)' },
  { id: 'top_rated', name: 'Топ рейтинга' },
  { id: 'airing_today', name: 'Сегодня в эфире' }
];

export default function MovisterPage() {
  // Navigation & Category States
  const [activeTab, setActiveTab] = useState('movie'); // 'movie', 'tv', 'watchlist', 'history'
  const [category, setCategory] = useState('trending');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSearch, setActiveSearch] = useState('');

  // Catalog States
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Watchlist & History States (Stored in localStorage)
  const [watchlist, setWatchlist] = useState([]);
  const [history, setHistory] = useState([]);

  // Modal & Player States
  const [selectedMovie, setSelectedMovie] = useState(null); // Simple item info
  const [selectedMovieDetail, setSelectedMovieDetail] = useState(null); // Full details from API
  const [modalLoading, setModalLoading] = useState(false);
  const [showPlayer, setShowPlayer] = useState(false);
  const [currentPlayerEpisode, setCurrentPlayerEpisode] = useState(null); // { season, episode }

  // TV Seasons States
  const [activeSeasonsOpen, setActiveSeasonsOpen] = useState({}); // seasonNum -> boolean
  const [seasonEpisodes, setSeasonEpisodes] = useState({}); // seasonNum -> array of episodes
  const [seasonsLoading, setSeasonsLoading] = useState({}); // seasonNum -> boolean

  // Toasts Notifications State
  const [toasts, setToasts] = useState([]);

  // Load Watchlist and History from LocalStorage on mount
  useEffect(() => {
    try {
      const storedWatchlist = localStorage.getItem('movister_watchlist');
      if (storedWatchlist) setWatchlist(JSON.parse(storedWatchlist));

      const storedHistory = localStorage.getItem('movister_history');
      if (storedHistory) setHistory(JSON.parse(storedHistory));
      
      window.hydrated = true;
    } catch (e) {
      console.error("Error loading localStorage:", e);
    }
  }, []);

  // Sync Watchlist to localStorage on change
  const updateWatchlistState = (updatedList) => {
    setWatchlist(updatedList);
    localStorage.setItem('movister_watchlist', JSON.stringify(updatedList));
  };

  // Sync History to localStorage on change
  const updateHistoryState = (updatedList) => {
    setHistory(updatedList);
    localStorage.setItem('movister_history', JSON.stringify(updatedList));
  };

  // Toast helper
  const showToast = (text, type = 'success') => {
    const id = Date.now() + Math.random().toString(36).substr(2, 9);
    setToasts(prev => [...prev, { id, text, type, show: true }]);
    setTimeout(() => {
      setToasts(prev => prev.map(t => t.id === id ? { ...t, show: false } : t));
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, 300);
    }, 3000);
  };

  // Fetch Catalog Data
  const fetchCatalog = async (reset = true, targetPage = 1) => {
    if (reset) {
      setLoading(true);
      setPage(1);
    } else {
      setLoadingMore(true);
    }

    try {
      let endpoint = '';
      if (activeSearch) {
        endpoint = `/api/search?query=${encodeURIComponent(activeSearch)}&type=${activeTab}&page=${targetPage}`;
      } else {
        endpoint = `/api/catalog?type=${activeTab}&category=${category}&page=${targetPage}`;
      }

      const res = await fetch(endpoint);
      const data = await res.json();

      if (res.ok) {
        setTotalPages(data.total_pages || 1);
        if (reset) {
          setMovies(data.results || []);
        } else {
          setMovies(prev => [...prev, ...(data.results || [])]);
        }
      } else {
        showToast(data.error || "Не удалось загрузить каталог", "error");
      }
    } catch (err) {
      console.error("Error loading catalog:", err);
      showToast("Ошибка при подключении к серверу", "error");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  // Load Watchlist tab
  const loadWatchlistSection = () => {
    setLoading(true);
    setMovies(watchlist);
    setLoading(false);
  };

  // Load History tab
  const loadHistorySection = () => {
    setLoading(true);
    setMovies(history);
    setLoading(false);
  };

  // Effect to load catalog whenever navigation changes
  useEffect(() => {
    if (activeTab === 'watchlist') {
      loadWatchlistSection();
    } else if (activeTab === 'history') {
      loadHistorySection();
    } else {
      fetchCatalog(true, 1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, category, activeSearch]);

  // Infinite Scroll Handler
  useEffect(() => {
    const handleScroll = () => {
      if (activeTab === 'watchlist' || activeTab === 'history' || loading || loadingMore) return;
      
      const { scrollTop, scrollHeight, clientHeight } = document.documentElement;
      if (scrollTop + clientHeight >= scrollHeight - 300) {
        if (page < totalPages) {
          const nextPage = page + 1;
          setPage(nextPage);
          fetchCatalog(false, nextPage);
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [page, totalPages, activeTab, category, activeSearch, loading, loadingMore]);

  // Tab switching
  const handleTabChange = (tabName) => {
    setActiveTab(tabName);
    setCategory('trending');
    setSearchQuery('');
    setActiveSearch('');
  };

  // Category change
  const handleCategoryChange = (catId) => {
    setCategory(catId);
    setSearchQuery('');
    setActiveSearch('');
  };

  // Search submission
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const query = searchQuery.trim();
    setActiveSearch(query);
  };

  // Open Details Modal
  const openMovie = async (movieId, mType) => {
    const type = mType || activeTab;
    setSelectedMovie({ id: movieId, type });
    setSelectedMovieDetail(null);
    setModalLoading(true);
    setShowPlayer(false);
    setCurrentPlayerEpisode(null);
    setActiveSeasonsOpen({});
    setSeasonEpisodes({});

    try {
      const detailUrl = type === 'tv' ? `/api/tv/${movieId}` : `/api/movie/${movieId}`;
      const res = await fetch(detailUrl);
      const data = await res.json();

      if (res.ok) {
        setSelectedMovieDetail(data);
      } else {
        showToast(data.error || "Не удалось загрузить данные о фильме", "error");
        setSelectedMovie(null);
      }
    } catch (err) {
      console.error("Error fetching details:", err);
      showToast("Ошибка при загрузке данных о фильме", "error");
      setSelectedMovie(null);
    } finally {
      setModalLoading(false);
    }
  };

  // Close Details Modal
  const closeModal = (e) => {
    if (!e || e.target.classList.contains('modal-overlay')) {
      setSelectedMovie(null);
      setSelectedMovieDetail(null);
      setShowPlayer(false);
      setCurrentPlayerEpisode(null);
    }
  };

  // Watchlist Toggle
  const handleToggleWatchlist = () => {
    if (!selectedMovie || !selectedMovieDetail) return;
    const isFav = watchlist.some(item => item.id === selectedMovie.id && item.type === selectedMovie.type);
    
    let updated;
    if (isFav) {
      updated = watchlist.filter(item => !(item.id === selectedMovie.id && item.type === selectedMovie.type));
      showToast("Удалено из списка избранного", "success");
    } else {
      const entry = {
        id: selectedMovie.id,
        type: selectedMovie.type,
        title: selectedMovieDetail.title || selectedMovieDetail.name || "Unknown",
        poster_path: selectedMovieDetail.poster_path,
        vote_average: selectedMovieDetail.vote_average,
        release_date: selectedMovieDetail.release_date || selectedMovieDetail.first_air_date || ""
      };
      updated = [...watchlist, entry];
      showToast("Добавлено в список избранного", "success");
    }
    updateWatchlistState(updated);

    // If currently viewing watchlist tab, update UI lists
    if (activeTab === 'watchlist') {
      setMovies(updated);
    }
  };

  // Record Watch History
  const recordWatchHistory = (season = null, episode = null, episodeTitle = null) => {
    if (!selectedMovie || !selectedMovieDetail) return;
    
    const nowStr = new Date().toISOString();
    const entry = {
      id: selectedMovie.id,
      type: selectedMovie.type,
      title: selectedMovieDetail.title || selectedMovieDetail.name || "Unknown",
      poster_path: selectedMovieDetail.poster_path,
      vote_average: selectedMovieDetail.vote_average,
      release_date: selectedMovieDetail.release_date || selectedMovieDetail.first_air_date || "",
      watched_at: nowStr,
      season,
      episode,
      episode_title: episodeTitle
    };

    // Filter out existing watch records for this movie/TV
    const filtered = history.filter(item => !(item.id === selectedMovie.id && item.type === selectedMovie.type));
    const updated = [entry, ...filtered].slice(0, 50);
    updateHistoryState(updated);

    // If currently viewing history tab, update UI lists
    if (activeTab === 'history') {
      setMovies(updated);
    }
  };

  // Load TV Season Episodes
  const toggleSeason = async (seasonNum, tvId) => {
    const isCurrentlyOpen = activeSeasonsOpen[seasonNum];
    setActiveSeasonsOpen(prev => ({ ...prev, [seasonNum]: !isCurrentlyOpen }));

    if (isCurrentlyOpen) return; // Closing, do not fetch again
    if (seasonEpisodes[seasonNum]) return; // Already loaded

    setSeasonsLoading(prev => ({ ...prev, [seasonNum]: true }));

    try {
      const res = await fetch(`/api/tv/${tvId}/season/${seasonNum}`);
      const data = await res.json();

      if (res.ok) {
        setSeasonEpisodes(prev => ({ ...prev, [seasonNum]: data.episodes || [] }));
      } else {
        showToast(data.error || "Не удалось загрузить серии", "error");
      }
    } catch (err) {
      console.error("Error loading season:", err);
      showToast("Ошибка при загрузке серий", "error");
    } finally {
      setSeasonsLoading(prev => ({ ...prev, [seasonNum]: false }));
    }
  };

  // Play Online triggers
  const handleWatchOnlineClick = () => {
    if (showPlayer) {
      setShowPlayer(false);
      setCurrentPlayerEpisode(null);
    } else {
      setShowPlayer(true);
      setCurrentPlayerEpisode(null);
      recordWatchHistory();
    }
  };

  const handlePlayEpisode = (seasonNum, episodeNum, episodeTitle) => {
    setShowPlayer(true);
    setCurrentPlayerEpisode({ season: seasonNum, episode: episodeNum });
    recordWatchHistory(seasonNum, episodeNum, episodeTitle);
    
    // Scroll player into view
    setTimeout(() => {
      const container = document.getElementById('online-player-container');
      if (container) container.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  // Calculate Heuristic Quality Badge
  const getQualityBadge = (detail) => {
    if (!detail) return "—";
    const dateStr = detail.release_date || detail.first_air_date;
    const releaseYear = dateStr ? parseInt(dateStr.split('-')[0]) : 0;
    const voteAvg = detail.vote_average || 0;
    if (releaseYear >= 2023 && voteAvg >= 7.0) return "4K / 1080p";
    if (releaseYear >= 2005) return "1080p";
    return "720p";
  };

  // Build Player URL
  const getPlayerUrl = () => {
    if (!selectedMovieDetail) return "";
    let imdbId = selectedMovieDetail.imdb_id;
    if (!imdbId && selectedMovieDetail.external_ids) {
      imdbId = selectedMovieDetail.external_ids.imdb_id;
    }

    const titleStr = selectedMovieDetail.title || selectedMovieDetail.name;
    const season = currentPlayerEpisode?.season;
    const episode = currentPlayerEpisode?.episode;

    let url = "";
    if (imdbId) {
      url = `/api/player/${imdbId}`;
      if (season && episode) {
        url += `?season=${season}&episode=${episode}`;
      }
    } else {
      url = `https://yohoho.online/#${encodeURIComponent(titleStr)}`;
      if (season && episode) {
        url += `?season=${season}&episode=${episode}`;
      }
    }
    return url;
  };

  return (
    <>
      {/* Sidebar Navigation */}
      <aside>
        <div className="logo">
          <i className="fa-solid fa-clapperboard"></i>
          <span>Movister</span>
        </div>
        <nav>
          <button 
            className={`nav-btn ${activeTab === 'movie' ? 'active' : ''}`}
            onClick={() => handleTabChange('movie')}
          >
            <i className="fa-solid fa-film"></i>
            <span>Фильмы</span>
          </button>
          <button 
            className={`nav-btn ${activeTab === 'tv' ? 'active' : ''}`}
            onClick={() => handleTabChange('tv')}
          >
            <i className="fa-solid fa-tv"></i>
            <span>Сериалы</span>
          </button>
          <button 
            className={`nav-btn ${activeTab === 'watchlist' ? 'active' : ''}`}
            onClick={() => handleTabChange('watchlist')}
          >
            <i className="fa-solid fa-heart"></i>
            <span>Мой список</span>
          </button>
          <button 
            className={`nav-btn ${activeTab === 'history' ? 'active' : ''}`}
            onClick={() => handleTabChange('history')}
          >
            <i className="fa-solid fa-clock-rotate-left"></i>
            <span>История</span>
          </button>
        </nav>
        
        <div className="sidebar-footer">
          <span>Movister v1.2.0</span><br />
          <span>Stateless Next.js Edition</span>
        </div>
      </aside>

      {/* Main Content Area */}
      <main>
        <section id="catalog-section" className="app-section active">
          <div className="section-header">
            <h1 className="section-title">
              {activeTab === 'movie' && 'Фильмы'}
              {activeTab === 'tv' && 'Сериалы'}
              {activeTab === 'watchlist' && 'Мой список избранного'}
              {activeTab === 'history' && 'История просмотра'}
            </h1>
            
            {/* Search container */}
            {(activeTab === 'movie' || activeTab === 'tv') && (
              <div className="search-container">
                <form onSubmit={handleSearchSubmit}>
                  <div className="search-input-wrapper">
                    <input 
                      type="text" 
                      className="search-input" 
                      placeholder={activeTab === 'movie' ? "Поиск фильмов..." : "Поиск сериалов..."}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    <button type="submit" className="search-btn">
                      <i className="fa-solid fa-magnifying-glass"></i>
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>

          {/* Category Selector Pills */}
          {(activeTab === 'movie' || activeTab === 'tv') && (
            <div className="category-selectors" style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
              {(activeTab === 'movie' ? MOVIE_CATEGORIES : TV_CATEGORIES).map(cat => (
                <button
                  key={cat.id}
                  className={`category-pill ${category === cat.id && !activeSearch ? 'active' : ''}`}
                  onClick={() => handleCategoryChange(cat.id)}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          )}

          {/* Catalog Loading Spinner */}
          {loading ? (
            <div className="page-loader">
              <div className="spinner"></div>
              <p>Загрузка каталога...</p>
            </div>
          ) : (
            <>
              {/* Movies Grid */}
              <div className="movies-grid">
                {movies.length === 0 ? (
                  <div style={{ gridColumn: '1/-1', textAlign: 'center', color: 'var(--text-muted)', padding: '4rem 1rem' }}>
                    Ничего не найдено.
                  </div>
                ) : (
                  movies.map(movie => {
                    const titleStr = movie.title || movie.name || 'Без названия';
                    const posterUrl = movie.poster_path ? `/img/w500${movie.poster_path}` : 'https://via.placeholder.com/500x750?text=Нет+постера';
                    const rating = movie.vote_average ? movie.vote_average.toFixed(1) : '—';
                    const year = (movie.release_date || movie.first_air_date || '—').split('-')[0];
                    const isTv = movie.media_type === 'tv' || movie.type === 'tv' || activeTab === 'tv';

                    return (
                      <div 
                        key={`${movie.id}-${movie.type || activeTab}`}
                        className="movie-card"
                        onClick={() => openMovie(movie.id, movie.type || activeTab)}
                      >
                        <div className="poster-wrapper">
                          {/* New episode tag for TV watchlist items */}
                          {movie.new_episode && (
                            <div className="new-episode-badge">Новая серия! {movie.new_episode_info || ''}</div>
                          )}
                          {/* History Badge for watch history tab */}
                          {activeTab === 'history' && movie.season && movie.episode && (
                            <div className="new-episode-badge" style={{ backgroundColor: 'var(--accent-secondary)', boxShadow: '0 0 10px rgba(99, 102, 241, 0.6)', animation: 'none' }}>
                              Смотрел: С{movie.season}Э{movie.episode}
                            </div>
                          )}
                          
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={posterUrl} alt={titleStr} className="movie-poster" loading="lazy" />
                          <div className="movie-rating">
                            <i className="fa-solid fa-star"></i> {rating}
                          </div>
                        </div>
                        <div className="movie-card-info">
                          <h3 className="movie-card-title">{titleStr}</h3>
                          <div className="movie-card-meta">
                            <span>{year}</span>
                            <span style={{ fontSize: '0.75rem', backgroundColor: 'var(--border-color)', padding: '2px 6px', borderRadius: '4px', textTransform: 'uppercase' }}>
                              {isTv ? 'Сериал' : 'Кино'}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Bottom Infinite Scroll Spinner */}
              {loadingMore && (
                <div className="page-loader" style={{ minHeight: '10vh' }}>
                  <div className="spinner" style={{ width: '30px', height: '30px' }}></div>
                </div>
              )}
            </>
          )}
        </section>
      </main>

      {/* MOVIE DETAILS MODAL */}
      {selectedMovie && (
        <div className="modal-overlay active" onClick={closeModal}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close-btn" onClick={() => closeModal(null)}>
              <i className="fa-solid fa-xmark"></i>
            </button>
            
            {/* Modal Banner Background */}
            <div 
              className="modal-banner" 
              style={{
                backgroundImage: selectedMovieDetail?.backdrop_path 
                  ? `url('/img/original${selectedMovieDetail.backdrop_path}')` 
                  : 'none'
              }}
            ></div>

            <div className="modal-content-wrapper">
              <div className="modal-left">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img 
                  src={selectedMovieDetail?.poster_path 
                    ? `/img/w500${selectedMovieDetail.poster_path}` 
                    : 'https://via.placeholder.com/500x750?text=Загрузка'
                  } 
                  alt={selectedMovieDetail?.title || selectedMovieDetail?.name || ""} 
                  className="modal-poster" 
                />
              </div>

              <div className="modal-right">
                {modalLoading ? (
                  <div>
                    <h2 className="modal-title">Загрузка...</h2>
                    <div className="modal-overview" style={{ marginTop: '2rem' }}>Загрузка информации о фильме...</div>
                  </div>
                ) : (
                  <>
                    <div>
                      <h2 className="modal-title">
                        {selectedMovieDetail?.title || selectedMovieDetail?.name || "Без названия"}
                      </h2>
                      <div className="modal-genres">
                        {selectedMovieDetail?.genres?.map(g => (
                          <span key={g.id} className="genre-badge">{g.name}</span>
                        ))}
                      </div>
                    </div>

                    <div className="modal-info-row">
                      <div className="modal-info-item">
                        <i className="fa-solid fa-calendar"></i>
                        <span>{(selectedMovieDetail?.release_date || selectedMovieDetail?.first_air_date || '—').split('-')[0]}</span>
                      </div>
                      <div className="modal-info-item">
                        <i className="fa-solid fa-clock"></i>
                        <span>
                          {selectedMovie.type === 'tv' 
                            ? `${selectedMovieDetail?.number_of_seasons || 1} сез.` 
                            : `${selectedMovieDetail?.runtime || 0} мин`
                          }
                        </span>
                      </div>
                      <div className="modal-info-item">
                        <i className="fa-solid fa-star" style={{ color: '#ffc107' }}></i>
                        <span>{selectedMovieDetail?.vote_average ? selectedMovieDetail.vote_average.toFixed(1) : '—'}</span>
                      </div>
                      <div className="modal-info-item">
                        <i className="fa-solid fa-video"></i>
                        <span>{getQualityBadge(selectedMovieDetail)}</span>
                      </div>

                      {/* Play Online Button */}
                      <button 
                        className="watchlist-btn"
                        style={{
                          marginLeft: 'auto',
                          backgroundColor: showPlayer ? 'rgba(239, 68, 68, 0.1)' : 'var(--accent-primary)',
                          borderColor: showPlayer ? 'rgba(239, 68, 68, 0.2)' : 'var(--accent-primary)',
                          color: showPlayer ? '#ef4444' : 'white'
                        }}
                        onClick={handleWatchOnlineClick}
                      >
                        <i className={showPlayer ? "fa-solid fa-stop" : "fa-solid fa-play"}></i>
                        {showPlayer ? "Закрыть плеер" : "Смотреть онлайн"}
                      </button>

                      {/* Watchlist Toggle Button */}
                      <button 
                        className={`watchlist-btn ${watchlist.some(item => item.id === selectedMovie.id && item.type === selectedMovie.type) ? 'active' : ''}`}
                        onClick={handleToggleWatchlist}
                        style={{ marginLeft: 0 }}
                      >
                        <i className={watchlist.some(item => item.id === selectedMovie.id && item.type === selectedMovie.type) ? "fa-solid fa-heart" : "fa-regular fa-heart"}></i>
                        {watchlist.some(item => item.id === selectedMovie.id && item.type === selectedMovie.type) ? "В списке" : "В список"}
                      </button>
                    </div>

                    <div className="modal-overview">
                      {selectedMovieDetail?.overview || "Описание на русском языке отсутствует."}
                    </div>

                    {/* Online Player Section */}
                    {showPlayer && (
                      <div id="online-player-container" style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem', marginTop: '0.5rem' }}>
                        <h3 className="torrents-title" style={{ marginBottom: '1rem' }}>
                          <i className="fa-solid fa-circle-play"></i> Онлайн-просмотр 
                          {currentPlayerEpisode && ` (Сезон ${currentPlayerEpisode.season}, Серия ${currentPlayerEpisode.episode})`}
                        </h3>
                        <div id="yohoho-player" style={{ width: '100%', minHeight: '450px', backgroundColor: '#0b0e14', borderRadius: '16px', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
                          <iframe 
                            id="yohoho-iframe-direct"
                            key={`${currentPlayerEpisode?.season}-${currentPlayerEpisode?.episode}`}
                            src={getPlayerUrl()}
                            frameBorder="0"
                            allowFullScreen
                            allow="autoplay; encrypted-media; gyroscope; picture-in-picture"
                            sandbox="allow-scripts allow-same-origin allow-forms allow-pointer-lock allow-presentation"
                            style={{ width: '100%', height: '450px', border: 0, borderRadius: '16px' }}
                          ></iframe>
                        </div>
                      </div>
                    )}

                    {/* TV Seasons Sections */}
                    {selectedMovie.type === 'tv' && selectedMovieDetail?.seasons && (
                      <div id="tv-seasons-container" style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem', marginBottom: '1.5rem' }}>
                        <h3 className="torrents-title" style={{ marginBottom: '1rem' }}><i class="fa-solid fa-list-ol"></i> Сезоны и серии</h3>
                        <div id="seasons-list" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                          {selectedMovieDetail.seasons
                            .filter(s => s.season_number > 0 || selectedMovieDetail.seasons.length === 1)
                            .map(season => {
                              const sNum = season.season_number;
                              const isOpen = activeSeasonsOpen[sNum];
                              const eps = seasonEpisodes[sNum] || [];
                              const isLoading = seasonsLoading[sNum];

                              return (
                                <div 
                                  key={season.id} 
                                  className="season-item" 
                                  style={{
                                    border: '1px solid var(--border-color)',
                                    borderRadius: '12px',
                                    backgroundColor: 'var(--bg-tertiary)',
                                    overflow: 'hidden',
                                    marginBottom: '0.5rem'
                                  }}
                                >
                                  {/* Season Header */}
                                  <div 
                                    className="season-header" 
                                    onClick={() => toggleSeason(sNum, selectedMovie.id)} 
                                    style={{ padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
                                  >
                                    <div style={{ fontWeight: 700, fontSize: '1.05rem' }}>
                                      {season.name} ({season.episode_count} сер.)
                                    </div>
                                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                      <i 
                                        className="fa-solid fa-chevron-down" 
                                        style={{ 
                                          transition: 'transform 0.2s ease', 
                                          transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                                          marginLeft: '8px' 
                                        }}
                                      ></i>
                                    </div>
                                  </div>

                                  {/* Season Episodes List */}
                                  {isOpen && (
                                    <div 
                                      className="season-episodes" 
                                      style={{ padding: '12px 16px', borderTop: '1px solid var(--border-color)', backgroundColor: 'rgba(5,7,12,0.2)' }}
                                    >
                                      {isLoading ? (
                                        <div className="spinner" style={{ width: '20px', height: '20px', margin: '10px auto' }}></div>
                                      ) : (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                          {eps.map(ep => (
                                            <div 
                                              key={ep.id} 
                                              className="episode-item" 
                                              style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem', borderBottom: '1px solid rgba(255,255,255,0.03)', paddingBottom: '8px' }}
                                            >
                                              <div style={{ flexGrow: 1, paddingRight: '15px' }}>
                                                <strong>Серия {ep.episode_number}:</strong> {ep.name || 'Без названия'}
                                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                                  {ep.air_date ? ep.air_date.split('-').reverse().join('.') : ''}
                                                </div>
                                              </div>
                                              <div>
                                                <button 
                                                  className="download-btn" 
                                                  onClick={() => handlePlayEpisode(sNum, ep.episode_number, ep.name || `Серия ${ep.episode_number}`)}
                                                  style={{ padding: '4px 8px', fontSize: '0.75rem', width: 'auto', backgroundColor: 'var(--accent-primary)' }}
                                                >
                                                  <i className="fa-solid fa-play"></i> Смотреть
                                                </button>
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TOASTS NOTIFICATIONS */}
      <div className="toast-container">
        {toasts.map(toast => (
          <div 
            key={toast.id} 
            className={`toast ${toast.type} ${toast.show ? 'show' : ''}`}
          >
            <i className={toast.type === 'success' ? "fa-solid fa-circle-check" : "fa-solid fa-triangle-exclamation"}></i>
            <span>{toast.text}</span>
          </div>
        ))}
      </div>
    </>
  );
}
