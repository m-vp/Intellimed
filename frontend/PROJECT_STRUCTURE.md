# IntelliMed — Project Structure & Architecture

## Full Stack Hierarchy

```
intellimed/
├── frontend/                    ← Next.js 14 App Router
│   ├── app/
│   │   ├── layout.tsx           ← Root layout, fonts, metadata
│   │   ├── globals.css          ← Design system, CSS variables
│   │   ├── page.tsx             ← Homepage / Landing
│   │   ├── alzheimer/
│   │   │   └── page.tsx         ← Alzheimer Classification Module
│   │   ├── brain-tumor/
│   │   │   └── page.tsx         ← Brain Tumor Detection Module
│   │   └── rag/
│   │       └── page.tsx         ← RAG Report Intelligence Module
│   ├── components/
│   │   ├── Navbar.tsx           ← Sticky nav, active route highlighting
│   │   └── UploadZone.tsx       ← Drag & drop file upload (reusable)
│   ├── public/                  ← Static assets
│   ├── next.config.js
│   ├── tailwind.config.ts
│   └── package.json
│
├── backend/                     ← Flask REST API
│   ├── app/
│   │   ├── __init__.py          ← Flask app factory
│   │   ├── config.py            ← ENV vars, paths, model configs
│   │   ├── routes/
│   │   │   ├── alzheimer.py     ← POST /api/alzheimer/predict
│   │   │   ├── brain_tumor.py   ← POST /api/brain-tumor/predict
│   │   │   └── rag.py           ← POST /api/rag/upload, /api/rag/query
│   │   ├── models/
│   │   │   ├── alzheimer_model.py    ← ResNet-50 inference wrapper
│   │   │   ├── tumor_model.py        ← EfficientNet-B4 inference wrapper
│   │   │   └── rag_pipeline.py       ← LangChain RAG pipeline
│   │   ├── utils/
│   │   │   ├── image_processor.py    ← Preprocessing, normalization
│   │   │   ├── pdf_parser.py         ← PDF/image text extraction (PyMuPDF)
│   │   │   └── response_formatter.py ← Standardize API responses
│   │   └── middleware/
│   │       ├── auth.py          ← JWT validation (production)
│   │       └── rate_limit.py    ← Rate limiting (Flask-Limiter)
│   ├── model_weights/           ← .pth / .h5 files (git-ignored)
│   │   ├── alzheimer_resnet50.pth
│   │   └── brain_tumor_efficientnet.pth
│   ├── requirements.txt
│   ├── wsgi.py                  ← Production WSGI entry point
│   └── Dockerfile
│
├── database/                    ← PostgreSQL schema
│   ├── migrations/
│   │   └── 001_initial.sql      ← Users, predictions, reports tables
│   └── schema.prisma            ← (optional) Prisma ORM schema
│
├── infrastructure/
│   ├── docker-compose.yml       ← Local dev: frontend + backend + postgres
│   ├── nginx.conf               ← Reverse proxy config
│   └── .env.example             ← All required environment variables
│
└── README.md
```

## API Contract

### Alzheimer Detection
```
POST /api/alzheimer/predict
Content-Type: multipart/form-data
Body: { image: File }

Response:
{
  "prediction": "Moderate Demented",
  "confidence": 91.4,
  "stage": 3,
  "breakdown": [
    { "label": "Non Demented", "score": 2.1 },
    { "label": "Very Mild Demented", "score": 4.3 },
    { "label": "Mild Demented", "score": 2.2 },
    { "label": "Moderate Demented", "score": 91.4 }
  ],
  "recommendation": "...",
  "model_version": "resnet50-v2.1"
}
```

### Brain Tumor Detection
```
POST /api/brain-tumor/predict
Content-Type: multipart/form-data
Body: { image: File }

Response:
{
  "detected": true,
  "tumorType": "Glioma",
  "confidence": 88.7,
  "grade": "Grade III",
  "malignant": true,
  "location": "Left temporal lobe",
  "breakdown": [...],
  "findings": [...],
  "recommendation": "..."
}
```

### RAG Pipeline
```
POST /api/rag/upload
Content-Type: multipart/form-data
Body: { file: File }
Response: { "session_id": "uuid", "pages_indexed": 5 }

POST /api/rag/query
Content-Type: application/json
Body: { "session_id": "uuid", "query": "What does my diagnosis mean?" }
Response: { "answer": "...", "sources": [...], "confidence": 0.87 }
```

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 (App Router), TypeScript, Tailwind CSS, Framer Motion |
| Backend | Flask, Python 3.11 |
| ML Inference | PyTorch, torchvision, OpenCV |
| RAG Pipeline | LangChain, ChromaDB / FAISS, OpenAI / local LLM |
| PDF Parsing | PyMuPDF (fitz), pytesseract for OCR |
| Database | PostgreSQL (predictions log, user sessions) |
| Cache | Redis (session store, rate limiting) |
| Deployment | Docker, Nginx, Gunicorn |
| Auth | JWT + refresh tokens |
| File Storage | AWS S3 / MinIO (self-hosted) |

## Environment Variables Required

```env
# Backend
FLASK_ENV=production
SECRET_KEY=...
DATABASE_URL=postgresql://user:pass@localhost:5432/intellimed
REDIS_URL=redis://localhost:6379
OPENAI_API_KEY=...           # For RAG LLM
MODEL_DIR=/app/model_weights
MAX_UPLOAD_MB=50
ALLOWED_ORIGINS=https://yourdomain.com

# Frontend
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
```

## Next Steps to Wire Up Backend

1. Replace dummy responses in each page with real `fetch()` calls (commented code already in place)
2. Implement Flask routes using the API contract above
3. Load your trained PyTorch models in `models/` wrappers
4. Set up LangChain RAG pipeline with your chosen vector store
5. Configure CORS in Flask for your frontend domain
6. Set environment variables and deploy with Docker Compose
