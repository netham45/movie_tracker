import json
import os
import random
import traceback
from datetime import datetime
from typing import Dict, List, Tuple
import openai
import anthropic
from config import logger
from movie_analysis import analyze_keywords, normalize_title, extract_year

# AI Provider Configuration
AI_PROVIDER = "openai"  # Options: "anthropic" or "openai"

# Load environment variables
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
OPENAI_BASE_URL = os.getenv("OPENAI_BASE_URL", "https://api.openai.com/v1")
OPENAI_MODEL = os.getenv("OPENAI_MODEL", "gpt-4-turbo-preview")
ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY")

# Initialize clients based on provider
if AI_PROVIDER == "openai":
    if not OPENAI_API_KEY:
        raise ValueError("OPENAI_API_KEY environment variable is required when using OpenAI")
    openai.api_key = OPENAI_API_KEY
    openai.base_url = OPENAI_BASE_URL
elif AI_PROVIDER == "anthropic":
    if not ANTHROPIC_API_KEY:
        raise ValueError("ANTHROPIC_API_KEY environment variable is required when using Anthropic")
    anthropic_client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)
else:
    raise ValueError("AI_PROVIDER must be either 'anthropic' or 'openai'")

# Ensure logs directory exists
os.makedirs('logs', exist_ok=True)

def _log_prompt(prompt: str) -> None:
    """Log the prompt to a file with timestamp."""
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"logs/prompt_{timestamp}.txt"
    try:
        with open(filename, 'w', encoding='utf-8') as f:
            f.write(prompt)
        logger.info(f"Prompt logged to {filename}")
    except Exception as e:
        logger.error(f"Failed to log prompt: {str(e)}")

from movie_cache import load_recent_rejects, add_to_recent_rejects

