# AI Learning Assistant
Upload PDFs, generate flashcards and quizzes using Groq AI.

## Local Access
- **Frontend App:** [http://localhost:5173](http://localhost:5173)
- **Backend API:** [http://localhost:8000](http://localhost:8000)


## Tech Stack
- Backend: Node.js, Express
- Database: MongoDB
- Frontend: React

## Getting Started

### Backend
```bash
cd backend
cp .env.example .env
# Fill in MONGODB_URI, GROQ_API_KEY, JWT_SECRET, JWT_EXPIRE in .env
npm install

# Create the uploads directory before running the app
mkdir -p backend/uploads

npm run dev
```

### Frontend
```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

> **Note:** Uploaded PDF files are stored in `backend/uploads/`. This directory must exist before running the app. The command above creates it automatically. It is excluded from git via `.gitignore` — only the folder itself (via `.gitkeep`) is tracked.

## Environment Variables

### Backend
| Variable | Description | Example |
|---|---|---|
| PORT | Server port | 8000 |
| NODE_ENV | App environment | development |
| LOG_LEVEL | Logging level | info |
| CORS_ORIGINS | CORS allowed origins | http://localhost:5173 |
| MONGODB_URI | MongoDB connection string | mongodb://localhost:27017/ai-learning-assistant |
| JWT_SECRET | JWT signing secret (min 32 chars) | strong-random-string |
| JWT_EXPIRE | JWT token expiry | 7d |
| GROQ_API_KEY | Groq API key | gsk_... |

### Frontend
| Variable | Description | Example |
|---|---|---|
| VITE_API_URL | API Base URL | http://localhost:8000/api |

## API Endpoints
| Method | Route | Description | Auth |
|---|---|---|---|
| GET | /health | Health check | No |
| POST | /api/auth/register | Register | No |
| POST | /api/auth/login | Login | No |
| POST | /api/documents/upload | Upload PDF | Yes |
| POST | /api/ai/generate-flashcards | Generate flashcards | Yes |
| POST | /api/ai/generate-quiz | Generate quiz | Yes |
| GET | /api/dashboard | Dashboard stats | Yes |

## Running Tests
```bash
cd backend
npm test
```
