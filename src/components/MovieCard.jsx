function MovieCard({ movie, onSelect, isSaved, onToggleSave }) {
  return (
    <article className="movie-card">
      <button
        className={`poster poster-${movie.accent}`}
        onClick={() => onSelect(movie)}
        aria-label={`View ${movie.title} details`}
      >
        <span className="poster-brand">CINEMATCH</span>
        <span className="poster-title">{movie.title}</span>
        <span className="poster-year">{movie.year}</span>
      </button>

      <div className="movie-card-info">
        <div className="movie-title-row">
          <button
            className="movie-title"
            onClick={() => onSelect(movie)}
          >
            {movie.title}
          </button>

          <button
            className={`save-button ${isSaved ? "saved" : ""}`}
            onClick={() => onToggleSave(movie.id)}
            aria-label={isSaved ? "Remove from watchlist" : "Save to watchlist"}
            title={isSaved ? "Remove from watchlist" : "Add to watchlist"}
          >
            {isSaved ? "♥" : "♡"}
          </button>
        </div>

        <p className="movie-meta">
          {movie.language} · {movie.year} · {movie.runtime} min
        </p>

        <div className="movie-card-bottom">
          <span className="rating">★ {movie.rating.toFixed(1)}</span>
          <span className="genre-tag">{movie.genres[0]}</span>
        </div>
      </div>
    </article>
  );
}

export default MovieCard;
