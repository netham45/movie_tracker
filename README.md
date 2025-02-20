# Movie Suggestions App

A full-stack application that helps you discover and track movies using AI-powered suggestions based on your preferences and viewing history.

## Features

### Core Features
- AI-powered movie suggestions based on your preferences
- Track movies in different lists:
  - Watched (with ratings)
  - Want to Watch
  - Not Interested
  - Undecided
- Smart keyword analysis of your movie preferences
- Detailed movie descriptions and insights
- Modern, responsive UI built with Chakra UI

### Frontend Features
- Interactive movie cards with:
  - Movie title and rating display
  - Direct links to IMDB and Rotten Tomatoes
  - Quick action buttons (Watch, Skip, Delete)
  - Rating system with visual score indicators
  - Keyword tags and movie descriptions
- AI Suggestion modal with:
  - Detailed movie information
  - Cast and crew details
  - Quick actions to add to different lists
  - Rating selector for watched movies
- Preferences management:
  - Genre selection
  - Keyword preferences based on viewing history
  - Additional comments for customizing suggestions
- Responsive grid layout for different screen sizes
- Toast notifications for user feedback
- Custom theme with light mode optimization

## Tech Stack

### Backend
- Python 3.x
- FastAPI
- Anthropic API for AI-powered suggestions
- YAML for data storage
- uvicorn for ASGI server

### Frontend
- React 19 with TypeScript for type safety
- Vite for fast development and optimized builds
- Chakra UI components:
  - Modals for movie details and preferences
  - Cards for movie displays
  - Grid system for responsive layouts
  - Toast notifications
  - Form controls (Input, Select, Checkbox)
  - Custom theme configuration
- Axios for API communication
- Custom hooks for state management
- External service integrations (IMDB, Rotten Tomatoes links)

## Installation

1. Clone the repository:
```bash
git clone https://github.com/netham45/movie_tracker
cd movie-suggestions
```

2. Set up the backend:
```bash
cd backend
python -m venv venv
# On Windows
venv\Scripts\activate
# On macOS/Linux
source venv/bin/activate
pip install -r requirements.txt
```

3. Create a `.env` file in the backend/ directory with your Anthropic API key:
```
ANTHROPIC_API_KEY=your-api-key-here
```

4. Set up the frontend:
```bash
cd ../frontend
npm install
```

## Usage

1. Start the backend server:
```bash
cd backend
# Activate virtual environment if not already activated
python main.py
```
The backend will run on `http://localhost:8000`

2. Start the frontend development server:
```bash
cd frontend
npm run dev
```
The frontend will run on `http://localhost:5173`
