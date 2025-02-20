import yaml
from typing import Dict
from config import logger

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
