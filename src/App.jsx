import { useEffect, useMemo, useState } from "react";
import Sidebar from "./components/Sidebar.jsx";
import MovieCard from "./components/MovieCard.jsx";
import movies from "./data/movies.js";

function App() {
  const [activePage, setActivePage] = useState("discover");
  const [search, setSearch] = useState("");
  const [savedIds, setSavedIds] = useState([]);
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [watchlistLoading, setWatchlistLoading] = useState(true);
  const [watchlistError, setWatchlistError] = useState("");

useEffect(() => {
  let mounted = true;
  let unsubscribe = () => {};

  async function loadWatchlist() {
    try {
      if (!window.cinematch) {
        throw new Error(
          "Electron API unavailable. Please run CineMatch using npm run dev."
        );
      }

      // Listen for watchlist updates from the main process.
      unsubscribe = window.cinematch.onWatchlistUpdated((movieIds) => {
        if (mounted) {
          setSavedIds(movieIds);
        }
      });

      // Request the persisted watchlist from the main process.
      const movieIds = await window.cinematch.getWatchlist();

      if (mounted) {
        setSavedIds(movieIds);
        setWatchlistError("");
      }
    } catch (error) {
      if (mounted) {
        setWatchlistError(error.message || "Could not load your watchlist.");
      }
    } finally {
      if (mounted) {
        setWatchlistLoading(false);
      }
    }
  }

  loadWatchlist();

  return () => {
    mounted = false;
    unsubscribe();
  };
}, []);

  const filteredMovies = useMemo(() => {
    const query = search.trim().toLowerCase();

    return movies.filter((movie) => {
      const matchesSearch =
        !query ||
        movie.title.toLowerCase().includes(query) ||
        movie.language.toLowerCase().includes(query) ||
        movie.genres.some((genre) =>
          genre.toLowerCase().includes(query)
        );

      const matchesPage =
        activePage !== "watchlist" || savedIds.includes(movie.id);

      return matchesSearch && matchesPage;
    });
  }, [search, activePage, savedIds]);

  const featuredMovie = movies.find((movie) => movie.featured);

async function toggleSave(movieId) {
  if (watchlistLoading) return;

  const nextIds = savedIds.includes(movieId)
    ? savedIds.filter((id) => id !== movieId)
    : [...savedIds, movieId];

  try {
    setWatchlistError("");

    // Send the updated IDs to Electron's main process.
    const savedIdsFromMain =
      await window.cinematch.saveWatchlist(nextIds);

    setSavedIds(savedIdsFromMain);
  } catch (error) {
    setWatchlistError(
      error.message || "Could not save your watchlist."
    );
  }
}

  function navigate(page) {
    setActivePage(page);
    setSearch("");
    setSelectedMovie(null);
  }

  return (
    <div className="app-shell">
      <Sidebar
        activePage={activePage}
        onNavigate={navigate}
        savedCount={savedIds.length}
      />

      <main className="main-content">
        <header className="topbar">
          <div className="breadcrumb">
            <span>YOUR CINEMA GUIDE</span>
            <span className="breadcrumb-dot">/</span>
            <strong>
              {activePage === "discover"
                ? "Discover"
                : activePage === "find"
                  ? "Find my movie"
                  : "My watchlist"}
            </strong>
          </div>

          <div className="topbar-right">
            <span className="status-dot" />
            <span>Made for movie lovers</span>
          </div>
        </header>
        {watchlistError && (
  <div role="alert" className="watchlist-error">
    {watchlistError}
  </div>
)}

        {activePage === "discover" && !search && (
          <section className="hero">
            <div className="hero-content">
              <span className="eyebrow">
                <span>✦</span> YOUR PERSONAL MOVIE GUIDE
              </span>
              <h2>
                Less scrolling.
                <br />
                <span>More cinema.</span>
              </h2>
              <p>
                Discover Indian films that match your taste,
                your mood, and your time.
              </p>

              <button
                className="primary-button"
                onClick={() => navigate("find")}
              >
                Find my movie <span>↗</span>
              </button>

              <div className="hero-caption">
                <span className="hero-line" />
                A BETTER WAY TO PICK YOUR NEXT FILM
              </div>
            </div>

            <div className="hero-art" aria-hidden="true">
              <div className="orbit orbit-one" />
              <div className="orbit orbit-two" />
              <div className="art-disc">
                <div className="disc-inner">
                  <span>CM</span>
                </div>
              </div>
              <div className="floating-card floating-top">
                <span>✦</span>
                <div>
                  <strong>Made for you</strong>
                  <small>Personalized picks</small>
                </div>
              </div>
              <div className="floating-card floating-bottom">
                <span className="floating-star">★</span>
                <div>
                  <strong>Great stories</strong>
                  <small>Across Indian cinema</small>
                </div>
              </div>
            </div>
          </section>
        )}

        {activePage === "find" && (
          <section className="page-intro">
            <span className="eyebrow">YOUR NEXT WATCH STARTS HERE</span>
            <h2>Let's find your movie.</h2>
            <p>
              Search our starter collection now. Next, we'll add
              preference filters and personalized match scoring here.
            </p>
          </section>
        )}

        {activePage === "watchlist" && (
          <section className="page-intro">
            <span className="eyebrow">SAVED FOR LATER</span>
            <h2>My watchlist.</h2>
            <p>Your collection of films to watch next.</p>
          </section>
        )}

        <section className="catalog-section">
          <div className="section-heading">
            <div>
              <span className="section-kicker">
                {activePage === "watchlist"
                  ? "YOUR COLLECTION"
                  : search
                    ? "SEARCH RESULTS"
                    : activePage === "find"
                      ? "EXPLORE THE COLLECTION"
                      : "HANDPICKED FOR DISCOVERY"}
              </span>
              <h3>
                {activePage === "watchlist"
                  ? "Saved movies"
                  : search
                    ? "Movies you might mean"
                    : activePage === "find"
                      ? "Explore by title, language or genre"
                      : "A little something for your next movie night"}
              </h3>
            </div>

            <span className="result-count">
              {filteredMovies.length} FILM
              {filteredMovies.length === 1 ? "" : "S"}
            </span>
          </div>

          <div className="search-row">
            <span className="search-icon">⌕</span>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search movies, languages or genres..."
              aria-label="Search movies"
            />
            {search && (
              <button
                className="clear-search"
                onClick={() => setSearch("")}
              >
                Clear
              </button>
            )}
          </div>

          {activePage === "discover" && !search && featuredMovie && (
            <button
              className="featured-strip"
              onClick={() => setSelectedMovie(featuredMovie)}
            >
              <span className="featured-label">EDITOR'S PICK</span>
              <span className="featured-title">{featuredMovie.title}</span>
              <span className="featured-description">
                {featuredMovie.language} · {featuredMovie.year} ·
                {" "}★ {featuredMovie.rating.toFixed(1)}
              </span>
              <span className="featured-arrow">↗</span>
            </button>
          )}

          {filteredMovies.length > 0 ? (
            <div className="movie-grid">
              {filteredMovies.map((movie) => (
                <MovieCard
                  key={movie.id}
                  movie={movie}
                  onSelect={setSelectedMovie}
                  isSaved={savedIds.includes(movie.id)}
                  onToggleSave={toggleSave}
                />
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <span>⌕</span>
              <h3>
                {activePage === "watchlist" && !search
                  ? "Your watchlist is empty"
                  : "No movies found"}
              </h3>
              <p>
                {activePage === "watchlist" && !search
                  ? "Save a movie with the heart icon and it will appear here."
                  : "Try another title, language, or genre."}
              </p>
              {activePage === "watchlist" && (
                <button
                  className="secondary-button"
                  onClick={() => navigate("discover")}
                >
                  Explore movies
                </button>
              )}
            </div>
          )}
        </section>

        <footer className="app-footer">
          <span>CINEMATCH © 2026</span>
          <span>MADE FOR THE LOVE OF CINEMA <span className="footer-heart">♥</span></span>
        </footer>
      </main>

      {selectedMovie && (
        <div
          className="modal-backdrop"
          onClick={() => setSelectedMovie(null)}
        >
          <section
            className="movie-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              className="modal-close"
              onClick={() => setSelectedMovie(null)}
              aria-label="Close movie details"
            >
              ×
            </button>

            <div className={`modal-poster poster-${selectedMovie.accent}`}>
              <span className="poster-brand">CINEMATCH</span>
              <span className="poster-title">{selectedMovie.title}</span>
            </div>

            <div className="modal-details">
              <span className="eyebrow">MOVIE DETAILS</span>
              <h2 id="modal-title">{selectedMovie.title}</h2>
              <p className="modal-meta">
                {selectedMovie.language} · {selectedMovie.year} ·
                {" "}{selectedMovie.runtime} min · ★ {selectedMovie.rating.toFixed(1)}
              </p>
              <div className="modal-tags">
                {selectedMovie.genres.map((genre) => (
                  <span className="genre-tag" key={genre}>{genre}</span>
                ))}
              </div>
              <p className="modal-description">{selectedMovie.description}</p>

              <button
                className="primary-button"
                onClick={() => toggleSave(selectedMovie.id)}
              >
                {savedIds.includes(selectedMovie.id)
                  ? "♥  Saved to watchlist"
                  : "♡  Add to watchlist"}
              </button>
              <p className="modal-disclaimer">
                Starter dataset · Movie metadata will be verified before release.
              </p>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

export default App;
