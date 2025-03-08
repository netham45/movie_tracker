import React from 'react'
import {
  Stack,
  InputGroup,
  InputLeftElement,
  Input,
  Select,
  Button,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Portal,
} from '@chakra-ui/react'
import { SearchIcon, ChevronDownIcon } from '@chakra-ui/icons'

interface SearchFilterSortProps {
  searchQuery: string
  onSearchChange: (value: string) => void
  selectedGenre: string
  onGenreChange: (value: string) => void
  availableGenres: string[]
  sortOrder: 'title' | 'date' | 'score'
  sortDirection: 'asc' | 'desc'
  onSortChange: (order: 'title' | 'date' | 'score', direction: 'asc' | 'desc') => void
}

export const SearchFilterSort: React.FC<SearchFilterSortProps> = ({
  searchQuery,
  onSearchChange,
  selectedGenre,
  onGenreChange,
  availableGenres,
  sortOrder,
  sortDirection,
  onSortChange,
}) => {
  return (
    <Stack direction={{ base: 'column', md: 'row' }} spacing={4} mb={8} align="center">
      <InputGroup maxW={{ base: 'full', md: '300px' }}>
        <InputLeftElement pointerEvents="none">
          <SearchIcon color="gray.300" />
        </InputLeftElement>
        <Input
          placeholder="Search movies..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </InputGroup>
      
      <Select
        placeholder="Filter by genre"
        value={selectedGenre}
        onChange={(e) => onGenreChange(e.target.value)}
        maxW={{ base: 'full', md: '200px' }}
      >
        {availableGenres?.map(genre => (
          <option key={genre} value={genre}>{genre}</option>
        ))}
      </Select>

      <Menu>
        <MenuButton as={Button} rightIcon={<ChevronDownIcon />} variant="outline">
          Sort by: {sortOrder.charAt(0).toUpperCase() + sortOrder.slice(1)}
        </MenuButton>
        <Portal>
          <MenuList>
            <MenuItem onClick={() => {
              if (sortOrder === 'title') {
                onSortChange('title', sortDirection === 'asc' ? 'desc' : 'asc')
              } else {
                onSortChange('title', 'asc')
              }
            }}>
              Title {sortOrder === 'title' && (sortDirection === 'asc' ? '↑' : '↓')}
            </MenuItem>
            <MenuItem onClick={() => {
              if (sortOrder === 'date') {
                onSortChange('date', sortDirection === 'asc' ? 'desc' : 'asc')
              } else {
                onSortChange('date', 'desc')
              }
            }}>
              Date Added {sortOrder === 'date' && (sortDirection === 'asc' ? '↑' : '↓')}
            </MenuItem>
            <MenuItem onClick={() => {
              if (sortOrder === 'score') {
                onSortChange('score', sortDirection === 'asc' ? 'desc' : 'asc')
              } else {
                onSortChange('score', 'desc')
              }
            }}>
              Rating {sortOrder === 'score' && (sortDirection === 'asc' ? '↑' : '↓')}
            </MenuItem>
          </MenuList>
        </Portal>
      </Menu>
    </Stack>
  )
}
