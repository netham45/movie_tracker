import { useState, useCallback } from 'react'
import { useDisclosure } from '@chakra-ui/hooks'
import { Movie } from '../types'

export const useMovieUI = () => {
  // Search, filter, and sort state
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedGenre, setSelectedGenre] = useState('')
  const [sortOrder, setSortOrder] = useState<'title' | 'date' | 'score'>('title')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')

  // Modal states
  const addMovieModal = useDisclosure()
  const preferencesModal = useDisclosure()
  const suggestionModal = useDisclosure()
  const ratingModal = useDisclosure()
  const movieDetailsModal = useDisclosure()

  // Selected movie for details
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null)

  // New movie form state
  const [newMovie, setNewMovie] = useState({
    title: '',
    score: 5,
    list: 'want_to_watch',
    description: '',
    keywords: [] as string[],
  })

  // Rating state
  const [movieToRate, setMovieToRate] = useState<string | null>(null)
  const [ratingScore, setRatingScore] = useState(5)

  // Search handlers
  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value)
  }, [])

  const handleGenreChange = useCallback((value: string) => {
    setSelectedGenre(value)
  }, [])

  const handleSortChange = useCallback((order: 'title' | 'date' | 'score', direction: 'asc' | 'desc') => {
    setSortOrder(order)
    setSortDirection(direction)
  }, [])

  // Modal handlers
  const handleOpenRatingModal = useCallback((title: string) => {
    setMovieToRate(title)
    setRatingScore(5)
    ratingModal.onOpen()
  }, [ratingModal])

  const handleCloseRatingModal = useCallback(() => {
    setMovieToRate(null)
    setRatingScore(5)
    ratingModal.onClose()
  }, [ratingModal])

  // New movie form handlers
  const handleNewMovieTitleChange = useCallback((title: string) => {
    setNewMovie(prev => ({ ...prev, title }))
  }, [])

  const resetNewMovie = useCallback(() => {
    setNewMovie({
      title: '',
      score: 5,
      list: 'want_to_watch',
      description: '',
      keywords: [],
    })
  }, [])

  // Movie details handlers
  const handleOpenMovieDetails = useCallback((movie: Movie, listName?: string) => {
    setSelectedMovie(movie)
    setSelectedListName(listName)
    movieDetailsModal.onOpen()
  }, [movieDetailsModal])
  

  // Selected movie list name
  const [selectedListName, setSelectedListName] = useState<string | undefined>()

  const handleCloseMovieDetails = useCallback(() => {
    setSelectedMovie(null)
    setSelectedListName(undefined)
    movieDetailsModal.onClose()
  }, [movieDetailsModal])

  return {
    // Search, filter, and sort
    searchQuery,
    selectedGenre,
    sortOrder,
    sortDirection,
    handleSearchChange,
    handleGenreChange,
    handleSortChange,

    // Modals
    addMovieModal,
    preferencesModal,
    suggestionModal,
    ratingModal,
    movieDetailsModal,

    // New movie form
    newMovie,
    handleNewMovieTitleChange,
    resetNewMovie,

    // Rating
    movieToRate,
    ratingScore,
    setRatingScore,
    handleOpenRatingModal,
    handleCloseRatingModal,

    // Movie details
    selectedMovie,
    selectedListName,
    setSelectedListName,
    handleOpenMovieDetails,
    handleCloseMovieDetails,
  }
}
