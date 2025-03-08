import React from 'react'
import {
  HStack,
  Heading,
  Button,
  IconButton,
  Tooltip,
  useColorMode,
} from '@chakra-ui/react'
import { MoonIcon, SunIcon } from '@chakra-ui/icons'

interface HeaderProps {
  onOpenAddMovie: () => void
  onOpenPreferences: () => void
  onGetSuggestion: () => void
}

export const Header: React.FC<HeaderProps> = ({
  onOpenAddMovie,
  onOpenPreferences,
  onGetSuggestion,
}) => {
  const { colorMode, toggleColorMode } = useColorMode()

  return (
    <HStack justify="space-between" w="full">
      <HStack spacing={4}>
        <Heading>Movie Tracker</Heading>
        <Tooltip label={`Switch to ${colorMode === 'light' ? 'dark' : 'light'} mode`}>
          <IconButton
            aria-label="Toggle color mode"
            icon={colorMode === 'light' ? <MoonIcon /> : <SunIcon />}
            onClick={toggleColorMode}
            variant="ghost"
          />
        </Tooltip>
      </HStack>
      <HStack spacing={2}>
        <Button colorScheme="purple" onClick={onGetSuggestion}>
          Get AI Suggestion
        </Button>
        <Button colorScheme="teal" onClick={onOpenPreferences}>
          Preferences
        </Button>
        <Button colorScheme="blue" onClick={onOpenAddMovie}>
          Add Movie
        </Button>
      </HStack>
    </HStack>
  )
}
