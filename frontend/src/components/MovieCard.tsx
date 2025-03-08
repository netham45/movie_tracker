import React from 'react'
import {
  Card,
  CardBody,
  Stack,
  Heading,
  Text,
  Badge,
  Button,
  HStack,
  Link,
  IconButton,
  Circle,
  Flex,
  Box,
  Image,
} from '@chakra-ui/react'
import type { Movie } from '../types'
import { getPosterUrl, getIMDBUrl, getRTUrl } from '../utils/urls'

interface MovieCardProps {
  movie: Movie
  listName: string
  onRate: (title: string) => void
  onUpdateMovie: (title: string, newList: string, newScore?: number) => void
  onDeleteMovie: (title: string) => void
  onGenreSelect: (genre: string) => void
  onMovieClick: (movie: Movie, listName: string) => void
}

export const MovieCard: React.FC<MovieCardProps> = ({
  movie,
  listName,
  onRate,
  onUpdateMovie,
  onDeleteMovie,
  onGenreSelect,
  onMovieClick,
}) => {
  return (
    <Card 
      maxW="sm" 
      h="100%" 
      _hover={{ 
        transform: 'scale(1.02)', 
        transition: '0.2s',
        boxShadow: 'xl',
        cursor: 'pointer'
      }}
      transition="all 0.2s"
      onClick={(e) => {
        e.stopPropagation()
        onMovieClick(movie, listName)
      }}
    >
      <CardBody>
        <Box position="relative" pb="150%">
          <Image
            src={getPosterUrl(movie.title)}
            alt={movie.title}
            position="absolute"
            top="0"
            left="0"
            w="100%"
            h="100%"
            objectFit="cover"
            borderRadius="lg"
            loading="lazy"
            fallbackSrc="https://via.placeholder.com/300x450?text=No+Poster"
          />
          {movie.score !== undefined && (
            <Badge
              position="absolute"
              top="2"
              right="2"
              colorScheme={movie.score >= 7 ? 'green' : movie.score >= 4 ? 'yellow' : 'red'}
              fontSize="lg"
              p={2}
              borderRadius="md"
            >
              {movie.score}/10
            </Badge>
          )}
        </Box>
        
        <Stack mt="4" spacing="2">
          <Heading size="md" noOfLines={2}>{movie.title}</Heading>
          
          <HStack>
            <Link href={getIMDBUrl(movie.title)} isExternal>
              <IconButton
                aria-label="IMDB"
                icon={<Text fontWeight="bold">IMDb</Text>}
                size="sm"
                variant="outline"
                _hover={{ bg: 'yellow.400', color: 'black' }}
              />
            </Link>
            <Link href={getRTUrl(movie.title)} isExternal>
              <IconButton
                aria-label="Rotten Tomatoes"
                icon={<Text fontWeight="bold">RT</Text>}
                size="sm"
                variant="outline"
                _hover={{ bg: 'red.500', color: 'white' }}
              />
            </Link>
          </HStack>

          <Text fontSize="sm" color="gray.500">
            Added: {new Date(movie.added_date).toLocaleDateString()}
          </Text>
          
          {movie.keywords && movie.keywords.length > 0 && (
            <Flex gap={1} wrap="wrap">
              {movie.keywords.map((keyword, idx) => (
                <Badge 
                  key={idx} 
                  colorScheme="purple" 
                  variant="outline"
                  _hover={{ bg: 'purple.100', cursor: 'pointer' }}
                  onClick={() => onGenreSelect(keyword)}
                >
                  {keyword}
                </Badge>
              ))}
            </Flex>
          )}
          
          {movie.description && (
            <Text fontSize="sm" color="gray.600" noOfLines={3}>
              {movie.description}
            </Text>
          )}

          <Stack direction="row" justify="space-between" align="center" wrap="wrap" spacing={2}>
            {listName === 'watched' ? (
              <HStack spacing={1}>
                {[...Array(11)].map((_, i) => (
                  <Circle
                    key={i}
                    size="16px"
                    bg={i <= (movie.score || 0) ? "blue.500" : "gray.200"}
                    cursor="pointer"
                    onClick={() => onUpdateMovie(movie.title, listName, i)}
                    _hover={{ transform: 'scale(1.2)', transition: '0.2s' }}
                  />
                ))}
              </HStack>
            ) : (
              <HStack>
                <Button
                  size="sm"
                  colorScheme="blue"
                  onClick={() => onRate(movie.title)}
                >
                  Watch
                </Button>
                <Button
                  size="sm"
                  colorScheme="red"
                  variant="outline"
                  onClick={() => onUpdateMovie(movie.title, 'not_interested')}
                >
                  Skip
                </Button>
              </HStack>
            )}
            <Button
              size="sm"
              colorScheme="red"
              variant="ghost"
              onClick={() => onDeleteMovie(movie.title)}
            >
              Delete
            </Button>
          </Stack>
        </Stack>
      </CardBody>
    </Card>
  )
}
