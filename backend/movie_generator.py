import json
import traceback
from typing import Dict, List
from threading import Thread
from config import logger, client
from movie_queue import add_to_queue, remove_from_queue, suggestion_queue
from movie_analysis import analyze_keywords, recent_duplicates, normalize_title, extract_year

def generate_single_suggestion(data: Dict, max_retries: int = 3, title: str = None) -> Dict:
    """Generate a single movie suggestion or get details for a specific movie."""
    logger.info("Starting suggestion generation")
    
    for attempt in range(max_retries):
        try:
            logger.info(f"Attempt {attempt + 1} of {max_retries}")
            
            if title:
                # For specific movie details
                prompt = f"""You are a movie expert. For the movie "{title}", provide detailed information in this exact JSON format:
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
                # For generating suggestions
                keyword_analysis = analyze_keywords(data)
                
                # Get currently queued movies from the queue
                from movie_queue import suggestion_queue
                queued_movies = [s["title"] for s in suggestion_queue]

                logger.info(f"Current queue size: {len(suggestion_queue)}")
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

                # Get recent duplicates to explicitly tell AI not to suggest them
                recent_duplicate_titles = [title for title, _ in recent_duplicates]
                recent_duplicates_str = f"\n\nCRITICAL - DO NOT SUGGEST THESE RECENTLY REJECTED MOVIES:\n{', '.join(recent_duplicate_titles)}" if recent_duplicate_titles else ""

                prompt = f"""You are a movie expert. Based on the user's movie preferences:

IMPORTANT: You must NOT suggest any movies that were recently rejected.{recent_duplicates_str}

Movie History:
- Watched Movies (with scores):
{', '.join(f"{m['title']} ({m['score']}/10)" for m in data["watched"] if m.get("score") is not None)}
- Want to Watch: {', '.join(m["title"] for m in data["want_to_watch"])}
- Undecided About: {', '.join(m["title"] for m in data["undecided"])}
- Not Interested In: {', '.join(m["title"] for m in data["not_interested"])}
- Currently Queued Suggestions: {', '.join(queued_movies)}{genre_str}{keyword_str}

Keyword Analysis:
- Keywords from Highly Rated Movies: {json.dumps(keyword_analysis['liked'])}
- Keywords from Lower Rated Movies: {json.dumps(keyword_analysis['disliked'])}{keyword_requirements}

Based on these preferences, suggest a movie that matches the user's interests. Return ONLY a JSON object in this exact format:
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
2. Do not suggest any movies from the lists above or from the currently queued suggestions
3. If preferred keywords are specified, the movie MUST match at least one of them
4. Weight the user's preferences:
   - Highly rated watched movies are strong positive indicators
   - Movies in "Want to Watch" suggest interest in similar films
   - Movies in "Not Interested" indicate strong negative preferences
   - "Undecided" movies should be considered neutral
   - Preferred genres should heavily influence suggestions
5. The keywords you provide must be accurate and descriptive, as they will be used for future matching"""

            logger.info(f"Sending AI request for suggestion with prompt length: {len(prompt)}")
            message = client.messages.create(
                model="claude-3-5-sonnet-20241022",
                max_tokens=500,
                temperature=0.7,
                messages=[{
                    "role": "user",
                    "content": prompt
                }]
            )
            logger.info(f"Received AI response for suggestion. Content length: {len(message.content[0].text)}")
            print(message.content[0].text)
            suggestion = json.loads(message.content[0].text)
            suggested_title = suggestion['title']
            logger.info(f"AI suggested movie: {suggested_title}")

            # Check if this movie was recently rejected
            suggested_normalized = normalize_title(suggested_title)
            suggested_base, _ = extract_year(suggested_title)
            suggested_base_normalized = normalize_title(suggested_base)
            
            is_recent_duplicate = False
            for rejected_title, _ in recent_duplicates:
                rejected_normalized = normalize_title(rejected_title)
                rejected_base, _ = extract_year(rejected_title)
                rejected_base_normalized = normalize_title(rejected_base)
                
                # Check both exact matches and similar titles
                if suggested_normalized == rejected_normalized or suggested_base_normalized == rejected_base_normalized:
                    logger.warning(f"AI suggested a recently rejected movie: {suggested_title} (matches {rejected_title})")
                    is_recent_duplicate = True
                    break
            
            if is_recent_duplicate:
                continue

            if not title:  # Only validate keywords for suggestions, not specific movies
                # Verify keywords match preferences if any are specified
                if preferred_keywords and not any(k in suggestion['keywords'] for k in preferred_keywords):
                    logger.warning(f"Suggested movie {suggestion['title']} doesn't match any preferred keywords")
                    continue

            logger.info(f"Successfully completed suggestion generation for {suggestion['title']}")
            return suggestion

        except Exception as e:
            logger.error(f"Error in attempt {attempt + 1}: {str(e)}\n{traceback.format_exc()}")
            if attempt == max_retries - 1:
                raise

    logger.error("Failed to generate unique suggestion after max retries")
    raise Exception("Could not generate unique movie suggestion")

def fill_suggestion_queue(data: Dict) -> None:
    """Fill the suggestion queue with new suggestions."""
    logger.info("Starting to fill suggestion queue")
    needed = 5 - len(suggestion_queue)
    logger.info(f"Need to generate {needed} suggestions")
    
    attempts = 0
    max_attempts = needed * 5  # Allow more attempts since we're being stricter
    
    while len(suggestion_queue) < 5 and attempts < max_attempts:
        try:
            logger.info(f"Generating new suggestion (attempt {attempts + 1}/{max_attempts})")
            suggestion = generate_single_suggestion(data)
            if suggestion:  # Only try to add if we got a valid suggestion
                if add_to_queue(suggestion, data):  # Pass data for duplicate checking
                    logger.info(f"Successfully added unique suggestion: {suggestion['title']}")
                else:
                    logger.warning(f"Duplicate detected, incrementing attempts")
                    attempts += 1
            else:
                logger.error("Failed to generate suggestion (returned None)")
                return
        except Exception as e:
            logger.error(f"Error generating suggestion: {str(e)}\n{traceback.format_exc()}")
            return
    
    if len(suggestion_queue) < 5:
        logger.warning(f"Could only generate {len(suggestion_queue)} unique suggestions after {max_attempts} attempts")
    logger.info("Finished filling suggestion queue")

def get_movie_suggestion(data: Dict) -> Dict:
    """Get AI movie suggestion from the queue."""
    logger.info("Getting movie suggestion")
    
    suggestion = remove_from_queue()
    if not suggestion:
        logger.info("Queue empty, generating immediate suggestion")
        while True:  # Keep trying until we get a unique suggestion
            suggestion = generate_single_suggestion(data)
            if add_to_queue(suggestion, data):  # Verify it's unique
                remove_from_queue()  # Remove it since we're returning it
                break
            logger.warning("Generated duplicate suggestion, retrying...")
    else:
        logger.info(f"Retrieved suggestion from queue: {suggestion['title']} (queue size: {len(suggestion_queue)})")
    
    # Start a background thread to fill the queue
    Thread(target=fill_suggestion_queue, args=(data,), daemon=True).start()
    logger.info("Started background thread to fill queue")
    
    return suggestion
