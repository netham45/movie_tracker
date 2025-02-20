import yaml
import json
import os
import time
from dotenv import load_dotenv
from anthropic import Anthropic
from movie_storage import load_movies, save_movies
from config import logger

# Load environment variables
load_dotenv()

# Initialize Anthropic client
client = Anthropic(api_key=os.getenv('ANTHROPIC_API_KEY'))

def get_movie_description(title: str) -> str:
    """Get an AI-generated description for a movie."""
    try:
        prompt = f"""You are a movie expert. For the movie "{title}", provide a 2-3 sentence description focusing on what makes this movie special and memorable. The description should be informative and engaging, highlighting key aspects like plot elements, themes, or stylistic choices that make the film stand out.

Return ONLY the description text, with no additional formatting or commentary."""

        message = client.messages.create(
            model="claude-3-5-sonnet-20241022",
            max_tokens=200,
            temperature=0.7,
            messages=[{
                "role": "user",
                "content": prompt
            }]
        )
        
        description = message.content[0].text.strip()
        logger.info(f"Generated description for {title}")
        return description

    except Exception as e:
        logger.error(f"Error generating description for {title}: {str(e)}")
        return None

def main():
    # Load current movies
    data = load_movies()
    
    # Process each list
    lists = ['watched', 'want_to_watch', 'not_interested', 'undecided']
    total_movies = sum(len(data[lst]) for lst in lists)
    processed = 0

    for list_name in lists:
        logger.info(f"Processing {list_name} list...")
        
        for movie in data[list_name]:
            if not movie.get('description'):  # Only process movies without descriptions
                title = movie['title']
                logger.info(f"Generating description for {title} ({processed + 1}/{total_movies})")
                
                description = get_movie_description(title)
                if description:
                    movie['description'] = description
                    # Save after each successful description in case of interruption
                    save_movies(data)
                    logger.info(f"Saved description for {title}")
                
                # Sleep to avoid hitting API rate limits
                time.sleep(1)
            
            processed += 1

    logger.info("Finished generating descriptions")

if __name__ == "__main__":
    main()
