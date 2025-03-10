from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime
from threading import Thread
from typing import Dict

from config import logger, MOVIE_GENRES
from models import Movie, MovieUpdate, PreferencesUpdate
from movie_storage import load_movies, save_movies, get_movie_poster
from movie_generator import generate_single_suggestion
from movie_analysis import analyze_keywords

app = FastAPI()

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origin
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"status": "Movie Tracker API is running"}

@app.get("/movies")
def get_movies():
    return load_movies()

@app.get("/genres")
def get_genres():
    """Get list of all available movie genres."""
    return {"genres": MOVIE_GENRES}

@app.put("/preferences")
def update_preferences(preferences: PreferencesUpdate):
    """Update genre and keyword preferences."""
    logger.info(f"Updating preferences: {preferences}")
    data = load_movies()
    
    # Validate genres
    invalid_genres = [g for g in preferences.genres if g not in MOVIE_GENRES]
    if invalid_genres:
        raise HTTPException(status_code=400, detail=f"Invalid genres: {invalid_genres}")
    
    # Update preferences
    data["preferences"]["genres"] = preferences.genres
    data["preferences"]["keywords"] = preferences.keywords
    data["preferences"]["comments"] = preferences.comments
    
    # Save changes
    save_movies(data)
    
    
    return {"status": "success", "message": "Preferences updated successfully"}

@app.get("/movies/suggest")
def suggest_movie():
    """Get an AI-powered movie suggestion."""
    logger.info("Received suggestion request")
    data = load_movies()
    try:
        suggestion = generate_single_suggestion(data, reject_duplicates=True)
        logger.info(f"Returning suggestion: {suggestion['title']}")
        return suggestion
    except Exception as e:
        logger.error(f"Error in suggest_movie: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/movies/details/{title}")
