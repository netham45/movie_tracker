import React from 'react'
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  Stack,
  Input,
  Button,
} from '@chakra-ui/react'
import type { Suggestion } from '../../types'
import { MovieModal } from './MovieModal'

interface AddMovieModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  onTitleChange: (title: string) => void
  onGetDetails: () => void
  suggestion: Suggestion | null
  onAddToList?: (movie: { title: string, keywords?: string[], description?: string, credits?: { directors: string[], writers: string[], cast: string[] } }, list: 'watched' | 'want_to_watch' | 'undecided' | 'not_interested', score?: number) => void
  movieLists: {
    watched: { movies: any[] }
    want_to_watch: { movies: any[] }
    not_interested: { movies: any[] }
    undecided: { movies: any[] }
  }
}

export const AddMovieModal: React.FC<AddMovieModalProps> = ({
  isOpen,
  onClose,
  title,
  onTitleChange,
  onGetDetails,
  suggestion,
  onAddToList,
  movieLists,
}) => {
  const [suggestionScore, setSuggestionScore] = React.useState(5)
  const [showMovieModal, setShowMovieModal] = React.useState(false)

  // Reset state when modal closes
  React.useEffect(() => {
    if (!isOpen) {
      setSuggestionScore(5)
      setShowMovieModal(false)
    }
  }, [isOpen])

  // Show MovieModal when we get suggestion details
  React.useEffect(() => {
    if (suggestion) {
      setShowMovieModal(true)
    }
  }, [suggestion])

  return (
    <>
      <Modal isOpen={isOpen && !showMovieModal} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Enter Movie Name</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <Stack direction="column" gap={4}>
              <Input
                placeholder="Movie name"
                value={title}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                  onTitleChange(e.target.value)
                }
              />
              <Button
                colorScheme="blue"
                onClick={onGetDetails}
                w="full"
              >
                Get Details
              </Button>
            </Stack>
          </ModalBody>
        </ModalContent>
      </Modal>

      {showMovieModal && (
        <MovieModal
          isOpen={showMovieModal}
          onClose={() => {
            setShowMovieModal(false)
            onClose()
          }}
          movie={suggestion || null}
          suggestionScore={suggestionScore}
          onScoreChange={setSuggestionScore}
          onAddToList={onAddToList}
          movieLists={movieLists}
        />
      )}
    </>
  )
}
