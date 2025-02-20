from pydantic import BaseModel
from typing import Optional, List

class Movie(BaseModel):
    title: str
    score: Optional[int] = None
    date_watched: Optional[str] = None
    added_date: Optional[str] = None
    keywords: Optional[List[str]] = None
    description: Optional[str] = None

class AISuggestion(BaseModel):
    skip: bool = False

class MovieUpdate(BaseModel):
    title: str
    new_score: Optional[int] = None
    new_list: Optional[str] = None

class PreferencesUpdate(BaseModel):
    genres: List[str]
    keywords: List[str]
    comments: Optional[str] = None
