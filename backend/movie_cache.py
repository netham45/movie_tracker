import json
import os
import hashlib
from typing import Dict, List, Optional, Tuple
from config import logger

CACHE_DIR = "cache/recommendations"
REJECTS_FILE = "cache/recent_rejects.json"
MAX_RECENT_REJECTS = 50

def get_cache_path(title: str) -> str:
    """Get the cache file path for a movie's recommendations."""
    # Create hash of title for filename
    title_hash = hashlib.md5(title.encode()).hexdigest()
    return os.path.join(CACHE_DIR, f"{title_hash}.json")

def ensure_cache_dir():
    """Ensure the cache directory exists."""
    os.makedirs(CACHE_DIR, exist_ok=True)
    os.makedirs(os.path.dirname(REJECTS_FILE), exist_ok=True)

def load_recent_rejects() -> List[Tuple[str, str]]:
    """Load the list of recently rejected movies."""
    if not os.path.exists(REJECTS_FILE):
        return []
    try:
        with open(REJECTS_FILE, 'r') as f:
            rejects = json.load(f)
            return [(r['title'], r['normalized']) for r in rejects]
    except Exception as e:
        logger.error(f"Error loading recent rejects: {str(e)}")
        return []

def save_recent_rejects(rejects: List[Tuple[str, str]]):
    """Save the list of recently rejected movies."""
    try:
        # Convert to list of dicts for JSON serialization
        rejects_json = [{'title': title, 'normalized': norm} for title, norm in rejects]
        with open(REJECTS_FILE, 'w') as f:
            json.dump(rejects_json, f)
    except Exception as e:
        logger.error(f"Error saving recent rejects: {str(e)}")

def add_to_recent_rejects(title: str, normalized: str):
    """Add a movie to the recent rejects list."""
    rejects = load_recent_rejects()
    rejects.append((title, normalized))
    if len(rejects) > MAX_RECENT_REJECTS:
        rejects.pop(0)  # Remove oldest reject
    save_recent_rejects(rejects)

def load_cached_recommendations(title: str) -> Optional[List[Dict]]:
    """Load cached recommendations for a movie."""
    cache_path = get_cache_path(title)
    if not os.path.exists(cache_path):
        return None
    
    try:
        with open(cache_path, 'r') as f:
            cache = json.load(f)
            logger.info(f"Loaded {len(cache['recommendations'])} cached recommendations for {title}")
            return cache['recommendations']
    except Exception as e:
        logger.error(f"Error loading cache for {title}: {str(e)}")
        return None

def save_recommendations(title: str, recommendations: List[Dict]):
    """Save recommendations to cache."""
    ensure_cache_dir()
    cache_path = get_cache_path(title)
    
    try:
        cache = {
            'title': title,
            'recommendations': recommendations
        }
        with open(cache_path, 'w') as f:
            json.dump(cache, f, indent=2)
        logger.info(f"Saved {len(recommendations)} recommendations for {title} to cache")
    except Exception as e:
        logger.error(f"Error saving cache for {title}: {str(e)}")

def get_unused_recommendations(title: str, used_titles: List[str]) -> List[Dict]:
    """Get recommendations that haven't been used yet."""
    cached = load_cached_recommendations(title)
    if not cached:
        return []
    
    # Filter out used recommendations
    unused = [r for r in cached if r['title'] not in used_titles]
    logger.info(f"Found {len(unused)} unused recommendations for {title}")
    return unused

def add_recommendation(title: str, recommendation: Dict):
    """Add a single recommendation to the cache."""
    cached = load_cached_recommendations(title) or []
    cached.append(recommendation)
    save_recommendations(title, cached)
