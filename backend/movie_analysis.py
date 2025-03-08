from typing import Dict, List, Counter as CounterType, Deque
from collections import Counter, deque
from config import logger

# Track the last 5 duplicate movies to avoid re-suggesting them
recent_duplicates: Deque[tuple[str, str]] = deque(maxlen=5)  # (title, reason)

def analyze_keywords(data: Dict) -> Dict[str, Dict[str, int]]:
    """Analyze keyword frequency across watched movies with scores >= 7."""
    keyword_counts = Counter()
    disliked_keywords = Counter()
    
    if "watched" in data and isinstance(data["watched"], dict) and "movies" in data["watched"]:
        for movie in data["watched"]["movies"]:
            if movie.get("keywords"):
                if movie.get("score", 0) >= 7:
                    keyword_counts.update(movie["keywords"])
                else:
                    disliked_keywords.update(movie["keywords"])
    
    return {
        "liked": dict(keyword_counts),
        "disliked": dict(disliked_keywords)
    }

def extract_year(title: str) -> tuple[str, str | None]:
    """Extract year from title if present."""
    base_title = title
    year = None
    # Look for year in parentheses at the end
    if '(' in title and ')' in title:
        year_match = title[title.find('(')+1:title.find(')')].strip()
        if year_match.isdigit() and len(year_match) == 4:
            year = year_match
            base_title = title[:title.find('(')].strip()
    return base_title, year

def normalize_title(title: str) -> str:
    """Normalize movie title for comparison."""
    # Extract year if present
    base_title, year = extract_year(title)
    
    # Convert to lowercase and remove special characters
    normalized = base_title.lower()
    normalized = ''.join(c for c in normalized if c.isalnum() or c.isspace())
    
    # Remove common words and prefixes
    words_to_remove = ['the', 'a', 'an']
    normalized = ' '.join(word for word in normalized.split() 
                         if word not in words_to_remove)
    
    # Add year back if present
    if year:
        normalized = f"{normalized} {year}"
    
    return normalized.strip()

def is_duplicate_movie(title: str | Dict, data: Dict, queued_movies: List[str]) -> tuple[bool, str | None]:
    """Check if a movie is already in any list or queue."""
    if isinstance(title, dict):
        title_str = title["title"]
    else:
        title_str = title
        
    normalized_title = normalize_title(title_str)
    base_title, year = extract_year(title_str)
    logger.info(f"Checking for duplicate: {title} (normalized: {normalized_title})")
    
    def add_to_recent_duplicates(reason_msg: str) -> tuple[bool, str]:
        """Helper to track duplicate and return result."""
        recent_duplicates.append((title_str, reason_msg))
        logger.info("Recent duplicate movies:")
        for idx, (dup_title, dup_reason) in enumerate(recent_duplicates, 1):
            logger.info(f"{idx}. {dup_title} - {dup_reason}")
        return True, reason_msg
    
    # First check if it's in recent duplicates
    for dup_title, dup_reason in recent_duplicates:
        if normalize_title(dup_title) == normalized_title:
            logger.info(f"Found in recent duplicates: {dup_title}")
            return True, f"Movie was recently rejected: {dup_reason}"
    
    # Check exact matches
    for list_name in ["watched", "want_to_watch", "not_interested", "undecided"]:
        for movie in data[list_name]:
            if normalize_title(movie["title"]) == normalized_title:
                logger.info(f"Exact match found: {movie['title']} in {list_name}")
                return add_to_recent_duplicates(f"Movie already exists in {list_name} list")
    
    # Check queue
    for queued in queued_movies:
        if normalize_title(queued) == normalized_title:
            logger.info(f"Exact match found in queue: {queued}")
            return add_to_recent_duplicates("Movie already exists in suggestion queue")
    
    # Check for similar titles (same name, different year)
    base_normalized = normalize_title(base_title)
    for list_name in ["watched", "want_to_watch", "not_interested", "undecided"]:
        for movie in data[list_name]:
            movie_base, _ = extract_year(movie["title"])
            if normalize_title(movie_base) == base_normalized:
                logger.info(f"Similar title found: {movie['title']} in {list_name}")
                return add_to_recent_duplicates(f"Similar movie exists in {list_name} list")
    
    # Check queue for similar titles
    for queued in queued_movies:
        queued_base, _ = extract_year(queued)
        if normalize_title(queued_base) == base_normalized:
            logger.info(f"Similar title found in queue: {queued}")
            return add_to_recent_duplicates("Similar movie exists in suggestion queue")
    
    return False, None
