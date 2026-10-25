
/**
 * Returns movies ranked by how well they match user preferences.
 *
 * Preferences:
 * - languages: array of preferred languages
 * - genres: array of preferred genres
 * - maxRuntime: maximum preferred runtime in minutes
 * - minRating: minimum preferred rating
 */

export default function recommendMovies(movies, preferences) {
  const {
    languages = [],
    genres = [],
    maxRuntime = Infinity,
    minRating = 0,
  } = preferences;

  const results = movies.map((movie) => {
    let score = 0;
    const reasons = [];

    // Language preference: 30 points
    if (
      languages.length === 0 ||
      languages.includes(movie.language)
    ) {
      if (languages.length > 0) {
        score += 30;
        reasons.push(`${movie.language} matches your language preference`);
      }
    }

    // Genre preference: up to 40 points
    const matchedGenres = movie.genres.filter((genre) =>
      genres.includes(genre)
    );

    if (genres.length > 0 && matchedGenres.length > 0) {
      const genreScore = Math.round(
        (matchedGenres.length / genres.length) * 40
      );

      score += genreScore;
      reasons.push(
        `Matches your preferred genres: ${matchedGenres.join(", ")}`
      );
    } else if (genres.length === 0) {
      score += 40;
    }

    // Runtime preference: 15 points
    if (movie.runtime <= maxRuntime) {
      score += 15;
      reasons.push(`Runtime of ${movie.runtime} minutes fits your limit`);
    }

    // Rating preference: 15 points
    if (movie.rating >= minRating) {
      score += 15;
      reasons.push(`Rating of ${movie.rating} meets your minimum`);
    }

    return {
      ...movie,
      matchScore: score,
      matchReasons:
        reasons.length > 0
          ? reasons
          : ["This movie has limited matches with your preferences"],
    };
  });

  return results
    .filter((movie) => movie.runtime <= maxRuntime)
    .filter((movie) => movie.rating >= minRating)
    .sort((a, b) => b.matchScore - a.matchScore);
}
