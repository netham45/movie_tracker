from collections import deque
from threading import Lock
from typing import Dict, List, Deque
from config import logger
from movie_analysis import normalize_title, is_duplicate_movie

# Queue to store movie suggestions
suggestion_queue: Deque[Dict] = deque(maxlen=5)
queue_titles: set[str] = set()  # Track unique titles in queue
queue_lock = Lock()

def add_to_queue(suggestion: Dict, data: Dict) -> bool:
    """Add suggestion to queue if not duplicate. Return True if added."""
    with queue_lock:
        # First check if it's already in any list or the queue
        is_duplicate, reason = is_duplicate_movie(suggestion["title"], data, [s["title"] for s in suggestion_queue])
        if is_duplicate:
            logger.warning(f"Rejected duplicate: {suggestion['title']} - {reason}")
            return False
        
        # Double check the normalized title isn't in our tracking set
        normalized_title = normalize_title(suggestion["title"])
        if normalized_title in queue_titles:
            logger.warning(f"Rejected duplicate (queue set): {suggestion['title']}")
            return False
        
        # If we get here, it's definitely not a duplicate
        suggestion_queue.append(suggestion)
        queue_titles.add(normalized_title)
        logger.info(f"Added unique suggestion to queue: {suggestion['title']} (queue size: {len(suggestion_queue)})")
        return True

def remove_from_queue() -> Dict | None:
    """Remove and return next suggestion from queue."""
    with queue_lock:
        if not suggestion_queue:
            return None
        suggestion = suggestion_queue.popleft()
        queue_titles.remove(normalize_title(suggestion["title"]))
        return suggestion

def clear_queue() -> None:
    """Clear the suggestion queue and title tracking set."""
    with queue_lock:
        suggestion_queue.clear()
        queue_titles.clear()
        logger.info("Cleared suggestion queue and title tracking set")
