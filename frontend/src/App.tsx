import { Container, Stack, Tabs, TabList, TabPanels, Tab, TabPanel } from '@chakra-ui/react'
import {
  Header,
  SearchFilterSort,
  MovieList,
  AddMovieModal,
  PreferencesModal,
  RatingModal,
  MovieModal,
} from './components'
import { useMovies, useSuggestions, useMovieUI } from './hooks'
import { Movie, Suggestion } from './types'

function App() {
  const {
    movies,
    preferences,
    setPreferences,
    keywordAnalysis,
    availableGenres,
    sortedKeywords,
    handleAddMovie,
    handleUpdateMovie,
    handleDeleteMovie,
    handleUpdatePreferences,
  } = useMovies()

  const {
    suggestion,
    suggestionScore,
    setSuggestionScore,
    handleGetSuggestion,
    handleGetMovieDetails,
    clearSuggestion,
    setSuggestion,
  } = useSuggestions()

  const {
    // Search, filter, and sort
    searchQuery,
    selectedGenre,
    sortOrder,
    sortDirection,
    handleSearchChange,
    handleGenreChange,
    handleSortChange,

    // Modals
    addMovieModal,
    preferencesModal,
    suggestionModal,
    ratingModal,

    // New movie form
    newMovie,
    handleNewMovieTitleChange,
    resetNewMovie,

    // Rating
    movieToRate,
    ratingScore,
    setRatingScore,
    handleOpenRatingModal,
    handleCloseRatingModal,

    // Movie details
    selectedMovie,
    selectedListName,
    setSelectedListName,
    movieDetailsModal,
    handleOpenMovieDetails,
    handleCloseMovieDetails,
  } = useMovieUI()

  const handleAddToList = (movie: { title: string, keywords?: string[], description?: string, credits?: { directors: string[], writers: string[], cast: string[] } }, list: 'watched' | 'want_to_watch' | 'undecided' | 'not_interested', score?: number) => {
    if (movie.keywords && movie.description) {
      handleAddMovie({
        title: movie.title,
        keywords: movie.keywords,
        description: movie.description,
        credits: movie.credits,
        list,
        score
      })
      // Update the selected movie and list name to show it in its new list
      if (selectedMovie?.title === movie.title) {
        setSelectedListName(list)
      }
    }
  }

  return (
    <Container maxW="container.xl" py={8}>
      <Stack direction="column" gap={8}>
        <Header
          onOpenAddMovie={addMovieModal.onOpen}
          onOpenPreferences={preferencesModal.onOpen}
            onGetSuggestion={() => {
              suggestionModal.onOpen()
              clearSuggestion()
              handleGetSuggestion()
            }}
        />

        <SearchFilterSort
          searchQuery={searchQuery}
          onSearchChange={handleSearchChange}
          selectedGenre={selectedGenre}
          onGenreChange={handleGenreChange}
          availableGenres={availableGenres}
          sortOrder={sortOrder}
          sortDirection={sortDirection}
          onSortChange={handleSortChange}
        />

        <Tabs variant="enclosed" colorScheme="blue">
          <TabList>
            <Tab>Watched Movies ({movies.watched.movies.length})</Tab>
            <Tab>Want to Watch ({movies.want_to_watch.movies.length})</Tab>
            <Tab>Not Interested ({movies.not_interested.movies.length})</Tab>
            <Tab>Undecided ({movies.undecided.movies.length})</Tab>
          </TabList>

          <TabPanels>
            <TabPanel>
              <MovieList
                listName="watched"
                movies={movies.watched.movies}
                searchQuery={searchQuery}
                selectedGenre={selectedGenre}
                sortOrder={sortOrder}
                sortDirection={sortDirection}
                onRate={handleOpenRatingModal}
                onUpdateMovie={handleUpdateMovie}
                onDeleteMovie={handleDeleteMovie}
                onGenreSelect={handleGenreChange}
                onMovieClick={(movie, listName) => handleOpenMovieDetails(movie, listName)}
              />
            </TabPanel>
            <TabPanel>
              <MovieList
                listName="want_to_watch"
                movies={movies.want_to_watch.movies}
                searchQuery={searchQuery}
                selectedGenre={selectedGenre}
                sortOrder={sortOrder}
                sortDirection={sortDirection}
                onRate={handleOpenRatingModal}
                onUpdateMovie={handleUpdateMovie}
                onDeleteMovie={handleDeleteMovie}
                onGenreSelect={handleGenreChange}
                onMovieClick={(movie, listName) => handleOpenMovieDetails(movie, listName)}
              />
            </TabPanel>
            <TabPanel>
              <MovieList
                listName="undecided"
                movies={movies.undecided.movies}
                searchQuery={searchQuery}
                selectedGenre={selectedGenre}
                sortOrder={sortOrder}
                sortDirection={sortDirection}
                onRate={handleOpenRatingModal}
                onUpdateMovie={handleUpdateMovie}
                onDeleteMovie={handleDeleteMovie}
                onGenreSelect={handleGenreChange}
                onMovieClick={(movie, listName) => handleOpenMovieDetails(movie, listName)}
              />
            </TabPanel>
          </TabPanels>
        </Tabs>

        <AddMovieModal
          isOpen={addMovieModal.isOpen}
          onClose={() => {
            addMovieModal.onClose()
            resetNewMovie()
          }}
          title={newMovie.title}
          onTitleChange={handleNewMovieTitleChange}
          onGetDetails={() => handleGetMovieDetails(newMovie.title)}
          suggestion={suggestion || null}
          onAddToList={(movie, list, score) => {
            handleAddMovie({
              title: movie.title,
              keywords: movie.keywords || [],
              description: movie.description || '',
              credits: movie.credits,
              list,
              score
            })
            addMovieModal.onClose()
            resetNewMovie()
          }}
          movieLists={movies}
        />

        <PreferencesModal
          isOpen={preferencesModal.isOpen}
          onClose={preferencesModal.onClose}
          preferences={preferences}
          availableGenres={availableGenres}
          keywordAnalysis={keywordAnalysis}
          sortedKeywords={sortedKeywords}
          onToggleGenre={(genre) => {
            setPreferences(prev => ({
              ...prev,
              genres: prev.genres.includes(genre)
                ? prev.genres.filter(g => g !== genre)
                : [...prev.genres, genre]
            }))
          }}
          onToggleKeyword={(keyword) => {
            setPreferences(prev => ({
              ...prev,
              keywords: prev.keywords.includes(keyword)
                ? prev.keywords.filter(k => k !== keyword)
                : [...prev.keywords, keyword]
            }))
          }}
          onCommentsChange={(comments) => {
            setPreferences(prev => ({ ...prev, comments }))
          }}
          onSave={handleUpdatePreferences}
        />

        <RatingModal
          isOpen={ratingModal.isOpen}
          onClose={handleCloseRatingModal}
          ratingScore={ratingScore}
          onScoreChange={setRatingScore}
          onSave={() => {
            if (movieToRate) {
              handleUpdateMovie(movieToRate, 'watched', ratingScore)
              handleCloseRatingModal()
            }
          }}
        />

        <MovieModal
            isOpen={suggestionModal.isOpen || movieDetailsModal.isOpen}
            onClose={() => {
              if (suggestionModal.isOpen) {
                suggestionModal.onClose()
                clearSuggestion()
              }
              movieDetailsModal.onClose()
            }}
            movie={suggestion || selectedMovie || null}
            listName={selectedListName}
            suggestionScore={suggestionScore}
            onScoreChange={setSuggestionScore}
            onGetAnotherSuggestion={() => {
              // Match the exact flow used when clicking "Get AI Suggestion" in header
              suggestionModal.onOpen()
              clearSuggestion()
              handleGetSuggestion()
            }}
            movieLists={movies}
            onSuggestionSelect={(newSuggestion: Suggestion) => {
              setSuggestionScore(5)
              setSuggestion(newSuggestion)
            }}
            onAddToList={handleAddToList}
            onMovieSelect={(title: string) => {
              const allMovies = {
                watched: movies.watched.movies,
                want_to_watch: movies.want_to_watch.movies,
                not_interested: movies.not_interested.movies,
                undecided: movies.undecided.movies
              }
              
              // Find which list the movie is in
              for (const [listName, movieList] of Object.entries(allMovies)) {
                const movie = movieList.find(m => m.title === title)
                if (movie) {
                  handleOpenMovieDetails(movie, listName)
                  break
                }
              }
            }}
        />
      </Stack>
    </Container>
  )
}

export default App
