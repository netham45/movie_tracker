export const API_URL = `http://${window.location.hostname}:8000`

export const getPosterUrl = (title: string): string => {
  return `${API_URL}/movies/poster/${encodeURIComponent(title.replace("/","_"))}`
}

export const getIMDBUrl = (title: string) => {
  // Remove year if present and clean the title
  const cleanTitle = title.replace(/\s*\(\d{4}\)$/, '').replace(/\s+/g, '+')
  return `https://www.imdb.com/find?q=${cleanTitle}`
}

export const getRTUrl = (title: string) => {
  // Remove year if present and clean the title
  const cleanTitle = title.replace(/\s*\(\d{4}\)$/, '').replace(/\s+/g, '_').toLowerCase()
  return `https://www.rottentomatoes.com/m/${cleanTitle}`
}
