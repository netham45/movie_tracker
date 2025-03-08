import axios from 'axios'
import { API_URL } from '../utils/urls'
import type { AddMovieParams, ApiMovieResponse, Preferences, KeywordAnalysis, Suggestion } from '../types'

export const fetchMovies = async (): Promise<ApiMovieResponse> => {
  const response = await axios.get(`${API_URL}/movies`)
  return response.data
}

export const fetchGenres = async (): Promise<string[]> => {
  const response = await axios.get(`${API_URL}/genres`)
  return response.data.genres
}

export const fetchKeywordAnalysis = async (): Promise<KeywordAnalysis> => {
  const response = await axios.get(`${API_URL}/movies/keywords`)
  return response.data
}

export const addMovie = async (params: AddMovieParams): Promise<void> => {
  const movieData = {
    title: params.title,
    score: params.list === 'watched' ? (params.score || 5) : undefined,
    keywords: params.keywords,
    description: params.description
  }
  await axios.post(`${API_URL}/movies/${params.list}`, movieData)
}

export const updateMovie = async (
  title: string,
  newList: string,
  newScore?: number
): Promise<void> => {
  await axios.put(`${API_URL}/movies`, {
    title,
    new_list: newList,
    new_score: newScore,
  })
}

export const deleteMovie = async (title: string): Promise<void> => {
  await axios.delete(`${API_URL}/movies/${title}`)
}

export const updatePreferences = async (preferences: Preferences): Promise<void> => {
  await axios.put(`${API_URL}/preferences`, preferences)
}

export const getSuggestion = async (): Promise<Suggestion> => {
  const response = await axios.get(`${API_URL}/movies/suggest`)
  return response.data
}

export const getMovieDetails = async (title: string): Promise<Suggestion> => {
  const response = await axios.get(`${API_URL}/movies/details/${encodeURIComponent(title)}`)
  return response.data
}

export const getRelatedMovie = async (title: string, previousSuggestions: string[] = []): Promise<Suggestion> => {
  const response = await axios.post(
    `${API_URL}/movies/related/${encodeURIComponent(title)}`,
    { previous_suggestions: previousSuggestions }
  )
  return response.data
}
