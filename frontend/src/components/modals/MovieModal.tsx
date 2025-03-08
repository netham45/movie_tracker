import { useState, useEffect } from 'react'
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  Image,
  Text,
  VStack,
  HStack,
  Tag,
  Heading,
  Box,
  Divider,
  SimpleGrid,
  useToast,
  chakra,
  shouldForwardProp,
  Button,
  Circle,
  Link,
  IconButton,
  Wrap,
  WrapItem,
  Grid,
  Spinner,
  Stack,
} from '@chakra-ui/react'
import { motion, Variants } from 'framer-motion'
import { Movie, Suggestion } from '../../types'
import { getIMDBUrl, getRTUrl, getPosterUrl } from '../../utils/urls'
import { addMovieToList } from '../../utils/movieUtils'
import { CheckIcon, CloseIcon, QuestionIcon, StarIcon, RepeatIcon } from '@chakra-ui/icons'
import { RelatedMovies } from '../RelatedMovies'

const ChakraBox = chakra(motion.div, {
  shouldForwardProp: (prop) => {
    return shouldForwardProp(prop) || prop === 'transition'
  },
})

const containerVariants: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.1,
    },
  },
}

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
}

interface MovieModalProps {
  isOpen: boolean
  onClose: () => void
  movie: Movie | Suggestion | null
  listName?: string
  suggestionScore: number
  onScoreChange: (score: number) => void
  onGetAnotherSuggestion?: () => void
  onMovieSelect?: (title: string) => void
  onSuggestionSelect?: (suggestion: Suggestion) => void
  onAddToList?: (movie: { title: string, keywords?: string[], description?: string, credits?: { directors: string[], writers: string[], cast: string[] } }, list: 'watched' | 'want_to_watch' | 'undecided' | 'not_interested', score?: number) => void
  movieLists: {
    watched: { movies: Movie[] }
    want_to_watch: { movies: Movie[] }
    not_interested: { movies: Movie[] }
    undecided: { movies: Movie[] }
  }
}


