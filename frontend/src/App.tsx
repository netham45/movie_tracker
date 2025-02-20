import { useState, useEffect, useMemo } from 'react'
import {
  Container,
  Heading,
  Stack,
  HStack,
  Text,
  Button,
  Input,
  Badge,
  Grid,
  GridItem,
  Circle,
  VStack,
  Link,
  IconButton,
  Checkbox,
  SimpleGrid,
  Divider,
  Box,
  useToast,
  Textarea,
} from '@chakra-ui/react'
import { ExternalLinkIcon } from '@chakra-ui/icons'
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
} from '@chakra-ui/modal'
import { useDisclosure } from '@chakra-ui/hooks'
import {
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
} from '@chakra-ui/number-input'
import { Select } from '@chakra-ui/select'
import { Card, CardBody } from '@chakra-ui/card'
import axios from 'axios'

const API_URL = 'http://localhost:8000'

const getIMDBUrl = (title: string) => {
  // Remove year if present and clean the title
  const cleanTitle = title.replace(/\s*\(\d{4}\)$/, '').replace(/\s+/g, '+')
  return `https://www.imdb.com/find?q=${cleanTitle}`
}

const getRTUrl = (title: string) => {
  // Remove year if present and clean the title
  const cleanTitle = title.replace(/\s*\(\d{4}\)$/, '').replace(/\s+/g, '_').toLowerCase()
  return `https://www.rottentomatoes.com/m/${cleanTitle}`
}

interface Movie {
  title: string
  score?: number
  date_watched?: string
  added_date: string
  keywords?: string[]
  description?: string
}

interface KeywordAnalysis {
  liked: { [key: string]: number }
  disliked: { [key: string]: number }
}

interface Preferences {
  genres: string[]
  keywords: string[]
  comments?: string
}

interface MovieList {
  movies: Movie[]
  newTitle?: string
  newScore?: number
}

interface MovieData {
  watched: MovieList
  want_to_watch: MovieList
  not_interested: MovieList
  undecided: MovieList
}

// Initialize empty movie lists
const emptyMovieList = (): MovieList => ({
  movies: [],
  newTitle: '',
  newScore: 5
})

interface AddMovieParams {
  title: string
  list: string
  score?: number
  keywords?: string[]
  description?: string
}

