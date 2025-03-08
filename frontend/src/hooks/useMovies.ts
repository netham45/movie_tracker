import { useState, useEffect, useMemo, useCallback } from 'react'
import { useToast } from '@chakra-ui/react'
import type { MovieData, Preferences, KeywordAnalysis, AddMovieParams, Movie } from '../types'
import * as api from '../api/movies'

// Initialize empty movie lists
const emptyMovieList = () => ({
  movies: [] as Movie[],
  newTitle: '',
  newScore: 5
})

export const useMovies = () => {
  const [movies, setMovies] = useState<MovieData>({
    watched: emptyMovieList(),
    want_to_watch: emptyMovieList(),
    not_interested: emptyMovieList(),
    undecided: emptyMovieList(),
  })
  const [preferences, setPreferences] = useState<Preferences>({ genres: [], keywords: [], comments: '' })
  const [keywordAnalysis, setKeywordAnalysis] = useState<KeywordAnalysis>({ liked: {}, disliked: {} })
  const [availableGenres, setAvailableGenres] = useState<string[]>([])
  const toast = useToast()

  // Sort keywords by frequency
  const sortedKeywords = useMemo(() => {
    const allKeywords = { ...keywordAnalysis.liked, ...keywordAnalysis.disliked }
    return Object.entries(allKeywords)
      .sort(([, a], [, b]) => b - a)
      .map(([keyword]) => keyword)
  }, [keywordAnalysis])

  const fetchMovies = useCallback(async () => {
    try {
      const response = await api.fetchMovies()
      const newMovies: MovieData = {
        watched: { movies: response.watched || [], newTitle: '', newScore: 5 },
        want_to_watch: { movies: response.want_to_watch || [], newTitle: '', newScore: 5 },
        not_interested: { movies: response.not_interested || [], newTitle: '', newScore: 5 },
        undecided: { movies: response.undecided || [], newTitle: '', newScore: 5 }
      }
      setMovies(newMovies)
      if (response.preferences) {
        setPreferences(response.preferences)
      }
      return response
    } catch (error) {
      toast({
        title: 'Error fetching movies',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
      return null
    }
  }, [toast])

  const fetchGenres = useCallback(async () => {
    try {
      const genres = await api.fetchGenres()
      setAvailableGenres(genres)
    } catch (error) {
      console.error('Error fetching genres:', error)
    }
  }, [])

  const fetchKeywordAnalysis = useCallback(async () => {
    try {
      const analysis = await api.fetchKeywordAnalysis()
      setKeywordAnalysis(analysis)
    } catch (error) {
      console.error('Error fetching keyword analysis:', error)
    }
  }, [])

  const handleAddMovie = useCallback(async (params: AddMovieParams) => {
    try {
      await api.addMovie(params)
      fetchMovies()
      toast({
        title: 'Movie added successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      })
    } catch (error: any) {
      toast({
        title: 'Error adding movie',
        description: error.response?.data?.detail || 'Unknown error',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
    }
  }, [fetchMovies, toast])

  const handleUpdateMovie = useCallback(async (title: string, newList: string, newScore?: number) => {
    try {
      await api.updateMovie(title, newList, newScore)
      fetchMovies()
      toast({
        title: 'Movie updated successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      })
    } catch (error: any) {
      toast({
        title: 'Error updating movie',
        description: error.response?.data?.detail || 'Unknown error',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
    }
  }, [fetchMovies, toast])

  const handleDeleteMovie = useCallback(async (title: string) => {
    try {
      await api.deleteMovie(title)
      fetchMovies()
      toast({
        title: 'Movie deleted successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      })
    } catch (error: any) {
      toast({
        title: 'Error deleting movie',
        description: error.response?.data?.detail || 'Unknown error',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
    }
  }, [fetchMovies, toast])

  const handleUpdatePreferences = useCallback(async () => {
    try {
      await api.updatePreferences(preferences)
      toast({
        title: 'Preferences updated',
        description: 'Generating new suggestions based on your preferences...',
        status: 'success',
        duration: 3000,
        isClosable: true,
      })
    } catch (error: any) {
      toast({
        title: 'Error updating preferences',
        description: error.response?.data?.detail || 'Unknown error',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
    }
  }, [preferences, toast])

  useEffect(() => {
    const initializeApp = async () => {
      const moviesData = await fetchMovies()
      if (moviesData?.preferences) {
        setPreferences(moviesData.preferences)
      }
      fetchKeywordAnalysis()
      fetchGenres()
    }
    initializeApp()
  }, [fetchMovies, fetchKeywordAnalysis, fetchGenres])

  return {
    movies,
    preferences,
    setPreferences,
    keywordAnalysis,
    availableGenres,
    sortedKeywords,
    handleAddMovie,
    handleUpdateMovie,
    handleDeleteMovie,
    handleUpdatePreferences,
  }
}
