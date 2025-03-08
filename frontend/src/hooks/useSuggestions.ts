import { useState, useCallback } from 'react'
import { useToast } from '@chakra-ui/react'
import type { Suggestion } from '../types'
import * as api from '../api/movies'

export const useSuggestions = () => {
  const [suggestion, setSuggestion] = useState<Suggestion | null>(null)
  const [suggestionScore, setSuggestionScore] = useState(5)
  const toast = useToast()

  const handleGetSuggestion = useCallback(async () => {
    try {
      const response = await api.getSuggestion()
      setSuggestion(response)
    } catch (error: any) {
      toast({
        title: 'Error getting suggestion',
        description: error.response?.data?.detail || 'Unknown error',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
    }
  }, [toast])

  const handleGetMovieDetails = useCallback(async (title: string) => {
    try {
      const response = await api.getMovieDetails(title)
      setSuggestion(response)
    } catch (error: any) {
      toast({
        title: 'Error getting movie details',
        description: error.response?.data?.detail || 'Unknown error',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
    }
  }, [toast])

  const clearSuggestion = useCallback(() => {
    setSuggestion(null)
    setSuggestionScore(5)
  }, [])

  return {
    suggestion,
    setSuggestion,
    suggestionScore,
    setSuggestionScore,
    handleGetSuggestion,
    handleGetMovieDetails,
    clearSuggestion,
  }
}
