# PDF RAG Application

A Next.js application for chatting with PDF documents and websites using AI-powered retrieval-augmented generation.

## Features

- **PDF Upload & Chat**: Upload PDF documents and chat with them using AI
- **Website Crawling**: Crawl entire websites and extract content for AI conversations
- **AI-Powered Chat**: Intelligent conversations with Google's Gemini AI
- **Vector Search**: Advanced vector search powered by Qdrant
- **Document Management**: Upload and manage PDF documents using UploadThing
- **Real-time Processing**: Background processing with BullMQ
- **Authentication**: Secure authentication with Better Auth
- **Cloud Storage**: UploadThing integration for file storage

## Prerequisites

Before running this application, you need the following cloud services:

- **PostgreSQL Database**: For storing user data, collections, and chat history
- **Redis**: For BullMQ queue management
- **Qdrant Vector Database**: For storing document embeddings
- **Google AI**: For AI chat functionality
- **UploadThing account**: For file storage

## Environment Variables

Create a `.env.local` file in the `frontend` directory with the following variables:

```env
# Database
DATABASE_URL="postgresql://username:password@host:port/database"

# Authentication
NEXTAUTH_URL="https://your-domain.com"
NEXTAUTH_SECRET="your-nextauth-secret"
GITHUB_CLIENT_ID="your-github-client-id"
GITHUB_CLIENT_SECRET="your-github-client-secret"

# Redis
REDIS_HOST="your-redis-host"
REDIS_PORT="6379"
REDIS_PASSWORD="your-redis-password"
REDIS_TLS="true"

# Qdrant
QDRANT_URL="https://your-qdrant-host:6333"

# Google AI
GOOGLE_AI_API_KEY="your-google-ai-api-key"

# UploadThing v7
UPLOADTHING_SECRET="sk_live_..."
UPLOADTHING_APP_ID="your-app-id"
```

### UploadThing v7 Setup

1. **Get your UploadThing credentials**:
   - Go to [uploadthing.com](https://uploadthing.com)
   - Create an account and get your API keys
   - You'll need both `UPLOADTHING_SECRET` (starts with `sk_`) and `UPLOADTHING_APP_ID`

2. **Environment variables**:
   - `UPLOADTHING_SECRET`: Your UploadThing secret key (starts with `sk_`)
   - `UPLOADTHING_APP_ID`: Your UploadThing app ID

## Setup Instructions

### 1. Install Dependencies

```bash
cd frontend
bun install
```

### 2. Set up Database

```bash
# Generate Prisma client
bun run db:generate

# Push schema to database
bun run db:push

# (Optional) Open Prisma Studio
bun run db:studio
```

### 3. Set up UploadThing

- Create an account at [uploadthing.com](https://uploadthing.com)
- Get your API keys from the dashboard
- Add `UPLOADTHING_SECRET` and `UPLOADTHING_APP_ID` to `.env.local`

### 4. Run the Application

```bash
# Development
bun run dev

# Production build
bun run build
bun run start
```

## API Routes

The application includes the following API routes:

- `/api/auth/*` - Authentication endpoints
- `/api/collections` - Document collection management
- `/api/upload` - File upload management
- `/api/upload/new` - New file uploads
- `/api/chat` - Chat functionality
- `/api/web-chat` - Web chat functionality
- `/api/web-loader` - Website crawling
- `/api/uploadthing` - UploadThing file upload endpoints
- `/api/apikey` - API key management

## Architecture

This is a unified Next.js application that combines:

- **Frontend**: React components with Next.js
- **Backend**: Next.js API routes
- **Database**: PostgreSQL with Prisma ORM
- **Vector Database**: Qdrant for embeddings
- **Queue System**: BullMQ with Redis
- **File Storage**: UploadThing for document storage
- **Authentication**: Better Auth for user management

## File Upload Flow

1. **Frontend**: User selects a PDF file using the UploadThing component
2. **UploadThing**: File is uploaded to UploadThing's servers
3. **API**: File metadata is saved to database and processing is queued
4. **Queue Worker**: Downloads file from UploadThing, processes it, and adds to vector database
5. **Database**: File information is stored with UploadThing URL

## Development Scripts

- `bun run dev` - Start development server
- `bun run build` - Build for production
- `bun run start` - Start production server
- `bun run setup` - Run setup script
- `bun run db:generate` - Generate Prisma client
- `bun run db:push` - Push database schema
- `bun run db:studio` - Open Prisma Studio

## Production Deployment

1. Set up all cloud services (PostgreSQL, Redis, Qdrant)
2. Configure environment variables for production
3. Set up proper domain and SSL certificates
4. Configure UploadThing for production
5. Deploy to your preferred platform (Vercel, Railway, etc.)

## Troubleshooting

### Common Issues

1. **UploadThing errors**: Ensure `UPLOADTHING_SECRET` starts with `sk_` and is valid
2. **Database connection**: Check `DATABASE_URL` and ensure database is accessible
3. **Redis connection**: Verify Redis host, port, and credentials
4. **Qdrant connection**: Ensure Qdrant is running and accessible
5. **API key issues**: Make sure Google AI API key is valid and has proper permissions

### UploadThing v7 Migration

If you're upgrading from v6 to v7:
1. Update packages: `bun add uploadthing@latest @uploadthing/react@latest`
2. Ensure environment variables are correctly set
3. The API structure remains the same, but configuration may differ

## Cloud Services Benefits

- **Scalability**: Cloud services can handle increased load
- **Reliability**: Managed services with high uptime
- **Security**: Professional security measures
- **Maintenance**: No need to manage infrastructure
- **Global Access**: Access from anywhere in the world
