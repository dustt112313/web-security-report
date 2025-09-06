# Web Security Report Application

A comprehensive security assessment web application with FastAPI backend and React frontend.

## Features

- Project management for security assessments
- Vulnerability tracking and reporting
- User authentication and authorization
- RESTful API with comprehensive documentation
- Modern React frontend with TypeScript

## Structure

```
web-security-report/
├── app/                 # Backend (FastAPI)
│   ├── api/            # API routes and schemas
│   ├── auth/           # Authentication system
│   ├── db/             # Database models and connection
│   └── utils/          # Utility functions
└── fe/                 # Frontend (React + TypeScript)
    └── src/            # Source code
```

## Getting Started

### Backend Setup

1. Install dependencies:
   ```bash
   cd app
   pip install -r requirements.txt
   ```

2. Configure environment variables:
   ```bash
   cp .env.example .env
   # Edit .env with your database credentials
   ```

3. Run the server:
   ```bash
   python app.py
   ```

### Frontend Setup

1. Install dependencies:
   ```bash
   cd fe
   npm install
   ```

2. Start development server:
   ```bash
   npm run dev
   ```

## API Documentation

Once the backend is running, visit `http://localhost:8000/docs` for interactive API documentation.

## License

MIT License