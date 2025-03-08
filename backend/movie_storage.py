import yaml
import json
import requests
import mimetypes
from pathlib import Path
from typing import Dict, Optional
from config import logger
from fastapi.responses import FileResponse

OMDB_API_KEY = 'bf7a5c7b'
OMDB_BASE_URL = 'https://www.omdbapi.com'
CACHE_DIR = Path('cache/posters')

# Create cache directory if it doesn't exist
CACHE_DIR.mkdir(parents=True, exist_ok=True)

def _download_image(url: str, file_path: Path) -> bool:
    """Download image from URL and save to file."""
    try:
        response = requests.get(url, stream=True)
        if response.status_code == 200:
            content_type = response.headers.get('content-type', '')
            if not content_type.startswith('image/'):
                return False
            
            ext = mimetypes.guess_extension(content_type)
            if not ext:
                ext = '.jpg'  # Default to jpg if can't determine type
            
            file_path = file_path.with_suffix(ext)
            with open(file_path, 'wb') as f:
                for chunk in response.iter_content(chunk_size=8192):
                    f.write(chunk)
            return True
    except Exception as e:
        logger.error(f"Error downloading image: {e}")
    return False

def load_movies() -> Dict:
    """Load movies data from YAML file."""
    try:
        with open("movies.yaml", "r") as file:
            data = yaml.safe_load(file) or {
                "watched": [], 
                "want_to_watch": [], 
                "not_interested": [],
                "undecided": [],
                "preferences": {
                    "genres": [],
                    "keywords": [],
                    "comments": None
                }
            }
            # Ensure preferences exist in older files
            if "preferences" not in data:
                data["preferences"] = {
                    "genres": [],
                    "keywords": [],
                    "comments": None
                }
            return data
    except Exception as e:
        logger.error(f"Error loading movies: {e}", exc_info=True)
        return {
            "watched": [], 
            "want_to_watch": [], 
            "not_interested": [],
            "undecided": [],
            "preferences": {
                "genres": [],
                "keywords": []
            }
        }

def save_movies(data: Dict) -> None:
    """Save movies data to YAML file."""
    try:
        with open("movies.yaml", "w") as file:
            yaml.dump(data, file, default_flow_style=False)
        logger.info("Movies saved successfully")
    except Exception as e:
        logger.error(f"Error saving movies: {e}", exc_info=True)

def get_movie_poster(title: str) -> Optional[FileResponse]:
    """Get movie poster image with caching."""
    # Parse title and year
    match = title.strip().split('(')
    movie_title = match[0].strip()
    year = match[1][:-1] if len(match) > 1 else None
    
    # Create safe filename
    safe_title = "".join(c for c in title if c.isalnum() or c in (' ', '-', '_')).rstrip()
    safe_title = safe_title.replace("/","_")
    
    # Check cache
    existing_files = list(CACHE_DIR.glob(f"{safe_title}.*"))
    if existing_files:
        logger.info(f"Poster found in cache for: {title}")
        return FileResponse(existing_files[0])
    
    # If not in cache, fetch from OMDB
    try:
        # Make request with title and year
        params = {
            'apikey': OMDB_API_KEY,
            't': movie_title
        }
        if year:
            params['y'] = year
            
        logger.info(f"Requesting OMDB for title='{movie_title}' year='{year}'")
        response = requests.get(OMDB_BASE_URL, params=params)
        data = response.json()
        logger.info(f"OMDB response: {data}")
        
        if data.get('Response') == 'True' and data.get('Poster') and data['Poster'] != 'N/A':
            logger.info(f"Found poster URL: {data['Poster']}")
            if _download_image(data['Poster'], CACHE_DIR / safe_title):
                cached_file = next(CACHE_DIR.glob(f"{safe_title}.*"))
                logger.info(f"Poster downloaded and cached for: {title}")
                return FileResponse(cached_file)
            
    except Exception as e:
        logger.error(f"Error fetching poster for {title}: {e}")
        
    return None
