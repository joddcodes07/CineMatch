
function MovieCard({ movie, onSelect, isSaved, onToggleSave }) {
  const hasMatchScore = typeof movie.matchScore === "number";

  return (
    <article className="movie-card">
      <button
        type="button"
        className="movie-card-poster"
        onClick={() => onSelect(movie)}
        aria-label={`View details for ${movie.title}`}
      >
        <div className={`movie-poster-art poster-${movie.accent}`}>
          <span className="poster-brand">CINEMATCH</span>
          <span className="poster-title">{movie.title}</span>
          <span className="poster-year">{movie.year}</span>
        </div>

        {hasMatchScore && (
          <span className="match-score-badge">
            {movie.matchScore}% match
          </span>
        )}
      </button>

      <button
        type="button"
        className={`save-button ${isSaved ? "is-saved" : ""}`}
        onClick={() => onToggleSave(movie.id)}
        aria-label={
          isSaved
            ? `Remove ${movie.title} from watchlist`
            : `Add ${movie.title} to watchlist`
        }
        aria-pressed={isSaved}
      >
        {isSaved ? "♥" : "♡"}
      </button>

      <div className="movie-card-info">
        <div className="movie-card-heading">
          <h3>{movie.title}</h3>
          <span className="movie-rating">★ {movie.rating.toFixed(1)}</span>
        </div>

        <p className="movie-card-meta">
          {movie.language} <span>·</span> {movie.year}
          <span>·</span> {movie.runtime} min
        </p>

        <div className="movie-card-genres">
          {movie.genres.map((genre) => (
            <span className="genre-tag" key={genre}>
              {genre}
            </span>
          ))}
        </div>

        {hasMatchScore && (
          <button
            type="button"
            className="why-match-button"
            onClick={() => onSelect(movie)}
          >
            Why this match? <span aria-hidden="true">↗</span>
          </button>
        )}
      </div>
    </article>
  );
}

export default MovieCard;
