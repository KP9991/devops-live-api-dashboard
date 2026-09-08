# DevOps Live API Dashboard

A responsive Flask dashboard that integrates multiple public APIs into one practical monitoring application.

The project was created as part of my hands-on DevOps learning journey, covering Python, API integration, testing, Git, Docker and CI/CD.

## Features

- AI-generated bilingual quizzes in English and Hindi
- Custom quiz topics, difficulty levels and question counts
- GitHub Actions workflow monitoring
- Live weather information
- Country information and flags
- Currency conversion
- NASA Astronomy Picture of the Day
- Air Quality Index and UV safety advice
- Application health-check endpoint
- Responsive dashboard interface
- Automated testing with pytest
- Interactive entertainment trivia quiz with multiple categories
- Live score, answer feedback and replay functionality

## Technology Stack

- Google Gen AI SDK
- Pydantic
- Python
- Flask
- HTML5
- CSS3
- JavaScript
- Requests
- Pytest
- Gunicorn
- Git and GitHub
- Docker
- GitHub Actions

## Public APIs

- Google Gemini API
- GitHub REST API
- Open-Meteo Weather API
- Open-Meteo Air Quality API
- countries.dev
- Frankfurter Currency API
- NASA APOD API
- Open Trivia DB API

## Gemini API Setup

The AI bilingual quiz requires a Gemini API key. Keep the key in an
environment variable and never commit it to Git.

```bash
read -s -p "Enter Gemini API key: " GEMINI_API_KEY
echo
export GEMINI_API_KEY
python app.py

## Project Structure

```text
devops-live-api-dashboard/
├── app.py
├── test_app.py
├── requirements.txt
├── templates/
│   └── index.html
├── static/
│   ├── css/
│   │   └── style.css
│   └── js/
│       └── dashboard.js
└── README.md
