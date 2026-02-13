# Backend Foundation

A production-ready Node.js backend foundation built with Express, TypeScript, and Prisma.

## Tech Stack

- **Node.js** 20+
- **Express** - Web framework
- **TypeScript** - Type-safe JavaScript
- **Prisma** - Modern ORM for PostgreSQL
- **PostgreSQL** - Database
- **dotenv** - Environment configuration

## Project Structure

```
backend/
├── src/
│   ├── app.ts              # Express app setup
│   ├── server.ts           # Server entry point
│   └── config/
│       ├── env.ts          # Environment configuration
│       └── prisma.ts       # Prisma client and connection
├── prisma/
│   └── schema.prisma       # Database schema
├── .env.example            # Environment variables template
├── package.json
├── tsconfig.json
└── README.md
```

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   ```bash
   cp .env.example .env
   ```
   Edit `.env` with your PostgreSQL connection string.

3. **Set up the database:**
   ```bash
   # Generate Prisma Client
   npm run prisma:generate

   # Run migrations
   npm run prisma:migrate
   ```

4. **Start development server:**
   ```bash
   npm run dev
   ```

## Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build TypeScript to JavaScript
- `npm start` - Start production server
- `npm run prisma:generate` - Generate Prisma Client
- `npm run prisma:migrate` - Run database migrations
- `npm run prisma:studio` - Open Prisma Studio

## API Endpoints

### Health Check
- `GET /health` - Returns `{ "status": "OK" }`

## Environment Variables

- `PORT` - Server port (default: 5000)
- `DATABASE_URL` - PostgreSQL connection string

## Development

The server runs on `http://localhost:5000` by default (or the port specified in `.env`).

## Production

1. Build the project:
   ```bash
   npm run build
   ```

2. Start the server:
   ```bash
   npm start
   ```
