# Music Theory Learning App

**Diploma project** — Web application for interactive learning of music theory with note recognition in audio recordings using the open-source Transkun neural network.

## Project Structure

```
diploma-app/
├── frontend/       React + Vite SPA
├── backend/        Node.js + Express REST API
├── ml-service/     Python service for Transkun integration
└── package.json    Monorepo workspace root
```

## Parts

| Part | Stack | Purpose |
|------|-------|---------|
| `frontend` | React, Vite | User interface for music theory exercises and audio upload |
| `backend` | Node.js, Express | REST API, business logic, database access |
| `ml-service` | Python, Transkun | Audio-to-MIDI transcription via the Transkun neural network |

## Getting Started

See the `README.md` inside each sub-directory for setup instructions.