export const MovieModal = ({
  isOpen,
  onClose,
  movie,
  listName,
  suggestionScore,
  onScoreChange,
  onGetAnotherSuggestion,
  onMovieSelect,
  onSuggestionSelect,
  onAddToList,
  movieLists,
}: MovieModalProps) => {
  const [isInList, setIsInList] = useState(false)
  const toast = useToast()

  // Reset all state when modal closes, movie changes, or component unmounts
  useEffect(() => {
    const resetState = () => {
      setIsInList(false)
      onScoreChange(0)
    }

    // Reset when movie changes or modal closes
    if (!isOpen || !movie) {
      resetState()
    }

    // Reset on unmount
    return () => {
      resetState()
    }
  }, [isOpen, movie, onScoreChange])

  const handleClose = () => {
    setIsInList(false)
    onScoreChange(0)
    onClose()
  }

  const handleMovieClick = (suggestion: Suggestion) => {
    // Reset state before selecting new movie
    setIsInList(false)
    onScoreChange(0)
    
    if (suggestion.is_in_list) {
      onMovieSelect?.(suggestion.title)
    } else if (onSuggestionSelect) {
      onSuggestionSelect({
        ...suggestion,
        from_recommendation: true
      })
    }
  }

  useEffect(() => {
    if (movie) {
      // Check if movie exists in any list
      const movieInList = Object.values(movieLists).some(({ movies }) => 
        movies.some(m => m.title === movie.title)
      )
      setIsInList(movieInList)
    }
  }, [movie, movieLists])

  const handleMoveToList = async (list: 'watched' | 'want_to_watch' | 'undecided' | 'not_interested', score?: number) => {
    if (!movie) return

    if (isInList && onMovieSelect) {
      onMovieSelect(movie.title)
      toast({
        title: `Moved to ${list.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}`,
        description: `${movie.title} has been moved to your ${list.replace('_', ' ')} list`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      })
      handleClose()
    } else {
      if (onAddToList) {
        onAddToList(movie, list, score)
          // If from a recommendation (related movies), show it in its new list
          // If from AI suggestion button, get another suggestion
          if ('from_recommendation' in movie && movie.from_recommendation) {
            setIsInList(true)
          } else {
            // Let parent handle getting another suggestion
            // Parent will:
            // 1. Clear suggestion (shows loading screen)
            // 2. Get new suggestion
            onGetAnotherSuggestion?.()
          }
      }
    }
  }

  if (!movie) {
    return (
    <Modal isOpen={isOpen} onClose={handleClose} size="xl">
      <ModalOverlay />
      <ModalContent maxW="900px" position="relative">
          <ModalBody>
            <VStack py={10} spacing={6}>
              <Box position="relative" w="100px" h="100px">
                <Spinner
                  thickness="4px"
                  speed="0.8s"
                  emptyColor="gray.200"
                  color="blue.500"
                  size="xl"
                  position="absolute"
                  top="0"
                  left="0"
                  w="100%"
                  h="100%"
                />
                <Spinner
                  thickness="4px"
                  speed="1.2s"
                  emptyColor="gray.200"
                  color="purple.500"
                  size="lg"
                  position="absolute"
                  top="50%"
                  left="50%"
                  transform="translate(-50%, -50%)"
                />
              </Box>
              <VStack spacing={2}>
                <Text fontSize="lg" fontWeight="bold">
                  Getting your personalized suggestion...
                </Text>
                <Text color="gray.500">
                  Analyzing your preferences and finding the perfect match
                </Text>
              </VStack>
            </VStack>
          </ModalBody>
        </ModalContent>
      </Modal>
    )
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="xl">
      <ModalOverlay />
      <ModalContent maxW="900px" position="relative">
        <ModalHeader
          bgGradient="linear(to-r, blue.500, purple.500)"
          color="white"
          borderTopRadius="md"
          py={6}
        >
          <HStack spacing={4} align="center">
            {isInList ? (
              <>
                <Text>{movie.title}</Text>
                {'score' in movie && movie.score !== undefined && (
                  <Tag colorScheme={movie.score >= 7 ? "green" : movie.score >= 4 ? "blue" : "red"} size="md">
                    Score: {movie.score}/10
                  </Tag>
                )}
                {listName && (
                  <Tag 
                    colorScheme={
                      'score' in movie && movie.score !== undefined ? "green" :
                      listName === "want_to_watch" ? "purple" :
                      listName === "undecided" ? "yellow" :
                      listName === "not_interested" ? "red" : "gray"
                    }
                    size="md"
                  >
                    {'score' in movie && movie.score !== undefined ? "Watched" :
                     listName === "want_to_watch" ? "Want to Watch" :
                     listName === "undecided" ? "Undecided" :
                     listName === "not_interested" ? "Not Interested" : ""}
                  </Tag>
                )}
              </>
            ) : (
              <>
                <Text>AI Movie Suggestion</Text>
                <HStack>
                  <Link href={getIMDBUrl(movie.title)} isExternal>
                    <IconButton
                      aria-label="IMDB"
                      icon={<Text fontWeight="bold">IMDb</Text>}
                      size="sm"
                      colorScheme="yellow"
                    />
                  </Link>
                  <Link href={getRTUrl(movie.title)} isExternal>
                    <IconButton
                      aria-label="Rotten Tomatoes"
                      icon={<Text fontWeight="bold">RT</Text>}
                      size="sm"
                      colorScheme="red"
                    />
                  </Link>
                </HStack>
              </>
            )}
          </HStack>
        </ModalHeader>
        <ModalCloseButton color="white" onClick={handleClose} />
        <ModalBody pb={6}>
          <ChakraBox
            initial="hidden"
            animate="visible"
            variants={containerVariants}
          >
            <HStack spacing={8} align="flex-start">
              <ChakraBox
                as={Box}
                position="relative"
                minW="300px"
                h="450px"
                borderRadius="lg"
                overflow="hidden"
                boxShadow="xl"
                transition="all 0.3s"
                role="group"
                variants={itemVariants}
              >
                <Image
                  src={getPosterUrl(movie.title)}
                  alt={movie.title}
                  fallbackSrc="https://via.placeholder.com/300x450"
                  objectFit="cover"
                  w="100%"
                  h="100%"
                />
                <Box
                  position="absolute"
                  bottom={0}
                  left={0}
                  right={0}
                  bg="blackAlpha.800"
                  color="white"
                  p={4}
                  transform="translateY(100%)"
                  transition="transform 0.3s"
                  _groupHover={{ transform: 'translateY(0)' }}
                >
                  <VStack align="stretch" spacing={2}>
                    <Text fontSize="sm" fontWeight="bold">
                      {movie.credits?.directors?.length === 1 ? 'Director' : 'Directors'}:
                    </Text>
                    <Text fontSize="sm">
                      {movie.credits?.directors?.join(', ')}
                    </Text>
                    <Text fontSize="sm" fontWeight="bold" mt={2}>
                      Cast:
                    </Text>
                    <Text fontSize="sm" noOfLines={2}>
                      {movie.credits?.cast?.slice(0, 3).join(', ')}
                      {movie.credits?.cast && movie.credits.cast.length > 3 && ' ...'}
                    </Text>
                  </VStack>
                </Box>
              </ChakraBox>

              <VStack align="stretch" flex={1} spacing={6}>
                <ChakraBox variants={itemVariants}>
                  <Stack spacing={4}>
                    {!isInList && (
                      <Heading size="lg">{movie.title}</Heading>
                    )}
                    <Text fontSize="lg" color="gray.600">
                      {movie.description}
                    </Text>
                  </Stack>
                </ChakraBox>

                <ChakraBox
                  as={Box}
                  bg="purple.50"
                  p={4}
                  borderRadius="lg"
                  boxShadow="sm"
                  variants={itemVariants}
                >
                  <Heading size="sm" mb={3}>Keywords</Heading>
                  <Wrap spacing={2}>
                    {movie.keywords?.map((keyword) => (
                      <WrapItem key={keyword}>
                        <Tag 
                          colorScheme="purple" 
                          size="md"
                          borderRadius="full"
                          px={3}
                          py={1}
                          _hover={{
                            transform: 'scale(1.05)',
                            boxShadow: 'sm'
                          }}
                          transition="all 0.2s"
                          cursor="default"
                        >
                          {keyword}
                        </Tag>
                      </WrapItem>
                    ))}
                  </Wrap>
                </ChakraBox>

                {movie.credits && (
                  <ChakraBox
                    as={Box}
                    bg="blue.50"
                    p={4}
                    borderRadius="lg"
                    boxShadow="sm"
                    variants={itemVariants}
                  >
                    <Heading size="sm" mb={4}>Credits</Heading>
                    <Grid templateColumns="repeat(3, 1fr)" gap={6}>
                      <Box>
                        <Text 
                          fontSize="sm" 
                          fontWeight="bold" 
                          color="blue.600"
                          mb={1}
                        >
                          Directors
                        </Text>
                        <VStack align="stretch" spacing={1}>
                          {movie.credits.directors?.map((director) => (
                            <Text 
                              key={director}
                              fontSize="sm"
                              _hover={{ color: 'blue.600' }}
                              transition="color 0.2s"
                            >
                              {director}
                            </Text>
                          ))}
                        </VStack>
                      </Box>

                      <Box>
                        <Text 
                          fontSize="sm" 
                          fontWeight="bold" 
                          color="blue.600"
                          mb={1}
                        >
                          Writers
                        </Text>
                        <VStack align="stretch" spacing={1}>
                          {movie.credits.writers?.map((writer) => (
                            <Text 
                              key={writer}
                              fontSize="sm"
                              _hover={{ color: 'blue.600' }}
                              transition="color 0.2s"
                            >
                              {writer}
                            </Text>
                          ))}
                        </VStack>
                      </Box>

                      <Box>
                        <Text 
                          fontSize="sm" 
                          fontWeight="bold" 
                          color="blue.600"
                          mb={1}
                        >
                          Cast
                        </Text>
                        <VStack align="stretch" spacing={1}>
                          {movie.credits.cast?.map((actor) => (
                            <Text 
                              key={actor}
                              fontSize="sm"
                              _hover={{ color: 'blue.600' }}
                              transition="color 0.2s"
                            >
                              {actor}
                            </Text>
                          ))}
                        </VStack>
                      </Box>
                    </Grid>
                  </ChakraBox>
                )}

                <ChakraBox
                  as={Box}
                  bg="gray.50"
                  p={4}
                  borderRadius="lg"
                  boxShadow="sm"
                  variants={itemVariants}
                >
                  <Heading size="sm" mb={3}>Rate this movie</Heading>
                  <HStack spacing={1} justify="center">
                    {[...Array(11)].map((_, i) => (
                      <Circle
                        key={i}
                        size="36px"
                        bg={i <= suggestionScore ? 
                          i >= 7 ? "green.500" :
                          i >= 4 ? "blue.500" :
                          "red.500"
                          : "gray.200"
                        }
                        color="white"
                        cursor="pointer"
                        onClick={() => onScoreChange(i)}
                        _hover={{
                          transform: 'scale(1.2)',
                          transition: 'transform 0.2s',
                          boxShadow: 'lg'
                        }}
                        fontSize="lg"
                        fontWeight="bold"
                        transition="all 0.2s"
                      >
                        {i}
                      </Circle>
                    ))}
                  </HStack>
                  <Text 
                    textAlign="center" 
                    mt={2} 
                    color="gray.600"
                    fontSize="sm"
                  >
                    {suggestionScore >= 7 ? "Great!" :
                     suggestionScore >= 4 ? "Good" :
                     suggestionScore > 0 ? "Poor" : "Rate this movie"}
                  </Text>
                </ChakraBox>

                <ChakraBox
                  as={SimpleGrid}
                  columns={2}
                  spacing={4}
                  variants={itemVariants}
                >
                  <Button
                    colorScheme="blue"
                    onClick={() => handleMoveToList('watched', suggestionScore)}
                    size="lg"
                    leftIcon={<CheckIcon />}
                    _hover={{ transform: 'translateY(-2px)' }}
                    transition="all 0.2s"
                  >
                    {isInList ? 'Move to Watched' : 'Add as Watched'}
                  </Button>
                  <Button
                    colorScheme="purple"
                    onClick={() => handleMoveToList('want_to_watch')}
                    size="lg"
                    leftIcon={<StarIcon />}
                    _hover={{ transform: 'translateY(-2px)' }}
                    transition="all 0.2s"
                  >
                    {isInList ? 'Move to Watch List' : 'Want to Watch'}
                  </Button>
                  <Button
                    colorScheme="yellow"
                    onClick={() => handleMoveToList('undecided')}
                    size="lg"
                    leftIcon={<QuestionIcon />}
                    _hover={{ transform: 'translateY(-2px)' }}
                    transition="all 0.2s"
                  >
                    {isInList ? 'Move to Undecided' : 'Undecided'}
                  </Button>
                  <Button
                    colorScheme="red"
                    onClick={() => handleMoveToList('not_interested')}
                    size="lg"
                    leftIcon={<CloseIcon />}
                    _hover={{ transform: 'translateY(-2px)' }}
                    transition="all 0.2s"
                  >
                    {isInList ? 'Move to Not Interested' : 'Not Interested'}
                  </Button>
                </ChakraBox>

                {!isInList && onGetAnotherSuggestion && (
                  <Button
                    variant="ghost"
                    onClick={onGetAnotherSuggestion}
                    size="lg"
                    w="full"
                    mt={4}
                    leftIcon={<RepeatIcon />}
                    _hover={{ 
                      transform: 'scale(1.02)',
                      bg: 'gray.100'
                    }}
                    transition="all 0.2s"
                  >
                    Get Another Suggestion
                  </Button>
                )}
              </VStack>
            </HStack>

            <Divider my={4} />

            <RelatedMovies
              movieTitle={movie.title}
              onMovieClick={handleMovieClick}
              itemVariants={itemVariants}
            />
          </ChakraBox>
        </ModalBody>
      </ModalContent>
    </Modal>
  )
}
