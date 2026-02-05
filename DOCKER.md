# Docker Setup Guide for PulseBoard

This guide explains how to run PulseBoard using Docker and Docker Compose.

## Prerequisites

- Docker Desktop (Windows/Mac) or Docker Engine (Linux)
- Docker Compose (included with Docker Desktop)

## Quick Start

### 1. Environment Setup

Copy the example environment file:
```bash
cp .env.example .env
```

Edit `.env` and update the following critical values:
- `JWT_SECRET` - Set a strong, random secret key
- Database credentials (if changing defaults)

### 2. Build and Run

Start all services:
```bash
docker-compose up -d
```

This will start:
- **MongoDB** on port 27017
- **Backend API** on port 3000
- **Frontend** on port 80

### 3. Access the Application

- **Frontend**: http://localhost
- **Backend API**: http://localhost:3000
- **Health Check**: http://localhost:3000/health

## Docker Commands

### Start services
```bash
docker-compose up -d
```

### Stop services
```bash
docker-compose down
```

### View logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f mongodb
```

### Rebuild after code changes
```bash
# Rebuild specific service
docker-compose up -d --build backend

# Rebuild all services
docker-compose up -d --build
```

### Stop and remove volumes (⚠️ deletes database data)
```bash
docker-compose down -v
```

## Development vs Production

### Development Mode

For development with hot-reload, modify the backend service in `docker-compose.yml`:

```yaml
backend:
  command: npm run dev
  volumes:
    - ./backend/src:/app/src
```

### Production Mode

The default `docker-compose.yml` is configured for production with:
- Multi-stage builds for smaller images
- Non-root users for security
- Health checks for all services
- Persistent volumes for MongoDB

## Architecture

```
┌─────────────┐
│   Frontend  │ :80
│   (Nginx)   │
└──────┬──────┘
       │
       │ /api → proxy
       │
┌──────▼──────┐
│   Backend   │ :3000
│  (Node.js)  │
└──────┬──────┘
       │
       │ mongoose
       │
┌──────▼──────┐
│   MongoDB   │ :27017
│  (Database) │
└─────────────┘
```

## Individual Dockerfiles

### Backend Dockerfile
Located at `backend/Dockerfile`
- Base: Node 20 Alpine
- Multi-stage build (deps → builder → runner)
- TypeScript compilation
- Non-root user (expressjs)

### Frontend Dockerfile
Located at `frontend/Dockerfile`
- Base: Node 20 Alpine for build, Nginx Alpine for serving
- PNPM package manager
- Vite build optimization
- Nginx configured for SPA routing and API proxying

## Troubleshooting

### Backend can't connect to MongoDB
- Check MongoDB is healthy: `docker-compose ps`
- Verify connection string in `.env`
- Check logs: `docker-compose logs mongodb`

### Frontend shows connection errors
- Ensure backend is running: `docker-compose ps backend`
- Check backend logs: `docker-compose logs backend`
- Verify VITE_API_URL in environment

### Port already in use
```bash
# Change ports in docker-compose.yml
ports:
  - "8080:80"  # Frontend on 8080
  - "3001:3000"  # Backend on 3001
```

### Permission issues (Linux)
```bash
# Fix ownership
sudo chown -R $USER:$USER .
```

## Data Persistence

MongoDB data is stored in Docker volumes:
- `mongodb_data` - Database files
- `mongodb_config` - Configuration

To backup:
```bash
docker-compose exec mongodb mongodump --out /data/backup
docker cp pulseboard-mongodb:/data/backup ./backup
```

To restore:
```bash
docker cp ./backup pulseboard-mongodb:/data/backup
docker-compose exec mongodb mongorestore /data/backup
```

## Clean Slate

Remove everything (containers, volumes, images):
```bash
docker-compose down -v --rmi all
```

## Next Steps

- Configure environment variables for production
- Set up CI/CD pipeline for automated builds
- Consider using Docker secrets for sensitive data
- Set up monitoring and logging solutions
