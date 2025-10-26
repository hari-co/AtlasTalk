# 🎭 AtlasTalk Voice Roleplay Feature

A conversational AI system for practicing real-world scenarios through voice or text interactions.

## ✨ Features

- **🎯 Scenario Generation**: Create custom roleplay scenarios using AI
- **🎤 Voice Mode**: Speech-to-Text and Text-to-Speech with ElevenLabs
- **💬 Text Mode**: Pure text-based conversations
- **📋 Goal Tracking**: Track conversation objectives and progress
- **🔄 Real-time Updates**: Dynamic goal completion tracking
- **🎨 Modern UI**: Beautiful, responsive interface

## 🚀 Quick Start

### 1. Install Dependencies
```bash
cd REALNEWHACKS25/AtlasTalk
pip install -r requirements.txt
```

### 2. Configure Environment
The `.env` file should contain:
```env
ELEVENLABS_API_KEY=your_elevenlabs_key
GEMINI_API_KEY=your_gemini_key
TEXT_ONLY_MODE=true  # Set to false for audio mode
```

### 3. Run the Backend
```bash
cd backend
python main.py
```

### 4. Open the Frontend
Open `temporaryFrontend/voice-roleplay.html` in your browser.

## 🎛️ Configuration

### Audio Mode Toggle
- **Text Mode** (default): Pure text conversations, no audio processing
- **Audio Mode**: Full voice interaction with STT/TTS

### Environment Variables
- `TEXT_ONLY_MODE`: Set to `true` for text-only, `false` for audio
- `ELEVENLABS_API_KEY`: Required for audio features
- `GEMINI_API_KEY`: Required for AI responses

## 📡 API Endpoints

### Voice Roleplay Routes (`/voice-roleplay/`)

- `GET /config` - Get current configuration
- `POST /scenario` - Create a new roleplay scenario
- `POST /update-goals` - Update goal completion status
- `POST /talk` - Process voice input (audio mode)
- `POST /chat` - Process text input (text mode)

### Example Usage

#### Create Scenario
```bash
curl -X POST "http://localhost:8000/voice-roleplay/scenario" \
  -H "Content-Type: application/json" \
  -d '{"scenario": "Ordering coffee"}'
```

#### Send Text Message
```bash
curl -X POST "http://localhost:8000/voice-roleplay/chat" \
  -H "Content-Type: application/json" \
  -d '{"text": "I would like a large coffee please"}'
```

## 🏗️ Architecture

```
backend/
├── main.py                    # FastAPI app with CORS
├── services/
│   └── voice_roleplay.py     # Core voice roleplay logic
└── routes/
    └── voice_roleplay.py     # API endpoints

temporaryFrontend/
└── voice-roleplay.html       # Modern web interface
```

## 🎯 How It Works

1. **Scenario Creation**: User enters a scenario (e.g., "Job interview")
2. **AI Generation**: Gemini creates a realistic roleplay scenario with goals
3. **Practice Mode**: User interacts via voice or text
4. **Goal Tracking**: AI tracks conversation progress and updates goals
5. **Real-time Feedback**: Goals update as user completes objectives

## 🔧 Customization

### Adding New Scenarios
The system automatically generates scenarios based on user input. Examples:
- "Ordering food at a restaurant"
- "Job interview with a tech company"
- "Asking for directions in a foreign city"
- "Returning a product to a store"

### Modifying AI Behavior
Edit the prompts in `backend/services/voice_roleplay.py` to change:
- Scenario generation style
- Goal tracking logic
- AI character responses

## 🐛 Troubleshooting

### Common Issues

1. **Audio not working**: Check `TEXT_ONLY_MODE` setting and ElevenLabs API key
2. **CORS errors**: Ensure backend is running and CORS is enabled
3. **API key errors**: Verify `.env` file has correct API keys

### Debug Mode
Check the browser console and backend logs for detailed error messages.

## 📝 License

This feature is part of the AtlasTalk project. See main project license for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

---

**Note**: This is a temporary frontend implementation. The final AtlasTalk frontend will integrate this feature into the main application.