def get_movie_details(title: str):
    """Get AI-generated details for a specific movie."""
    logger.info(f"Getting details for movie: {title}")
    data = load_movies()
    try:
        # Use the same suggestion generation but with a specific title
        suggestion = generate_single_suggestion(data, title=title, reject_duplicates=False)  # No need to reject duplicates when getting details
        logger.info(f"Generated details for: {suggestion['title']}")
        return suggestion
    except Exception as e:
        logger.error(f"Error getting movie details: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

from typing import List

from pydantic import BaseModel

class RelatedMovieRequest(BaseModel):
    previous_suggestions: List[str]

@app.post("/movies/related/{title}")
def get_related_movie(title: str, request: RelatedMovieRequest):
    """Get a single AI-generated related movie suggestion."""
    logger.info(f"Getting related movie for: {title}")
    logger.info(f"Previous suggestions: {request.previous_suggestions}")
    data = load_movies()
    
    try:
        # Check cache first
        from movie_cache import get_unused_recommendations, add_recommendation
        unused = get_unused_recommendations(title, request.previous_suggestions)
        
        if unused:
            suggestion = unused[0]
            logger.info(f"Using cached suggestion: {suggestion['title']}")
        else:
            # Generate new suggestion
            suggestion = generate_single_suggestion(
                data=data,
                title=title,
                previous_suggestions=request.previous_suggestions,
                reject_duplicates=False  # Allow duplicates for related movies
            )
            # Add to cache
            add_recommendation(title, suggestion)
            logger.info(f"Generated new suggestion: {suggestion['title']}")
        
        # Check if movie is in any list
        is_in_list = False
        list_name = None
        for lst in ["watched", "want_to_watch", "not_interested", "undecided"]:
            if any(m["title"] == suggestion["title"] for m in data[lst]):
                is_in_list = True
                list_name = lst
                break
        
        # Add list info to response
        response = {
            **suggestion,
            "is_in_list": is_in_list,
            "list_name": list_name
        }
        
        return response
        
    except Exception as e:
        logger.error(f"Error getting related movie: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/movies/{list_name}")
def add_movie(list_name: str, movie: Movie):
    logger.info(f"Adding movie {movie.title} to {list_name}")
    if list_name not in ["watched", "want_to_watch", "not_interested", "undecided"]:
        logger.error(f"Invalid list name: {list_name}")
        raise HTTPException(status_code=400, detail="Invalid list name")
    
    data = load_movies()
    
    # Check if movie already exists in any list
    all_movies = []
    for lst in data.values():
        if isinstance(lst, list):  # Skip non-list values like preferences
            all_movies.extend([m["title"] for m in lst])
    
    if movie.title in all_movies:
        logger.warning(f"Movie {movie.title} already exists in a list")
        raise HTTPException(status_code=400, detail="Movie already exists in a list")
    
    new_movie = {
        "title": movie.title,
        "added_date": datetime.now().strftime("%Y-%m-%d"),
        "keywords": movie.keywords or [],  # Use provided keywords or empty list
        "description": movie.description,  # Store the description
        "credits": movie.credits.dict() if movie.credits else None  # Store credits if provided
    }
    
    if list_name == "watched":
        if movie.score is None:
            logger.error(f"No score provided for watched movie: {movie.title}")
            raise HTTPException(status_code=400, detail="Score is required for watched movies")
        if not (0 <= movie.score <= 10):
            logger.error(f"Invalid score for movie {movie.title}: {movie.score}")
            raise HTTPException(status_code=400, detail="Score must be between 0 and 10")
        new_movie["score"] = movie.score
        new_movie["date_watched"] = datetime.now().strftime("%Y-%m-%d")
    
    data[list_name].append(new_movie)
    save_movies(data)
    logger.info(f"Successfully added {movie.title} to {list_name}")
    return {"status": "success", "message": "Movie added successfully"}

@app.delete("/movies/{title}")
def delete_movie(title: str):
    logger.info(f"Deleting movie: {title}")
    data = load_movies()
    
    # Find and remove the movie from all lists
    found = False
    for list_name, movies in data.items():
        if isinstance(movies, list):  # Skip non-list values like preferences
            for i, movie in enumerate(movies):
                if movie["title"] == title:
                    data[list_name].pop(i)
                    found = True
                    logger.info(f"Removed {title} from {list_name}")
                    break
        if found:
            break
    
    if not found:
        logger.warning(f"Movie not found for deletion: {title}")
        raise HTTPException(status_code=404, detail="Movie not found")
    
    save_movies(data)
    logger.info(f"Successfully deleted movie: {title}")
    return {"status": "success", "message": "Movie deleted successfully"}

from urllib.parse import unquote

@app.get("/movies/poster/{title}")
async def get_poster(title: str):
    """Get movie poster image with caching."""
    decoded_title = unquote(title)
    logger.info(f"Getting poster for movie: {decoded_title}")
    
    # Try with full title first (including year)
    response = get_movie_poster(decoded_title)
    if response:
        return response
    
    # If that fails, try without the year
    base_title = decoded_title.split('(')[0].strip()
    response = get_movie_poster(base_title)
    if response:
        return response
        
    raise HTTPException(status_code=404, detail="Poster not found")

@app.get("/movies/keywords")
def get_keyword_analysis():
    """Get analysis of liked and disliked keywords."""
    logger.info("Getting keyword analysis")
    data = load_movies()
    analysis = analyze_keywords(data)
    logger.info(f"Keyword analysis - Liked: {len(analysis['liked'])}, Disliked: {len(analysis['disliked'])}")
    return analysis

@app.put("/movies")
def update_movie(update: MovieUpdate):
    logger.info(f"Updating movie: {update.title}")
    data = load_movies()
    
    # Find the movie in all lists
    found = False
    for list_name, movies in data.items():
        if not isinstance(movies, list):  # Skip non-list values like preferences
            continue
        for i, movie in enumerate(movies):
            if movie["title"] == update.title:
                found = True
                if update.new_list:
                    # Move to new list
                    new_movie = {
                        "title": movie["title"],
                        "added_date": datetime.now().strftime("%Y-%m-%d"),
                        "keywords": movie.get("keywords", []),  # Preserve keywords when moving
                        "description": movie.get("description"),  # Preserve description when moving
                        "credits": movie.get("credits"),  # Preserve credits when moving
                        "score": movie.get("score") if list_name == "watched" else None  # Preserve score if moving within watched list
                    }
                    
                    if update.new_list == "watched":
                        if update.new_score is None:
                            logger.error(f"No score provided for watched movie: {update.title}")
                            raise HTTPException(status_code=400, detail="Score is required for watched movies")
                        new_movie["score"] = update.new_score
                        new_movie["date_watched"] = datetime.now().strftime("%Y-%m-%d")
                    
                    data[update.new_list].append(new_movie)
                    data[list_name].pop(i)
                    logger.info(f"Moved {update.title} from {list_name} to {update.new_list}")
                elif update.new_score is not None and list_name == "watched":
                    # Update score
                    if not (0 <= update.new_score <= 10):
                        logger.error(f"Invalid score for movie {update.title}: {update.new_score}")
                        raise HTTPException(status_code=400, detail="Score must be between 0 and 10")
                    movie["score"] = update.new_score
                    logger.info(f"Updated score for {update.title} to {update.new_score}")
                break
        if found:
            break
    
    if not found:
        logger.warning(f"Movie not found for update: {update.title}")
        raise HTTPException(status_code=404, detail="Movie not found")
    
    save_movies(data)
    logger.info(f"Successfully updated movie: {update.title}")
    return {"status": "success", "message": "Movie updated successfully"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
