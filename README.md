# AtlasTalk

A conversational AI platform for practicing real-world scenarios through voice and text interactions. Built for NewHacks 2025.

## Overview

AtlasTalk helps users practice everyday conversations in different cultural contexts using AI-powered roleplay scenarios. Whether you're learning a new language, preparing for travel, or improving your communication skills, AtlasTalk provides realistic practice scenarios with voice and text support.

## Features

- **Interactive Map Interface**: Explore different countries and cultural contexts through an interactive world map
- **AI-Powered Conversations**: Practice realistic scenarios powered by Google Gemini AI
- **Voice & Text Modes**: Choose between voice interaction with speech-to-text/text-to-speech or pure text-based conversations
- **Scenario-Based Learning**: Practice specific situations like ordering at a cafe, taking a taxi, or attending family gatherings
- **Goal Tracking**: Track your conversation objectives and progress in real-time
- **Multiple Scenarios**: 15+ pre-configured scenarios across different cultural contexts including:
  - Taxi rides
  - Coffee shops and cafes
  - College settings
  - Family gatherings
  - Street vendors
  - Restaurants and dining
  - Beach conversations
  - Office interactions
  - And more

## Tech Stack

### Backend
- **FastAPI**: High-performance Python web framework
- **MongoDB**: NoSQL database for conversation storage
- **Google Gemini AI**: Advanced language model for realistic conversations
- **ElevenLabs**: Text-to-speech and speech-to-text capabilities
- **Python 3.x**: Core backend language

### Frontend
- **Next.js 16**: React framework with server-side rendering
- **React 19**: Modern UI components
- **TypeScript**: Type-safe development
- **Tailwind CSS**: Utility-first styling
- **Radix UI**: Accessible component primitives
- **Framer Motion**: Smooth animations

## Getting Started

### Prerequisites

- Python 3.8 or higher
- Node.js 18 or higher
- MongoDB (local or cloud instance)
- API Keys:
  - Google Gemini API key
  - ElevenLabs API key (for audio features)

### Backend Setup

1. Navigate to the project root:
```bash
cd AtlasTalk
```

2. Install Python dependencies:
```bash
pip install -r requirements.txt
```

3. Create a `.env` file in the root directory:
```env
GEMINI_API_KEY=your_gemini_api_key
ELEVENLABS_API_KEY=your_elevenlabs_api_key
TEXT_ONLY_MODE=false
MONGODB_URI=mongodb://localhost:27017
MONGODB_DB=altastalk
```

4. Start the backend server:
```bash
cd backend
python main.py
```

The API will be available at `http://localhost:8000`

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install Node dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

The frontend will be available at `http://localhost:3000`

### Alternative: Voice Roleplay HTML Interface

For a quick start with the voice roleplay feature, you can use the standalone HTML interface:

```bash
# Ensure backend is running
cd temporaryFrontend
# Open voice-roleplay.html in your browser
```

## API Documentation

Once the backend is running, visit `http://localhost:8000/docs` for interactive API documentation.

### Key Endpoints

- `GET /` - API status and configuration
- `POST /conversations/` - Create a new conversation
- `GET /conversations/` - List all conversations
- `POST /conversations/{id}/messages` - Send a message in a conversation
- `POST /audio/speech-to-text` - Convert audio to text
- `POST /audio/text-to-speech` - Convert text to audio
- `GET /agents/` - List available conversation agents

### Example: Creating a Conversation

```bash
curl -X POST "http://localhost:8000/conversations/" \
  -H "Content-Type: application/json" \
  -d '{
    "agent_name": "BARISTA",
    "user_name": "John"
  }'
```

### Example: Sending a Message

```bash
curl -X POST "http://localhost:8000/conversations/{conversation_id}/messages" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Hello, I would like to order a coffee please"
  }'
```

## Configuration

### Text-Only vs Audio Mode

The application can run in two modes:

- **Text Mode** (default): Pure text conversations without audio processing
- **Audio Mode**: Full voice interaction with speech-to-text and text-to-speech

Set `TEXT_ONLY_MODE=true` in your `.env` file to disable audio features.

### Available Agents

The system includes pre-configured agents for different scenarios:
- TAXI - Practice taking a taxi
- BARISTA - Order at a coffee shop
- COLLEGE - Campus conversations
- FAMILY - Family gatherings
- VENDOR - Street market interactions
- FIESTA - Party conversations
- CAFE - Casual cafe chats
- DINNER - Restaurant dining
- WAITER - Formal dining service
- BEER - Bar conversations
- BAKERY - Bakery purchases
- TEA - Tea house visits
- OFFICE - Workplace interactions
- SAMBA - Dance event conversations
- BEACH - Beach activities

## Project Structure

```
AtlasTalk/
├── backend/
│   ├── main.py                 # FastAPI application entry point
│   ├── models/                 # Data models
│   │   ├── agent.py
│   │   └── conversation_models.py
│   ├── routes/                 # API endpoints
│   │   ├── agents.py
│   │   ├── audio_routes.py
│   │   ├── conversation_routes.py
│   │   └── voice_roleplay.py
│   └── services/               # Business logic
│       ├── conversation.py
│       ├── db.py
│       └── voice_roleplay.py
├── frontend/
│   ├── app/                    # Next.js pages
│   ├── components/             # React components
│   ├── hooks/                  # Custom React hooks
│   └── styles/                 # Global styles
├── temporaryFrontend/
│   └── voice-roleplay.html     # Standalone HTML interface
├── requirements.txt            # Python dependencies
└── README.md                   # This file
```

## Development

### Running Tests

```bash
# Backend tests (if available)
cd backend
pytest

# Frontend tests
cd frontend
npm test
```

### Linting

```bash
# Frontend linting
cd frontend
npm run lint
```

### Building for Production

```bash
# Frontend build
cd frontend
npm run build
npm start
```

## Troubleshooting

### Common Issues

**Issue**: Audio features not working
- **Solution**: Verify `ELEVENLABS_API_KEY` is set correctly in `.env` file
- **Solution**: Check that `TEXT_ONLY_MODE` is set to `false`

**Issue**: CORS errors in browser
- **Solution**: Ensure backend is running and accessible
- **Solution**: Check that frontend is making requests to correct backend URL

**Issue**: Database connection errors
- **Solution**: Verify MongoDB is running
- **Solution**: Check `MONGODB_URI` in `.env` file

**Issue**: API key errors
- **Solution**: Ensure all required API keys are set in `.env`
- **Solution**: Verify API keys are valid and have sufficient credits

## Contributing

We welcome contributions to AtlasTalk! To contribute:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

Please ensure your code follows the existing style and includes appropriate tests.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Built for NewHacks 2025 hackathon
- Powered by Google Gemini AI
- Voice capabilities by ElevenLabs
- UI components from Radix UI

## Contact

For questions or support, please open an issue in the GitHub repository.

---

Made with care for NewHacks 2025
