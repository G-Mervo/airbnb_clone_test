# Airbnb Clone - Full Stack Application

![Scope](https://img.shields.io/badge/scope-outpost-2e5090)
![Purpose](https://img.shields.io/badge/purpose-replicas-3a7f3f)
![Artifact](https://img.shields.io/badge/artifact-template-d4663f)
![Descriptor](https://img.shields.io/badge/descriptor-app-f7c04a)

## Overview

A full-stack Airbnb clone built with React (Frontend), FastAPI (Backend), and deployed on Vercel. Features include property listings, user authentication, booking system, and responsive design.

## 🚀 Live Demo

- **Frontend**: https://airbnb-frontend-omega.vercel.app
- **Backend API**: https://airbnb-backend-one.vercel.app
- **API Docs**: https://airbnb-backend-one.vercel.app/docs

## 🛠 Tech Stack

- **Frontend**: React, TypeScript, Tailwind CSS, Vite
- **Backend**: FastAPI, Python, Pydantic
- **Deployment**: Vercel
- **Build Tool**: Nx (Monorepo)

## 📦 Quick Start

```bash
# Setup
pnpm bootstrap

# Start dev server (both frontend and backend)
pnpm dev
```

## 🚀 Deployment Guide

### Prerequisites

1. Install Vercel CLI:

```bash
npm install -g vercel
```

2. Login to Vercel:

```bash
vercel login
```

### Step 1: Deploy Backend API

```bash
# Navigate to backend directory
cd apps/backend

# Deploy to production
vercel --prod
```

**Note**: The backend is configured with CORS to allow requests from the frontend domain.

### Step 2: Update Frontend Environment

Update the frontend environment file with your backend URL:

```bash
# Edit apps/frontend/.env.production
VITE_API_BASE_URL=https://your-backend-url.vercel.app
VITE_DATA_SOURCE=api
```

### Step 3: Deploy Frontend

```bash
# Navigate to frontend directory
cd apps/frontend

# Build the application
npm run build

# Deploy to production
vercel --prod
```

### Step 4: Verify Deployment

1. **Test Backend Health**:

```bash
curl https://your-backend-url.vercel.app/health
```

2. **Test CORS Configuration**:

```bash
curl -H "Origin: https://your-frontend-url.vercel.app" \
     -H "Access-Control-Request-Method: GET" \
     -X OPTIONS \
     https://your-backend-url.vercel.app/health
```

3. **Test API Endpoint**:

```bash
curl https://your-backend-url.vercel.app/api/rooms
```

4. **Visit Frontend**: Open your frontend URL in browser

## 🔧 Configuration

### Environment Variables

#### Frontend (.env.production)

```bash
VITE_API_BASE_URL=https://your-backend-url.vercel.app
VITE_API_TIMEOUT=15000
VITE_DATA_SOURCE=api
VITE_ENABLE_BOOKING=true
VITE_ENABLE_PAYMENTS=true
```

#### Backend

CORS origins are configured in `main.py` to include:

- Production frontend URL
- Local development URLs (localhost:3000, localhost:5173)

### CORS Configuration

The backend is configured to allow cross-origin requests from:

- `https://airbnb-frontend-omega.vercel.app` (production)
- `http://localhost:3000` and `http://localhost:5173` (development)

## 📁 Project Structure

```
├── apps/
│   ├── frontend/          # React application
│   │   ├── src/
│   │   ├── public/
│   │   ├── .env.production
│   │   └── vercel.json
│   └── backend/           # FastAPI application
│       ├── src/
│       ├── main.py        # Entry point
│       ├── requirements.txt
│       └── vercel.json
├── libs/                  # Shared libraries
├── package.json          # Root package.json
└── README.md
```

## 🐛 Troubleshooting

### Common Issues

1. **CORS Errors**:

   - Ensure frontend URL is added to backend CORS origins
   - Check browser developer tools for specific CORS errors

2. **API Connection Failed**:

   - Verify backend is deployed and healthy: `/health` endpoint
   - Check frontend environment variables
   - Ensure API base URL is correct

3. **Build Failures**:
   - Check dependencies in `requirements.txt` (backend) or `package.json` (frontend)
   - Verify all imports are correct

### Debug Commands

```bash
# Check backend health
curl https://your-backend-url.vercel.app/health

# Test CORS
curl -H "Origin: https://your-frontend-url.vercel.app" \
     -X OPTIONS \
     https://your-backend-url.vercel.app/health

# Check deployment logs
vercel logs [deployment-url]
```

## 🔄 Continuous Deployment

Both applications are set up for automatic deployment:

- Push to `main` branch triggers deployment
- Vercel automatically builds and deploys changes
- Environment variables are managed through Vercel dashboard

## 📱 Features

- 🏠 Property listings with detailed views
- 🔍 Search and filtering
- 👤 User authentication
- ❤️ Wishlist functionality
- 📱 Responsive design
- 🌐 Cross-origin API integration

## 📄 API Documentation

Visit the interactive API documentation at:

- **Swagger UI**: https://airbnb-backend-one.vercel.app/docs
- **ReDoc**: https://airbnb-backend-one.vercel.app/redoc

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make changes and test locally
4. Deploy to your own Vercel instance for testing
5. Submit a pull request

## 📝 License

This project is open source and available under the [MIT License](LICENSE).
