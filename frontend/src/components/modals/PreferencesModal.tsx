import React from 'react'
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  Stack,
  Box,
  Heading,
  SimpleGrid,
  Checkbox,
  Textarea,
  Button,
  HStack,
  Text,
  Badge,
  Divider,
} from '@chakra-ui/react'
import type { Preferences, KeywordAnalysis } from '../../types'

interface PreferencesModalProps {
  isOpen: boolean
  onClose: () => void
  preferences: Preferences
  availableGenres: string[]
  keywordAnalysis: KeywordAnalysis
  sortedKeywords: string[]
  onToggleGenre: (genre: string) => void
  onToggleKeyword: (keyword: string) => void
  onCommentsChange: (comments: string) => void
  onSave: () => void
}

export const PreferencesModal: React.FC<PreferencesModalProps> = ({
  isOpen,
  onClose,
  preferences,
  availableGenres,
  keywordAnalysis,
  sortedKeywords,
  onToggleGenre,
  onToggleKeyword,
  onCommentsChange,
  onSave,
}) => {
  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose}
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
                {availableGenres?.map(genre => (
                  <Checkbox
                    key={genre}
                    isChecked={preferences.genres.includes(genre)}
                    onChange={() => onToggleGenre(genre)}
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
                onChange={(e) => onCommentsChange(e.target.value)}
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
                    onChange={() => onToggleKeyword(keyword)}
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
              onClick={onSave}
              mt={4}
            >
              Save Preferences
            </Button>
          </Stack>
        </ModalBody>
      </ModalContent>
    </Modal>
  )
}
