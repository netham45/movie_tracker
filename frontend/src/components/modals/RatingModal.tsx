import React from 'react'
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  Stack,
  Text,
  Button,
  HStack,
  Circle,
} from '@chakra-ui/react'

interface RatingModalProps {
  isOpen: boolean
  onClose: () => void
  ratingScore: number
  onScoreChange: (score: number) => void
  onSave: () => void
}

export const RatingModal: React.FC<RatingModalProps> = ({
  isOpen,
  onClose,
  ratingScore,
  onScoreChange,
  onSave,
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Rate Movie</ModalHeader>
        <ModalCloseButton />
        <ModalBody pb={6}>
          <Stack spacing={4}>
            <Text>How would you rate this movie?</Text>
            <HStack spacing={1} justify="center">
              {[...Array(11)].map((_, i) => (
                <Circle
                  key={i}
                  size="32px"
                  bg={i <= ratingScore ? "blue.500" : "gray.200"}
                  cursor="pointer"
                  onClick={() => onScoreChange(i)}
                  _hover={{ transform: 'scale(1.2)', transition: '0.2s' }}
                />
              ))}
            </HStack>
            <Text textAlign="center" fontSize="lg" fontWeight="bold">
              {ratingScore}/10
            </Text>
            <Button
              colorScheme="blue"
              onClick={onSave}
            >
              Save Rating
            </Button>
          </Stack>
        </ModalBody>
      </ModalContent>
    </Modal>
  )
}
