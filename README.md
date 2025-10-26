# AtlasTalk

An immersive language learning platform that combines interactive world exploration with AI-powered conversational practice.

## Overview

AtlasTalk transforms language learning into an engaging journey across the globe. Users select a country on an interactive world map and dive into realistic conversational scenarios with AI agents that simulate real-world interactions like ordering at restaurants, taking taxis, and exploring cultural landmarks.

## Features

### Interactive World Map
- Beautiful, animated map interface with smooth country selection
- Hover effects displaying destination cards with country information
- Click sound effects for tactile feedback
- Elegant fade-in animations and gooey text morphing

### Immersive Language Practice
- Real-world scenario-based conversations (culture, language, education, economy, daily life)
- AI-powered conversational agents that adapt to your learning pace
- Voice recording and playback with speech-to-text transcription
- Text-to-speech responses for authentic pronunciation practice

### Smart Learning Goals
- Dynamic goal tracking that adapts based on conversation progress
- Real-time completion status updates
- Conversational flow that naturally ends when learning objectives are met

### Supported Countries & Languages
- United States (English)
- China (Mandarin)
- Spain (Spanish)
- France (French)
- Germany (German)
- Japan (Japanese)
- India (Hindi)
- Brazil (Portuguese)

## Technology Stack

### Frontend
- Next.js 16.0.0 with Turbopack
- React 19.2.0
- TypeScript
- Tailwind CSS
- Framer Motion for animations
- D3.js and TopoJSON for geographic visualization
- Web Audio API for sound effects

### Backend
- FastAPI (Python)
- MongoDB for data persistence
- OpenAI/Gemini API for conversational AI
- ElevenLabs API for text-to-speech
- DigitalOcean Agent API integration

## Getting Started

### Prerequisites
- Node.js 18+ and npm/pnpm
- Python 3.12+
- MongoDB Atlas account or local MongoDB instance

### Installation

1. Clone the repository
```bash
git clone https://github.com/hari-co/AtlasTalk.git
cd AtlasTalk
```

2. Install frontend dependencies
```bash
cd frontend
npm install --legacy-peer-deps
```

3. Install backend dependencies
```bash
cd ../backend
pip install -r requirements.txt
```

4. Set up environment variables

Create a `.env` file in the `backend` directory:
```
MONGODB_URI=your_mongodb_connection_string
MONGODB_DB=atlastalk
TAXI_PRIVATE_KEY=your_digitalocean_agent_key
ELEVENLABS_API_KEY=your_elevenlabs_api_key
GEMINI_API_KEY=your_gemini_api_key
```

### Running the Application

1. Start the backend server
```bash
cd backend
python -m backend.main
```
The API will be available at `http://localhost:8000`

2. Start the frontend development server
```bash
cd frontend
npm run dev
```
The application will be available at `http://localhost:3000`

## Project Structure

```
AtlasTalk/
├── frontend/
│   ├── app/
│   │   ├── chat/[slug]/        # Chat interface pages
│   │   ├── country/[slug]/     # Country detail pages
│   │   ├── layout.tsx
│   │   └── page.tsx            # Home page with interactive map
│   ├── components/
│   │   ├── interactive-map.tsx # Main map component
│   │   └── ui/                 # Reusable UI components
│   ├── context/                # React context providers
│   ├── lib/                    # Utilities and data
│   └── public/                 # Static assets
├── backend/
│   ├── models/                 # Data models
│   ├── routes/                 # API endpoints
│   ├── services/               # Business logic
│   └── main.py                 # FastAPI application
└── README.md
```

## API Endpoints

### Agents
- `POST /agents/{agent_name}/setup` - Initialize a conversational agent
- `GET /agents` - List available agents

### Conversations
- `POST /conversations/{conversation_id}/messages` - Send a message
- `POST /conversations/{conversation_id}/end` - End a conversation
- `GET /conversations/{conversation_id}` - Get conversation history

### Audio
- `POST /audio/transcribe` - Transcribe audio to text
- `POST /audio/tts` - Convert text to speech

## How DigitalOcean is Used

AtlasTalk leverages DigitalOcean's Agent API to power intelligent conversational experiences. The integration enables:

- **Context-Aware Conversations**: DigitalOcean agents maintain conversation history and context, allowing for natural, flowing dialogues that remember previous interactions
- **Scenario-Based Learning**: Each learning scenario (taxi rides, restaurant orders, cultural discussions) is powered by specialized DigitalOcean agents configured with country-specific knowledge and cultural awareness
- **Adaptive Responses**: The agents dynamically adjust conversation difficulty and provide culturally appropriate responses based on the selected country and language
- **Real-Time Agent Setup**: When a user selects a country and scenario, the backend creates a dedicated DigitalOcean agent instance with customized prompts and parameters
- **Conversation Management**: The platform uses DigitalOcean's API to manage conversation lifecycle, from initialization to natural conclusion based on learning goal completion

The DigitalOcean Agent API serves as the conversational backbone, ensuring learners receive realistic, contextually appropriate language practice that mimics real-world interactions.

## How ElevenLabs is Used

ElevenLabs provides the voice technology that brings conversations to life:

- **Natural Text-to-Speech**: All AI agent responses are converted to speech using ElevenLabs' advanced TTS engine, providing authentic pronunciation and natural-sounding voices
- **Multi-Language Support**: ElevenLabs generates speech in multiple languages (English, Mandarin, Spanish, French, German, Japanese, Hindi, Portuguese) with native-like accents
- **Realistic Voice Quality**: High-quality voice synthesis helps learners develop proper listening comprehension and familiarize themselves with natural speech patterns
- **Audio Playback Integration**: Synthesized audio is seamlessly delivered to the frontend and played back during conversations, creating an immersive learning experience
- **Voice Variation**: Different scenarios can utilize different voice profiles to simulate various speakers and social contexts

The ElevenLabs integration transforms text-based AI responses into spoken language, enabling learners to practice both listening comprehension and conversational flow in their target language.

## Design Philosophy

AtlasTalk embraces a minimalist, Apple-inspired design aesthetic with:
- Generous whitespace and breathing room
- Smooth animations and transitions
- Dark mode-first color palette
- Intuitive user interactions
- Focus on content over chrome

## Contributing

This project was built for a hackathon. Contributions, issues, and feature requests are welcome.

## License

See LICENSE file for details.