function App() {
  const [movies, setMovies] = useState<MovieData>({
    watched: emptyMovieList(),
    want_to_watch: emptyMovieList(),
    not_interested: emptyMovieList(),
    undecided: emptyMovieList(),
  })
  const [newMovie, setNewMovie] = useState({
    title: '',
    score: 5,
    list: 'want_to_watch',
    description: '',
    keywords: [] as string[],
  })
  const [suggestion, setSuggestion] = useState<{
    title: string,
    keywords: string[],
    description: string,
    credits: {
      directors: string[],
      cast: string[],
      writers: string[]
    }
  } | null>(null)
  const [suggestionScore, setSuggestionScore] = useState(5)
  const [keywordAnalysis, setKeywordAnalysis] = useState<KeywordAnalysis>({ liked: {}, disliked: {} })
  const [availableGenres, setAvailableGenres] = useState<string[]>([])
  const [preferences, setPreferences] = useState<Preferences>({ genres: [], keywords: [], comments: '' })
  const preferencesModal = useDisclosure()
  const suggestionModal = useDisclosure()
  const { isOpen, onOpen, onClose } = useDisclosure()
  const toast = useToast() // Using the one imported from @chakra-ui/react

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
  }, [])

  const fetchGenres = async () => {
    try {
      const response = await axios.get(`${API_URL}/genres`)
      setAvailableGenres(response.data.genres)
    } catch (error) {
      console.error('Error fetching genres:', error)
    }
  }

  const handlePreferencesUpdate = async () => {
    try {
      await axios.put(`${API_URL}/preferences`, preferences)
      toast({
        title: 'Preferences updated',
        description: 'Generating new suggestions based on your preferences...',
        status: 'success',
        duration: 3000,
        isClosable: true,
      })
      preferencesModal.onClose()
    } catch (error: any) {
      toast({
        title: 'Error updating preferences',
        description: error.response?.data?.detail || 'Unknown error',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
    }
  }

  const toggleGenre = (genre: string) => {
    setPreferences(prev => ({
      ...prev,
      genres: prev.genres.includes(genre)
        ? prev.genres.filter(g => g !== genre)
        : [...prev.genres, genre]
    }))
  }

  const toggleKeyword = (keyword: string) => {
    setPreferences(prev => ({
      ...prev,
      keywords: prev.keywords.includes(keyword)
        ? prev.keywords.filter(k => k !== keyword)
        : [...prev.keywords, keyword]
    }))
  }

  // Sort keywords by frequency
  const sortedKeywords = useMemo(() => {
    const allKeywords = { ...keywordAnalysis.liked, ...keywordAnalysis.disliked }
    return Object.entries(allKeywords)
      .sort(([, a], [, b]) => b - a)
      .map(([keyword]) => keyword)
  }, [keywordAnalysis])

  const fetchKeywordAnalysis = async () => {
    try {
      const response = await axios.get(`${API_URL}/movies/keywords`)
      setKeywordAnalysis(response.data)
    } catch (error) {
      console.error('Error fetching keyword analysis:', error)
    }
  }

  const handleGetSuggestion = async () => {
    try {
      suggestionModal.onClose()
      const response = await axios.get(`${API_URL}/movies/suggest`)
      setSuggestion(response.data)
      suggestionModal.onOpen()
    } catch (error: any) {
      toast({
        title: 'Error getting suggestion',
        description: error.response?.data?.detail || 'Unknown error',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
    }
  }

  const fetchMovies = async () => {
    try {
      const response = await axios.get(`${API_URL}/movies`)
      const apiData = response.data;
      setMovies({
        watched: { movies: apiData.watched || [], newTitle: '', newScore: 5 },
        want_to_watch: { movies: apiData.want_to_watch || [], newTitle: '', newScore: 5 },
        not_interested: { movies: apiData.not_interested || [], newTitle: '', newScore: 5 },
        undecided: { movies: apiData.undecided || [], newTitle: '', newScore: 5 }
      })
      return apiData
    } catch (error) {
      toast({
        title: 'Error fetching movies',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
      return null
    }
  }

  const handleDeleteMovie = async (title: string) => {
    try {
      await axios.delete(`${API_URL}/movies/${title}`)
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
  }

  const handleAddMovie = async (params: AddMovieParams) => {
    try {
      const movieData = {
        title: params.title,
        score: params.list === 'watched' ? (params.score || 5) : undefined,
        keywords: params.keywords,
        description: params.description
      }
      await axios.post(`${API_URL}/movies/${params.list}`, movieData)
      fetchMovies()
      if (isOpen) {
        onClose()
        setNewMovie({ title: '', score: 5, list: 'want_to_watch', description: '', keywords: [] })
      }
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
  }

  const handleUpdateMovie = async (title: string, newList: string, newScore?: number) => {
    try {
      await axios.put(`${API_URL}/movies`, {
        title,
        new_list: newList,
        new_score: newScore,
      })
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
  }

  const MovieCard = ({ movie, listName }: { movie: Movie; listName: string }) => (
    <Card size="sm">
      <CardBody py={2}>
        <Stack direction="column" gap={1}>
          <HStack justify="space-between" align="center">
            <Stack direction="row" align="center" spacing={2}>
              <Heading size="sm">{movie.title}</Heading>
              <Link href={getIMDBUrl(movie.title)} isExternal>
                <IconButton
                  aria-label="IMDB"
                  icon={<Text fontSize="xs">IMDB</Text>}
                  size="xs"
                  variant="outline"
                />
              </Link>
              <Link href={getRTUrl(movie.title)} isExternal>
                <IconButton
                  aria-label="Rotten Tomatoes"
                  icon={<Text fontSize="xs">RT</Text>}
                  size="xs"
                  variant="outline"
                />
              </Link>
            </Stack>
            {movie.score !== undefined && (
              <Badge colorScheme={movie.score >= 7 ? 'green' : movie.score >= 4 ? 'yellow' : 'red'}>
                {movie.score}/10
              </Badge>
            )}
          </HStack>
          <Text fontSize="xs" color="gray.500">
            Added: {movie.added_date}
          </Text>
          {movie.keywords && movie.keywords.length > 0 && (
            <HStack spacing={1} wrap="wrap">
              {movie.keywords.map((keyword, idx) => (
                <Badge key={idx} colorScheme="purple" variant="outline" fontSize="xs">
                  {keyword}
                </Badge>
              ))}
            </HStack>
          )}
          {movie.description && (
            <Text fontSize="sm" color="gray.600" mt={1}>
              {movie.description}
            </Text>
          )}
          <HStack spacing={1}>
            {listName === 'watched' ? (
              <HStack spacing={1}>
                {[...Array(11)].map((_, i) => (
                  <Circle
                    key={i}
                    size="20px"
                    bg={i <= (movie.score || 0) ? "blue.500" : "gray.200"}
                    cursor="pointer"
                    onClick={() => handleUpdateMovie(movie.title, listName, i)}
                  />
                ))}
              </HStack>
            ) : (
              <>
                <Button
                  size="xs"
                  colorScheme="blue"
                  onClick={() => {
                    const score = listName === 'want_to_watch' ? 5 : undefined
                    handleUpdateMovie(movie.title, 'watched', score)
                  }}
                >
                  Watch
                </Button>
                <Button
                  size="xs"
                  colorScheme="red"
                  variant="outline"
                  onClick={() => handleUpdateMovie(movie.title, 'not_interested')}
                >
                  Skip
                </Button>
              </>
            )}
            <Button
              size="xs"
              colorScheme="red"
              onClick={() => handleDeleteMovie(movie.title)}
            >
              Delete
            </Button>
          </HStack>
        </Stack>
      </CardBody>
    </Card>
  )

  return (
    <Container maxW="container.xl" py={8}>
      <Stack direction="column" gap={8}>
        <HStack justify="space-between" w="full">
          <Heading>Movie Tracker</Heading>
          <HStack>
            <Button colorScheme="purple" onClick={handleGetSuggestion}>
              Get AI Suggestion
            </Button>
            <Button colorScheme="teal" onClick={preferencesModal.onOpen}>
              Preferences
            </Button>
            <Button colorScheme="blue" onClick={onOpen}>
              Add Movie
            </Button>
          </HStack>
        </HStack>

        <Grid templateColumns={{ base: '1fr', md: 'repeat(4, 1fr)' }} gap={8}>
          <GridItem>
            <Heading size="md" mb={4}>Watched Movies</Heading>
            <Stack direction="column" gap={4}>
              {[...movies.watched.movies]
                .sort((a, b) => a.title.localeCompare(b.title))
                .map((movie) => (
                <MovieCard key={movie.title} movie={movie} listName="watched" />
              ))}
            </Stack>
          </GridItem>

          <GridItem>
            <Heading size="md" mb={4}>Want to Watch</Heading>
            <Stack direction="column" gap={4}>
              {[...movies.want_to_watch.movies]
                .sort((a, b) => a.title.localeCompare(b.title))
                .map((movie) => (
                <MovieCard key={movie.title} movie={movie} listName="want_to_watch" />
              ))}
            </Stack>
          </GridItem>

          <GridItem>
            <Heading size="md" mb={4}>Not Interested</Heading>
            <Stack direction="column" gap={4}>
              {[...movies.not_interested.movies]
                .sort((a, b) => a.title.localeCompare(b.title))
                .map((movie) => (
                <MovieCard key={movie.title} movie={movie} listName="not_interested" />
              ))}
            </Stack>
          </GridItem>

          <GridItem>
            <Heading size="md" mb={4}>Undecided</Heading>
            <Stack direction="column" gap={4}>
              {[...movies.undecided.movies]
                .sort((a, b) => a.title.localeCompare(b.title))
                .map((movie) => (
                <MovieCard key={movie.title} movie={movie} listName="undecided" />
              ))}
            </Stack>
          </GridItem>
        </Grid>

        <Modal isOpen={isOpen} onClose={onClose}>
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>Enter Movie Name</ModalHeader>
            <ModalCloseButton />
            <ModalBody pb={6}>
              <Stack direction="column" gap={4}>
                <Input
                  placeholder="Movie name"
                  value={newMovie.title}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                    setNewMovie({ ...newMovie, title: e.target.value })
                  }
                />
                <Button
                  colorScheme="blue"
                  onClick={async () => {
                    try {
                      const response = await axios.get(`${API_URL}/movies/details/${encodeURIComponent(newMovie.title)}`);
                      setSuggestion(response.data);
                      onClose();
                      suggestionModal.onOpen();
                    } catch (error: any) {
                      toast({
                        title: 'Error getting movie details',
                        description: error.response?.data?.detail || 'Unknown error',
                        status: 'error',
                        duration: 3000,
                        isClosable: true,
                      });
                    }
                  }}
                  w="full"
                >
                  Get Details
                </Button>
              </Stack>
            </ModalBody>
          </ModalContent>
        </Modal>

        {/* Preferences Modal */}
        <Modal 
          isOpen={preferencesModal.isOpen} 
          onClose={() => {
            // Reset preferences to saved state when closing without saving
            fetchMovies().then(data => {
              if (data?.preferences) {
                setPreferences(data.preferences)
              }
            })
            preferencesModal.onClose()
          }} 
          size="xl"
        >
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>Movie Preferences</ModalHeader>
            <ModalCloseButton />
            <ModalBody pb={6}>
              <Stack spacing={4}>
                <Box>
                  <Heading size="sm" mb={4}>Genres</Heading>
                  <SimpleGrid columns={3} spacing={2}>
                    {availableGenres.map(genre => (
                      <Checkbox
                        key={genre}
                        isChecked={preferences.genres.includes(genre)}
                        onChange={() => toggleGenre(genre)}
                      >
                        {genre}
                      </Checkbox>
                    ))}
                  </SimpleGrid>
                </Box>

                <Divider my={4} />

                <Box>
                  <Heading size="sm" mb={4}>Additional Comments</Heading>
                  <Textarea
                    value={preferences.comments || ''}
                    onChange={(e) => setPreferences(prev => ({
                      ...prev,
                      comments: e.target.value
                    }))}
                    placeholder="Add any specific preferences or requirements for movie suggestions..."
                    size="sm"
                    resize="vertical"
                    mb={4}
                  />
                </Box>

                <Box>
                  <Heading size="sm" mb={4}>Common Keywords</Heading>
                  <SimpleGrid columns={3} spacing={2}>
                    {sortedKeywords.map((keyword: string) => (
                      <Checkbox
                        key={keyword}
                        isChecked={preferences.keywords.includes(keyword)}
                        onChange={() => toggleKeyword(keyword)}
                      >
                        <HStack>
                          <Text>{keyword}</Text>
                          <Badge colorScheme={keywordAnalysis.liked[keyword] ? 'green' : 'red'}>
                            {(keywordAnalysis.liked[keyword] || keywordAnalysis.disliked[keyword])}
                          </Badge>
                        </HStack>
                      </Checkbox>
                    ))}
                  </SimpleGrid>
                </Box>

                <Button
                  colorScheme="blue"
                  onClick={handlePreferencesUpdate}
                  mt={4}
                >
                  Save Preferences
                </Button>
              </Stack>
            </ModalBody>
          </ModalContent>
        </Modal>

        {/* AI Suggestion Modal */}
        <Modal isOpen={suggestionModal.isOpen} onClose={suggestionModal.onClose}>
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>Movie Suggestion</ModalHeader>
            <ModalCloseButton />
            <ModalBody pb={6}>
              <Stack direction="column" gap={4}>
                <Text>Based on your preferences, you might enjoy:</Text>
                <Stack spacing={4}>
                  <Stack direction="row" align="center" spacing={2}>
                    <Heading size="md">{suggestion?.title}</Heading>
                  {suggestion && (
                    <>
                      <Link href={getIMDBUrl(suggestion.title)} isExternal>
                        <IconButton
                          aria-label="IMDB"
                          icon={<Text fontSize="sm">IMDB</Text>}
                          size="sm"
                          variant="outline"
                        />
                      </Link>
                      <Link href={getRTUrl(suggestion.title)} isExternal>
                        <IconButton
                          aria-label="Rotten Tomatoes"
                          icon={<Text fontSize="sm">RT</Text>}
                          size="sm"
                          variant="outline"
                        />
                      </Link>
                    </>
                  )}
                  </Stack>
                  <Stack spacing={2}>
                    <Text>{suggestion?.description}</Text>
                    {suggestion?.credits && (
                      <Stack spacing={1}>
                        <Text fontSize="sm">
                          <Text as="span" fontWeight="bold">Director{suggestion.credits.directors.length > 1 ? 's' : ''}: </Text>
                          {suggestion.credits.directors.join(', ')}
                        </Text>
                        <Text fontSize="sm">
                          <Text as="span" fontWeight="bold">Cast: </Text>
                          {suggestion.credits.cast.join(', ')}
                        </Text>
                        <Text fontSize="sm">
                          <Text as="span" fontWeight="bold">Writer{suggestion.credits.writers.length > 1 ? 's' : ''}: </Text>
                          {suggestion.credits.writers.join(', ')}
                        </Text>
                      </Stack>
                    )}
                  </Stack>
                </Stack>
                {suggestion?.keywords && suggestion.keywords.length > 0 && (
                  <HStack spacing={1} wrap="wrap">
                    {suggestion.keywords.map((keyword, idx) => (
                      <Badge key={idx} colorScheme="purple" variant="outline" fontSize="sm">
                        {keyword}
                      </Badge>
                    ))}
                  </HStack>
                )}
                <Stack>
                  <Text>Rate this movie:</Text>
                  <HStack spacing={1}>
                    {[...Array(11)].map((_, i) => (
                      <Circle
                        key={i}
                        size="24px"
                        bg={i <= suggestionScore ? "blue.500" : "gray.200"}
                        cursor="pointer"
                        onClick={() => setSuggestionScore(i)}
                      />
                    ))}
                  </HStack>
                  <VStack>
                    <Button
                      colorScheme="blue"
                      onClick={() => {
                        if (suggestion) {
                          handleAddMovie({
                            title: suggestion.title,
                            keywords: suggestion.keywords,
                            description: suggestion.description,
                            list: 'watched',
                            score: suggestionScore
                          })
                        }
                        handleGetSuggestion()
                      }}
                    >
                      Add as Watched
                    </Button>
                    <Button
                      colorScheme="purple"
                      variant="outline"
                      onClick={() => {
                        if (suggestion) {
                          handleAddMovie({
                            title: suggestion.title,
                            keywords: suggestion.keywords,
                            description: suggestion.description,
                            list: 'want_to_watch'
                          })
                        }
                        handleGetSuggestion()
                      }}
                    >
                      Add to Watch List
                    </Button>
                    <Button
                      colorScheme="yellow"
                      variant="outline"
                      onClick={() => {
                        if (suggestion) {
                          handleAddMovie({
                            title: suggestion.title,
                            keywords: suggestion.keywords,
                            description: suggestion.description,
                            list: 'undecided'
                          })
                        }
                        handleGetSuggestion()
                      }}
                    >
                      Undecided
                    </Button>
                    <Button
                      colorScheme="red"
                      variant="outline"
                      onClick={() => {
                        if (suggestion) {
                          handleAddMovie({
                            title: suggestion.title,
                            keywords: suggestion.keywords,
                            description: suggestion.description,
                            list: 'not_interested'
                          })
                        }
                        handleGetSuggestion()
                      }}
                    >
                      Not Interested
                    </Button>
                  </VStack>
                </Stack>
                <Button
                  variant="ghost"
                  onClick={() => {
                    setSuggestion(null)
                    handleGetSuggestion()
                  }}
                >
                  Get Another Suggestion
                </Button>
              </Stack>
            </ModalBody>
          </ModalContent>
        </Modal>
      </Stack>
    </Container>
  )
}

export default App
