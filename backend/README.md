# Backend

Node.js + Express REST API for the music theory learning platform.

## Stack

- **Node.js** — runtime
- **Express 4** — HTTP framework
- **cors** — cross-origin resource sharing
- **dotenv** — environment variable loading

## Folder Structure

```
backend/
├── src/
│   ├── controllers/    Request handlers (business logic entry points)
│   ├── middleware/     Express middleware (auth, error handling, etc.)
│   ├── routes/         Route definitions
│   ├── services/       Business logic and external service clients
│   └── index.js        (to be created) App entry point
├── package.json
└── .env.example        (to be created)
```

## Setup

```bash
npm install
npm run dev
```

The server starts at http://localhost:3000 by default.

## Environment Variables

Copy `.env.example` to `.env` and fill in the values before running.
