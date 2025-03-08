import React, { useState, useEffect, useMemo, useRef } from 'react'
import { SimpleGrid, Box } from '@chakra-ui/react'
import type { Movie, MovieData } from '../types'
import { MovieCard } from './MovieCard'

interface MovieListProps {
  listName: keyof MovieData
  movies: Movie[]
  searchQuery: string
  selectedGenre: string
  sortOrder: 'title' | 'date' | 'score'
  sortDirection: 'asc' | 'desc'
  onRate: (title: string) => void
  onUpdateMovie: (title: string, newList: string, newScore?: number) => void
  onDeleteMovie: (title: string) => void
  onGenreSelect: (genre: string) => void
  onMovieClick: (movie: Movie, listName: string) => void
}

export const MovieList: React.FC<MovieListProps> = ({
  listName,
  movies,
  searchQuery,
  selectedGenre,
  sortOrder,
  sortDirection,
  onRate,
  onUpdateMovie,
  onDeleteMovie,
  onGenreSelect,
  onMovieClick,
}) => {
  const [displayCount, setDisplayCount] = useState(20)
  const loadMoreRef = useRef<HTMLDivElement>(null)

  // Filter and sort movies
  const filteredAndSortedMovies = useMemo(() => {
    // Filter
    const filtered = movies.filter((movie: Movie) => {
      const matchesSearch = movie.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        movie.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        movie.keywords?.some(k => k.toLowerCase().includes(searchQuery.toLowerCase()))
      
      const matchesGenre = !selectedGenre || movie.keywords?.includes(selectedGenre)
      
      return matchesSearch && matchesGenre
    })

    // Sort
    return filtered.sort((a: Movie, b: Movie) => {
      if (sortOrder === 'title') {
        return sortDirection === 'asc' 
          ? a.title.localeCompare(b.title)
          : b.title.localeCompare(a.title)
      } else if (sortOrder === 'date') {
        return sortDirection === 'asc'
          ? new Date(a.added_date).getTime() - new Date(b.added_date).getTime()
          : new Date(b.added_date).getTime() - new Date(a.added_date).getTime()
      } else { // score
        const scoreA = a.score || 0
        const scoreB = b.score || 0
        return sortDirection === 'asc' ? scoreA - scoreB : scoreB - scoreA
      }
    })
  }, [movies, searchQuery, selectedGenre, sortOrder, sortDirection])

  // Reset display count when filters change
  useEffect(() => {
    setDisplayCount(20)
    window.scrollTo(0, 0)
  }, [searchQuery, selectedGenre, sortOrder, sortDirection])

  // Handle scroll
  useEffect(() => {
    const handleScroll = () => {
      if (loadMoreRef.current) {
        const rect = loadMoreRef.current.getBoundingClientRect()
        const isVisible = rect.top <= window.innerHeight + 100

        if (isVisible && displayCount < filteredAndSortedMovies.length) {
          setDisplayCount(prev => Math.min(prev + 20, filteredAndSortedMovies.length))
        }
      }
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [displayCount, filteredAndSortedMovies.length])

  const visibleMovies = filteredAndSortedMovies.slice(0, displayCount)

  return (
    <Box>
      <SimpleGrid columns={{ base: 1, md: 2, lg: 3, xl: 4 }} spacing={6}>
        {visibleMovies.map((movie: Movie) => (
          <MovieCard
            key={movie.title}
            movie={movie}
            listName={listName}
            onRate={onRate}
            onUpdateMovie={onUpdateMovie}
            onDeleteMovie={onDeleteMovie}
            onGenreSelect={onGenreSelect}
            onMovieClick={(movie) => onMovieClick(movie, listName)}
          />
        ))}
      </SimpleGrid>
      
      {displayCount < filteredAndSortedMovies.length && (
        <Box ref={loadMoreRef} h="20px" mt={6} />
      )}
    </Box>
  )
}