def generate_single_suggestion(data: Dict, max_retries: int = 30, title: str = None, previous_suggestions: List[str] = None, reject_duplicates: bool = False) -> Dict:
    """Generate a single movie suggestion or get details for a specific movie.
    
    Args:
        data: Dictionary containing user's movie lists and preferences
        max_retries: Maximum number of attempts to generate a valid suggestion
        title: Optional specific movie title to get details for
        previous_suggestions: Optional list of previously suggested movies to avoid
        reject_duplicates: Whether to reject movies that are duplicates or in user's lists
    """
    logger.info("Starting suggestion generation")
    
    for attempt in range(max_retries):
        try:
            logger.info(f"Attempt {attempt + 1} of {max_retries}")
            
            if title and not previous_suggestions:
                # For specific movie details
                prompt = f"""You are a movie expert. For the movie "{title}", provide detailed information as a raw JSON object (not in markdown code blocks) in this exact format:
{{
  "title": "Movie Title (YEAR)",
  "description": "2-3 sentence description focusing on what makes this movie special",
  "keywords": ["keyword1", "keyword2", "keyword3"],
  "credits": {{
    "directors": ["name1", "name2"],
    "cast": ["name1", "name2", "name3", "name4"],
    "writers": ["name1", "name2"]
  }}
}}

Requirements:
1. Include the year in the title (e.g., "The Matrix (1999)")
2. The description should highlight key aspects like plot elements, themes, or stylistic choices
3. The keywords must accurately describe the movie's themes, genres, and notable elements
4. Include all major cast and crew members"""
            else:
                # For generating related movies or suggestions
                keyword_analysis = analyze_keywords(data)
                
                # Add previous suggestions to avoid duplicates
                previous_suggestions_str = ""
                if previous_suggestions:
                    previous_suggestions_str = f"\n\nIMPORTANT: DO NOT suggest any of these previously suggested related movies:\n{', '.join(previous_suggestions)}"
                
                # Helper function to shuffle a list while preserving the original
                def shuffled_copy(items):
                    items_copy = items.copy()
                    random.shuffle(items_copy)
                    return items_copy
                
                logger.info(f"Keyword analysis - Liked: {len(keyword_analysis['liked'])}, Disliked: {len(keyword_analysis['disliked'])}")
                
                # Get user preferences
                preferred_genres = data["preferences"]["genres"]
                preferred_keywords = data["preferences"]["keywords"]
                user_comments = data["preferences"].get("comments")

                # Build preference strings
                genre_str = f"\nPreferred Genres: {', '.join(preferred_genres)}" if preferred_genres else ""
                keyword_str = f"\nPreferred Keywords: {', '.join(preferred_keywords)}" if preferred_keywords else ""
                comments_str = f"\nUser Comments: {user_comments}" if user_comments else ""

                # Build keyword requirements string
                keyword_requirements = ""
                if preferred_keywords:
                    keyword_requirements = f"\nIMPORTANT: The suggested movie MUST include at least one of these keywords: {', '.join(preferred_keywords)}"

                # Get recent rejects to explicitly tell AI not to suggest them if rejecting duplicates
                recent_rejects_str = ""
                if reject_duplicates:
                    recent_rejects = load_recent_rejects()
                    recent_reject_titles = [title for title, _ in recent_rejects]
                    if recent_reject_titles:
                        recent_rejects_str = f"\n\nCRITICAL - DO NOT SUGGEST THESE RECENTLY REJECTED MOVIES:\n{', '.join(recent_reject_titles)}"

                # Create shuffled copies of all movie lists
                watched_shuffled = shuffled_copy([m for m in data["watched"] if m.get("score") is not None])
                want_to_watch_shuffled = shuffled_copy(data["want_to_watch"])
                undecided_shuffled = shuffled_copy(data["undecided"])
                not_interested_shuffled = shuffled_copy(data["not_interested"])
                
                # Randomize the order of keywords
                liked_keywords = list(keyword_analysis['liked'].items())
                disliked_keywords = list(keyword_analysis['disliked'].items())
                random.shuffle(liked_keywords)
                random.shuffle(disliked_keywords)
                liked_keywords_dict = dict(liked_keywords)
                disliked_keywords_dict = dict(disliked_keywords)
                
                prompt = f"""You are a movie expert. Based on the user's movie preferences:

IMPORTANT: You must NOT suggest any movies that were recently rejected.{recent_rejects_str}{previous_suggestions_str}

{f'For a movie similar to "{title}", suggest a related movie based on these preferences:' if title else 'Based on these preferences, suggest a movie that matches the user\'s interests.'}

Movie History:
- Watched Movies (with scores):
{', '.join(f"{m['title']} ({m['score']}/10)" for m in watched_shuffled)}
- Want to Watch: {', '.join(m["title"] for m in want_to_watch_shuffled)}
- Undecided About: {', '.join(m["title"] for m in undecided_shuffled)}
- Not Interested In: {', '.join(m["title"] for m in not_interested_shuffled)}
{genre_str}{keyword_str}

Keyword Analysis:
- Keywords from Highly Rated Movies: {json.dumps(liked_keywords_dict)}
- Keywords from Lower Rated Movies: {json.dumps(disliked_keywords_dict)}{keyword_requirements}

Based on these preferences, suggest a movie that matches the user's interests. Return ONLY a raw JSON object (not in markdown code blocks) in this exact format:
{{
  "title": "Movie Title (YEAR)",
  "description": "2-3 sentence description focusing on what makes this movie special",
  "keywords": ["keyword1", "keyword2", "keyword3"],
  "credits": {{
    "directors": ["name1", "name2"],
    "cast": ["name1", "name2", "name3", "name4"],
    "writers": ["name1", "name2"]
  }}
}}

Requirements:
1. Include the year in the title (e.g., "The Matrix (1999)")
2. Do not suggest any movies from the lists above
3. If preferred keywords are specified, the movie MUST match at least one of them
4. Weight the user's preferences:
   - Highly rated watched movies are strong positive indicators
   - Movies in "Want to Watch" suggest interest in similar films
   - Movies in "Not Interested" indicate strong negative preferences
   - "Undecided" movies should be considered neutral
   - Preferred genres should heavily influence suggestions
5. The keywords you provide must be accurate and descriptive, as they will be used for future matching"""

            # Log the prompt before sending
            _log_prompt(prompt)
            logger.info(f"Sending AI request for suggestion with prompt length: {len(prompt)}")
            if AI_PROVIDER == "anthropic":
                message = anthropic_client.messages.create(
                    model="claude-3-7-sonnet-20250219",
                    max_tokens=500,
                    temperature=0.7,
                    messages=[{
                        "role": "user",
                        "content": prompt
                    }]
                )
                logger.info(f"Received Anthropic response for suggestion. Content length: {len(message.content[0].text)}")
                response_text = message.content[0].text.strip()
            else:  # OpenAI
                message = openai.chat.completions.create(
                    model=OPENAI_MODEL,
                    temperature=0.7,
                    messages=[{
                        "role": "user",
                        "content": prompt
                    }]
                )
                logger.info(f"Received OpenAI response for suggestion. Content length: {len(message.choices[0].message.content)}")
                response_text = message.choices[0].message.content.strip()
            
            # Remove markdown code blocks if present
            if response_text.startswith("```") and "```" in response_text[3:]:
                # Extract content between first ``` and last ```
                first_marker = response_text.find("```")
                last_marker = response_text.rfind("```")
                # Skip the first line if it contains language specification (e.g., ```json)
                content_start = response_text.find("\n", first_marker) + 1
                content_end = last_marker
                response_text = response_text[content_start:content_end].strip()
            
            # Try to parse the JSON
            try:
                suggestion = json.loads(response_text)
            except json.JSONDecodeError as e:
                logger.error(f"JSON parsing error: {str(e)}")
                logger.error(f"Response text: {response_text}")
                raise
            suggested_title = suggestion['title']
            logger.info(f"AI suggested movie: {suggested_title}")

            if reject_duplicates:
                # Check if this movie was recently rejected or exists in any list
                suggested_normalized = normalize_title(suggested_title)
                suggested_base, _ = extract_year(suggested_title)
                suggested_base_normalized = normalize_title(suggested_base)
                
                # First check recent rejects
                is_duplicate = False
                recent_rejects = load_recent_rejects()
                for rejected_title, rejected_normalized in recent_rejects:
                    rejected_base, _ = extract_year(rejected_title)
                    rejected_base_normalized = normalize_title(rejected_base)
                    
                    # Check both exact matches and similar titles
                    if suggested_normalized == rejected_normalized or suggested_base_normalized == rejected_base_normalized:
                        logger.warning(f"AI suggested a recently rejected movie: {suggested_title} (matches {rejected_title})")
                        is_duplicate = True
                        break
                
                # Then check all user lists
                if not is_duplicate:
                    # Helper function to check if movie exists in a list
                    def movie_exists_in_list(movie_list):
                        for m in movie_list:
                            m_title = m.get('title', '')  # Handle both dict and string formats
                            if isinstance(m, str):
                                m_title = m
                            m_normalized = normalize_title(m_title)
                            m_base, _ = extract_year(m_title)
                            m_base_normalized = normalize_title(m_base)
                            
                            if suggested_normalized == m_normalized or suggested_base_normalized == m_base_normalized:
                                return True
                        return False
                    
                    # Check each list
                    if (movie_exists_in_list(data["watched"]) or
                        movie_exists_in_list(data["want_to_watch"]) or
                        movie_exists_in_list(data["undecided"]) or
                        movie_exists_in_list(data["not_interested"])):
                        logger.warning(f"AI suggested a movie that's already in user's lists: {suggested_title}")
                        is_duplicate = True
                
                if is_duplicate:
                    # Add to recent rejects if it's not already in the list
                    add_to_recent_rejects(suggested_title, suggested_normalized)
                    continue

            if not title and reject_duplicates:  # Only validate keywords for suggestions with duplicate rejection
                # Verify keywords match preferences if any are specified
                if preferred_keywords and not any(k in suggestion['keywords'] for k in preferred_keywords):
                    logger.warning(f"Suggested movie {suggestion['title']} doesn't match any preferred keywords")
                    add_to_recent_rejects(suggested_title, suggested_normalized)  # Add to rejects since it didn't match requirements
                    continue

            logger.info(f"Successfully completed suggestion generation for {suggestion['title']}")
            return suggestion

        except Exception as e:
            logger.error(f"Error in attempt {attempt + 1}: {str(e)}\n{traceback.format_exc()}")
            if attempt == max_retries - 1:
                raise

    logger.error("Failed to generate unique suggestion after max retries")
    raise Exception("Could not generate unique movie suggestion")
