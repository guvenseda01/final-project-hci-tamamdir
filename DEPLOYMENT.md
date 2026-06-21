# Tamamdır - Deployment Guide

Complete step-by-step instructions to deploy the Tamamdır platform locally and to production.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Local Development Setup](#local-development-setup)
3. [Docker Compose Setup (Recommended)](#docker-compose-setup-recommended)
4. [Production Deployment](#production-deployment)
5. [Environment Variables](#environment-variables)
6. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Software

- **Node.js** v20+ ([Download](https://nodejs.org/))
- **npm** v10+ (comes with Node.js)
- **Git** ([Download](https://git-scm.com/))
- **Docker & Docker Compose** (for containerized deployment) - [Download](https://www.docker.com/products/docker-desktop)
- **PostgreSQL** v14+ (local dev) OR use Docker

### Recommended

- **VS Code** or similar code editor
- **Postman** or **Thunder Client** for API testing
- **curl** or similar CLI tool for testing

---

## Local Development Setup

### Step 1: Clone the Repository

```bash
git clone https://github.com/guvenseda01/final-project-HCI.git
cd final-project-HCI
```

### Step 2: Backend Setup

```bash
cd tamamdir-backend

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Edit .env with your values (see Environment Variables section)
nano .env  # or use your editor
```

### Step 3: Frontend Setup

```bash
cd ../tamamdir-web-app

# Install dependencies
npm install

# Environment is already configured (uses backend proxy)
# No .env needed - frontend talks to backend via http://localhost:4000
```

### Step 4: Database Setup (Local PostgreSQL)

```bash
# Create database
createdb tamamdir

# Or use Docker for PostgreSQL:
docker run -d \
  --name tamamdir-postgres \
  -e POSTGRES_DB=tamamdir \
  -e POSTGRES_USER=tamamdir \
  -e POSTGRES_PASSWORD=tamamdir_dev_password \
  -p 5432:5432 \
  postgres:16-alpine
```

### Step 5: Run Backend

```bash
cd tamamdir-backend

# Start development server (will initialize database schema)
npm start
# Server runs on http://localhost:4000
```

### Step 6: Run Frontend (In New Terminal)

```bash
cd tamamdir-web-app

# Start Vite dev server
npm run dev
# App runs on http://localhost:5173
```

### Step 7: Verify Everything

- **Frontend**: http://localhost:5173
- **Backend Health**: http://localhost:4000/health
- **API Docs**: http://localhost:4000/api/docs (Swagger UI)

---

## Docker Compose Setup (Recommended)

### Step 1: Install Docker & Docker Compose

- **Mac/Windows**: [Docker Desktop](https://www.docker.com/products/docker-desktop)
- **Linux**: Install Docker and Docker Compose separately

### Step 2: Clone Repository

```bash
git clone https://github.com/guvenseda01/final-project-HCI.git
cd final-project-HCI
```

### Step 3: Configure Environment

```bash
cd tamamdir-backend

# Copy and edit environment file
cp .env.example .env
nano .env
```

Edit `.env` with:
```bash
NODE_ENV=development
PORT=4000
JWT_SECRET=your-secret-key-change-in-production
CLIENT_URL=http://localhost:5173
FRONTEND_URL=http://localhost:5173
DATABASE_URL=postgresql://tamamdir:tamamdir_dev_password@db:5432/tamamdir
RESEND_API_KEY=your-resend-api-key
RESEND_FROM_EMAIL=noreply@yourdomain.com
EMAIL_VERIFICATION_SECRET=your-email-secret
```

### Step 4: Start Docker Compose

```bash
# From project root
docker-compose up -d --build

# This starts:
# - PostgreSQL database (port 5432)
# - Backend server (port 4000)
```

### Step 5: Verify Containers

```bash
# Check container status
docker-compose ps

# Expected output:
# NAME                        STATUS
# final-project-hci-backend-1   Up (healthy)
# final-project-hci-db-1        Up (healthy)

# View backend logs
docker-compose logs -f backend
```

### Step 6: Run Frontend

Frontend runs locally (not in Docker yet):

```bash
cd tamamdir-web-app
npm install
npm run dev
# Access at http://localhost:5173
```

### Step 7: Test the Setup

```bash
# Health check
curl http://localhost:4000/health

# API Documentation
open http://localhost:4000/api/docs

# Frontend
open http://localhost:5173
```

### Useful Docker Commands

```bash
# Stop all containers
docker-compose down

# Stop and remove volumes (WARNING: deletes database)
docker-compose down -v

# View logs
docker-compose logs -f backend
docker-compose logs -f db

# Restart containers
docker-compose restart

# Rebuild images
docker-compose up -d --build
```

---

## Production Deployment

### Option 1: Vercel (Recommended for Full-Stack)

#### Backend Deployment

1. **Push code to GitHub**
   ```bash
   git push origin main
   ```

2. **Deploy backend to Vercel**
   ```bash
   npm i -g vercel
   vercel --prod
   ```

3. **Configure Environment Variables in Vercel**
   - Go to Vercel Dashboard → Project Settings → Environment Variables
   - Add all from your `.env` file:
     - `JWT_SECRET`
     - `DATABASE_URL` (use production PostgreSQL)
     - `RESEND_API_KEY`
     - `RESEND_FROM_EMAIL`
     - `EMAIL_VERIFICATION_SECRET`
     - etc.

#### Frontend Deployment

1. **Build frontend**
   ```bash
   cd tamamdir-web-app
   npm run build
   ```

2. **Deploy to Vercel**
   ```bash
   vercel --prod
   ```

3. **Update API URL** if needed in `.env`

### Option 2: Railway.app (Easiest Database + Backend)

1. **Deploy Backend + Database**
   - Go to [Railway.app](https://railway.app)
   - Sign in with GitHub
   - Create new project
   - Add PostgreSQL database
   - Connect GitHub repo (select `tamamdir-backend`)
   - Add environment variables
   - Deploy

2. **Deploy Frontend to Vercel**
   - Same as Vercel option above
   - Update `VITE_API_URL` to Railway backend URL

### Option 3: Docker to Cloud (Render, Fly.io, etc.)

```bash
# Build Docker image
docker build -t tamamdir-backend:latest tamamdir-backend

# Tag for registry (e.g., Docker Hub)
docker tag tamamdir-backend:latest username/tamamdir-backend:latest

# Push to registry
docker push username/tamamdir-backend:latest

# Deploy to cloud platform (Render/Fly.io/etc.)
# Follow their Docker deployment docs
```

### Option 4: Heroku Alternative (Buildpack Deployment)

```bash
# Install Heroku CLI
npm i -g heroku

# Login
heroku login

# Create app
heroku create tamamdir-backend

# Add PostgreSQL add-on
heroku addons:create heroku-postgresql:standard-0 -a tamamdir-backend

# Set environment variables
heroku config:set JWT_SECRET=your-secret -a tamamdir-backend
heroku config:set RESEND_API_KEY=your-key -a tamamdir-backend
# ... add all others

# Deploy
git push heroku main

# View logs
heroku logs --tail -a tamamdir-backend
```

---

## Environment Variables

### Backend (.env)

```bash
# Server
NODE_ENV=production
PORT=4000
JWT_SECRET=<generate: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))">

# Client/CORS
CLIENT_URL=https://yourdomain.com
FRONTEND_URL=https://yourdomain.com

# Database (Docker Compose or production PostgreSQL)
DATABASE_URL=postgresql://user:password@host:5432/dbname

# Email (Resend)
EMAIL_PROVIDER=resend
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxx
RESEND_FROM_EMAIL=Tamamdır <noreply@yourdomain.com>

# Email Verification
EMAIL_VERIFICATION_SECRET=<generate: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))">
```

### Frontend (.env.local - optional)

```bash
# Leave empty to use backend proxy (recommended for dev)
VITE_API_URL=http://localhost:4000

# Or set to production backend
VITE_API_URL=https://api.yourdomain.com
```

---

## Database Migrations

### Initial Setup (Auto on First Run)

The backend automatically creates the database schema on first run:
- Tables: users, services, orders, messages, reviews, categories, etc.
- Indexes created for performance
- Relationships and constraints established

### Reset Database (Development)

```bash
# Using Docker Compose
docker-compose down -v
docker-compose up -d --build

# Using PostgreSQL directly
dropdb tamamdir
createdb tamamdir
# Then restart backend
```

---

## SSL/HTTPS Certificate

### For Production

```bash
# Using Let's Encrypt (free)
# Via Vercel: Automatic
# Via Railway: Automatic
# Via Docker/Self-hosted: Use Nginx + Certbot

# Example with Nginx reverse proxy
sudo apt-get install certbot python3-certbot-nginx
sudo certbot certonly --nginx -d yourdomain.com
```

---

## Monitoring & Logs

### Docker Compose

```bash
# View real-time logs
docker-compose logs -f backend
docker-compose logs -f db

# View last N lines
docker-compose logs --tail 50 backend
```

### Production (Vercel)

- Logs available in Vercel Dashboard
- Set up monitoring with Sentry or similar

### Health Check

```bash
# Backend health
curl https://yourdomain.com/health

# Expected response
{
  "status": "ok",
  "service": "Tamamdır API",
  "timestamp": "2026-06-21T..."
}
```

---

## Troubleshooting

### Backend Won't Start

```bash
# Check logs
docker-compose logs backend

# Common issues:
# 1. Port already in use: Change PORT in .env
# 2. Database connection failed: Ensure DATABASE_URL is correct
# 3. Missing env vars: Copy .env.example and fill in values
```

### Frontend Can't Connect to Backend

```bash
# Check CORS is enabled
curl -i -X OPTIONS http://localhost:4000/api/auth/register \
  -H "Origin: http://localhost:5173" \
  -H "Access-Control-Request-Method: POST"

# Should see Access-Control-Allow-Origin header
```

### Database Permission Denied

```bash
# Reset database user
docker-compose down -v
docker-compose up -d db
# Wait for container to start
docker-compose up -d backend
```

### Container Unhealthy

```bash
# Check health status
docker inspect --format='{{json .State.Health}}' final-project-hci-backend-1 | jq

# Restart container
docker-compose restart backend

# Check logs
docker-compose logs backend
```

### Email Not Sending

1. Verify `RESEND_API_KEY` is valid at https://resend.com
2. Check `RESEND_FROM_EMAIL` is verified in Resend
3. View logs for error details
4. Test endpoint manually via Swagger

---

## Performance Tips

### Backend

- Use connection pooling for database
- Enable caching for static assets
- Monitor query performance
- Use indexes on frequently queried columns

### Frontend

- Build for production: `npm run build`
- Enable gzip compression
- Minify assets
- Lazy load routes

### Database

- Regular backups
- Monitor slow queries
- Index foreign keys
- Optimize schema

---

## Security Checklist

- [ ] Change `JWT_SECRET` in production
- [ ] Use HTTPS only
- [ ] Enable CORS only for trusted origins
- [ ] Never commit `.env` to Git
- [ ] Use strong database passwords
- [ ] Enable email verification for new accounts
- [ ] Rate limit login attempts
- [ ] Keep dependencies updated

---

## Support

For issues or questions:

1. Check logs: `docker-compose logs backend`
2. Review API docs: `http://localhost:4000/api/docs`
3. Check GitHub issues
4. Create detailed issue with:
   - Error message
   - Steps to reproduce
   - Environment info (OS, Node version, etc.)

---

**Last Updated**: 2026-06-21  
**Version**: 1.0.0
