export interface Credits {
  directors: string[]
  cast: string[]
  writers: string[]
}

export interface Movie {
  title: string
  score?: number
  date_watched?: string
  added_date: string
  keywords?: string[]
  description?: string
  credits?: Credits
}

export interface KeywordAnalysis {
  liked: { [key: string]: number }
  disliked: { [key: string]: number }
}

export interface Preferences {
  genres: string[]
  keywords: string[]
  comments?: string
}

export interface MovieList {
  movies: Movie[]
  newTitle?: string
  newScore?: number
}

export interface MovieData {
  watched: MovieList
  want_to_watch: MovieList
  not_interested: MovieList
  undecided: MovieList
}

export interface AddMovieParams {
  title: string
  list: string
  score?: number
  keywords?: string[]
  description?: string
  credits?: Credits
}

export interface Suggestion {
  title: string
  keywords: string[]
  description: string
  credits: {
    directors: string[]
    cast: string[]
    writers: string[]
  }
  is_in_list: boolean
  list_name?: string
  from_recommendation?: boolean
}

export interface ApiMovieResponse {
  watched: Movie[]
  want_to_watch: Movie[]
  not_interested: Movie[]
  undecided: Movie[]
  preferences?: Preferences
}
