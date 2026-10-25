
import { useEffect, useMemo, useState } from "react";
import Sidebar from "./components/Sidebar.jsx";
import MovieCard from "./components/MovieCard.jsx";
import movies from "./data/movies.js";
import recommendMovies from "./utils/recommendMovies.js";

function App() {
  const [activePage, setActivePage] = useState("discover");
  const [search, setSearch] = useState("");
  const [savedIds, setSavedIds] = useState([]);
  const [selectedMovie, setSelectedMovie] = useState(null);

  const [watchlistLoading, setWatchlistLoading] = useState(true);
  const [watchlistError, setWatchlistError] = useState("");

  const [preferences, setPreferences] = useState({
    languages: [],
    genres: [],
    maxRuntime: 180,
    minRating: 0,
  });

  // Toggle a language or genre preference.
  function togglePreference(category, value) {
    setPreferences((current) => {
      const selected = current[category];

      return {
        ...current,
        [category]: selected.includes(value)
          ? selected.filter((item) => item !== value)
          : [...selected, value],
      };
    });
  }

  // Load the persisted watchlist and listen for main-process updates.
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

        unsubscribe = window.cinematch.onWatchlistUpdated((movieIds) => {
          if (mounted) {
            setSavedIds(movieIds);
          }
        });

        const movieIds = await window.cinematch.getWatchlist();

        if (mounted) {
          setSavedIds(movieIds);
          setWatchlistError("");
        }
      } catch (error) {
        if (mounted) {
          setWatchlistError(
            error.message || "Could not load your watchlist."
          );
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

  // Rank movies according to the selected preferences.
  const recommendedMovies = useMemo(
    () => recommendMovies(movies, preferences),
    [preferences]
  );

  // Search movies and apply the correct page filter.
  const filteredMovies = useMemo(() => {
    const query = search.trim().toLowerCase();

    const sourceMovies =
      activePage === "find" ? recommendedMovies : movies;

    return sourceMovies.filter((movie) => {
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
  }, [search, activePage, savedIds, recommendedMovies]);

  const featuredMovie = movies.find((movie) => movie.featured);

  // Save or remove a movie through the Electron main process.
  async function toggleSave(movieId) {
    if (watchlistLoading) return;

    const nextIds = savedIds.includes(movieId)
      ? savedIds.filter((id) => id !== movieId)
      : [...savedIds, movieId];

    try {
      setWatchlistError("");

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

  function resetPreferences() {
    setPreferences({
      languages: [],
      genres: [],
      maxRuntime: 180,
      minRating: 0,
    });
    setSearch("");
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

        {/* Discover hero */}
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

        {/* Find page introduction */}
        {activePage === "find" && (
          <section className="page-intro">
            <span className="eyebrow">YOUR NEXT WATCH STARTS HERE</span>
            <h2>Let's find your movie.</h2>
            <p>
              Choose your preferences and CineMatch will rank movies
              according to how well they match your taste.
            </p>
          </section>
        )}

        {/* Movie preference controls */}
        {activePage === "find" && (
          <section className="preferences-panel">
            <div className="preferences-heading">
              <span className="eyebrow">PERSONALISE YOUR PICKS</span>
              <h3>What are you in the mood for?</h3>
              <p>Choose your preferences to rank matching movies.</p>
            </div>

            <div className="preference-group">
              <h4>Preferred languages</h4>

              <div className="preference-options">
                {[
                  "Hindi",
                  "Tamil",
                  "Telugu",
                  "Malayalam",
                  "Kannada",
                ].map((language) => (
                  <label
                    className="preference-option"
                    key={language}
                  >
                    <input
                      type="checkbox"
                      checked={preferences.languages.includes(language)}
                      onChange={() =>
                        togglePreference("languages", language)
                      }
                    />
                    {language}
                  </label>
                ))}
              </div>
            </div>

            <div className="preference-group">
              <h4>Genres</h4>

              <div className="preference-options">
                {[
                  "Drama",
                  "Romance",
                  "Thriller",
                  "Crime",
                  "Comedy",
                  "Adventure",
                  "Action",
                ].map((genre) => (
                  <label
                    className="preference-option"
                    key={genre}
                  >
                    <input
                      type="checkbox"
                      checked={preferences.genres.includes(genre)}
                      onChange={() =>
                        togglePreference("genres", genre)
                      }
                    />
                    {genre}
                  </label>
                ))}
              </div>
            </div>

            <div className="preference-group">
              <label htmlFor="max-runtime">
                Maximum runtime:{" "}
                <strong>{preferences.maxRuntime} min</strong>
              </label>

              <input
                id="max-runtime"
                type="range"
                min="90"
                max="240"
                step="15"
                value={preferences.maxRuntime}
                onChange={(event) =>
                  setPreferences((current) => ({
                    ...current,
                    maxRuntime: Number(event.target.value),
                  }))
                }
              />
            </div>

            <div className="preference-group">
              <label htmlFor="min-rating">
                Minimum rating:{" "}
                <strong>
                  {preferences.minRating === 0
                    ? "Any"
                    : `${preferences.minRating}+`}
                </strong>
              </label>

              <select
                id="min-rating"
                value={preferences.minRating}
                onChange={(event) =>
                  setPreferences((current) => ({
                    ...current,
                    minRating: Number(event.target.value),
                  }))
                }
              >
                <option value="0">Any rating</option>
                <option value="6">6.0+</option>
                <option value="7">7.0+</option>
                <option value="8">8.0+</option>
                <option value="8.5">8.5+</option>
              </select>
            </div>

            <button
              className="secondary-button"
              onClick={resetPreferences}
            >
              Reset preferences
            </button>
          </section>
        )}

        {/* Watchlist introduction */}
        {activePage === "watchlist" && (
          <section className="page-intro">
            <span className="eyebrow">SAVED FOR LATER</span>
            <h2>My watchlist.</h2>
            <p>Your collection of films to watch next.</p>
          </section>
        )}

        {/* Movie catalogue */}
        <section className="catalog-section">
          <div className="section-heading">
            <div>
              <span className="section-kicker">
                {activePage === "watchlist"
                  ? "YOUR COLLECTION"
                  : search
                    ? "SEARCH RESULTS"
                    : activePage === "find"
                      ? "YOUR MATCHES"
                      : "HANDPICKED FOR DISCOVERY"}
              </span>

              <h3>
                {activePage === "watchlist"
                  ? "Saved movies"
                  : search
                    ? "Movies you might mean"
                    : activePage === "find"
                      ? "Movies matched to your preferences"
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

          {/* Featured movie */}
          {activePage === "discover" && !search && featuredMovie && (
            <button
              className="featured-strip"
              onClick={() => setSelectedMovie(featuredMovie)}
            >
              <span className="featured-label">EDITOR'S PICK</span>
              <span className="featured-title">
                {featuredMovie.title}
              </span>
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
                  ? watchlistLoading
                    ? "Loading your watchlist..."
                    : "Your watchlist is empty"
                  : activePage === "find"
                    ? "No movies match these preferences"
                    : "No movies found"}
              </h3>

              <p>
                {activePage === "watchlist" && !search
                  ? watchlistLoading
                    ? "Please wait while your saved movies load."
                    : "Save a movie with the heart icon and it will appear here."
                  : activePage === "find"
                    ? "Try changing your language, genre, runtime or rating preferences."
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

              {activePage === "find" && (
                <button
                  className="secondary-button"
                  onClick={resetPreferences}
                >
                  Reset preferences
                </button>
              )}
            </div>
          )}
        </section>

        <footer className="app-footer">
          <span>CINEMATCH © 2026</span>
          <span>
            MADE FOR THE LOVE OF CINEMA{" "}
            <span className="footer-heart">♥</span>
          </span>
        </footer>
      </main>

      {/* Movie details modal */}
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

            <div
              className={`modal-poster poster-${selectedMovie.accent}`}
            >
              <span className="poster-brand">CINEMATCH</span>
              <span className="poster-title">
                {selectedMovie.title}
              </span>
            </div>

            <div className="modal-details">
              <span className="eyebrow">MOVIE DETAILS</span>
              <h2 id="modal-title">{selectedMovie.title}</h2>

              <p className="modal-meta">
                {selectedMovie.language} · {selectedMovie.year} ·
                {" "}{selectedMovie.runtime} min · ★{" "}
                {selectedMovie.rating.toFixed(1)}
              </p>

              <div className="modal-tags">
                {selectedMovie.genres.map((genre) => (
                  <span className="genre-tag" key={genre}>
                    {genre}
                  </span>
                ))}
              </div>

              <p className="modal-description">
                {selectedMovie.description}
              </p>

              <button
                className="primary-button"
                onClick={() => toggleSave(selectedMovie.id)}
                disabled={watchlistLoading}
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
