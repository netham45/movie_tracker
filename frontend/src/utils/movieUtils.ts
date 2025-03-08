import { Suggestion } from '../types'
import * as api from '../api/movies'

export const addMovieToList = async (
  movie: { title: string, keywords: string[], description: string, credits?: { directors: string[], writers: string[], cast: string[] } },
  list: 'watched' | 'want_to_watch' | 'undecided' | 'not_interested',
  score?: number
) => {
  await api.addMovie({
    title: movie.title,
    keywords: movie.keywords,
    description: movie.description,
    credits: movie.credits,
    list,
    score
  })
  // Get new suggestion after adding
  return api.getSuggestion()
}
