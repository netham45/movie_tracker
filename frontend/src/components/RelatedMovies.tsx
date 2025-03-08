import React, { useState, useEffect } from 'react'
import {
  Box,
  HStack,
  VStack,
  Text,
  Image,
  SimpleGrid,
  Spinner,
  Heading,
  Tooltip,
  chakra,
} from '@chakra-ui/react'
import { motion } from 'framer-motion'
import { Suggestion } from '../types'
import { getPosterUrl } from '../utils/urls'
import { getRelatedMovie } from '../api/movies'

const ChakraBox = chakra(motion.div)

interface RelatedMoviesProps {
  movieTitle: string
  onMovieClick: (movie: Suggestion) => void
  itemVariants?: any
}

export const RelatedMovies: React.FC<RelatedMoviesProps> = ({
  movieTitle,
  onMovieClick,
  itemVariants,
}) => {
  const [relatedMovies, setRelatedMovies] = useState<Suggestion[]>([])
  const [isLoadingRelated, setIsLoadingRelated] = useState(true)

  useEffect(() => {
    let isMounted = true;

    const fetchRelated = async () => {
      try {
        setIsLoadingRelated(true);
        setRelatedMovies([]); // Reset on new fetch
        
        const suggestions: Suggestion[] = [];
        
        // Get 10 suggestions sequentially
        while (suggestions.length < 10) {
          if (!isMounted) break;

          try {
            // Get next suggestion, passing all previous titles
            const nextSuggestion = await getRelatedMovie(
              movieTitle,
              [movieTitle, ...suggestions.map(s => s.title)]
            );
            
            if (!isMounted) break;

            suggestions.push(nextSuggestion);
            // Update state as each suggestion comes in
            setRelatedMovies([...suggestions]);
          } catch (error) {
            console.error('Error fetching related movie:', error);
            // Break if we can't get more suggestions
            break;
          }
        }
      } catch (error) {
        console.error('Error fetching related movies:', error);
      } finally {
        if (isMounted) {
          setIsLoadingRelated(false);
        }
      }
    };

    fetchRelated();

    return () => {
      isMounted = false;
    };
  }, [movieTitle])

  return (
    <ChakraBox variants={itemVariants}>
      <Box>
        <HStack mb={4} align="center">
          <Heading size="md">Related Movies</Heading>
          {isLoadingRelated && (
            <HStack spacing={2}>
              <Spinner size="sm" />
              <Text fontSize="sm" color="gray.500">Loading more suggestions...</Text>
            </HStack>
          )}
        </HStack>
        <SimpleGrid columns={5} spacing={4}>
          {relatedMovies.map((movie) => (
            <Tooltip 
              key={movie.title}
              label={movie.description}
              placement="top"
              hasArrow
            >
              <Box
                cursor="pointer" 
                onClick={() => onMovieClick(movie)}
                _hover={{ 
                  transform: 'scale(1.05)',
                  boxShadow: 'lg'
                }}
                transition="all 0.2s"
                borderRadius="lg"
                overflow="hidden"
              >
                <VStack spacing={2}>
                  <Image
                    src={getPosterUrl(movie.title)}
                    alt={movie.title}
                    fallbackSrc="https://via.placeholder.com/150x225"
                    maxH="225px"
                    w="100%"
                    objectFit="cover"
                  />
                  <Text 
                    fontSize="sm" 
                    textAlign="center" 
                    noOfLines={2}
                    p={2}
                  >
                    {movie.title}
                  </Text>
                </VStack>
              </Box>
            </Tooltip>
          ))}
          {/* Add placeholder boxes while loading */}
          {isLoadingRelated && Array(10 - relatedMovies.length).fill(null).map((_, i) => (
            <Box
              key={`placeholder-${i}`}
              borderRadius="lg"
              overflow="hidden"
              boxShadow="sm"
            >
              <VStack spacing={2}>
                <Box
                  w="100%"
                  h="225px"
                  bg="gray.100"
                />
                <Box
                  w="100%"
                  h="20px"
                  bg="gray.100"
                  mx={2}
                  mb={2}
                />
              </VStack>
            </Box>
          ))}
        </SimpleGrid>
      </Box>
    </ChakraBox>
  )
}
