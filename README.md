# Poetic Music Backend (Node.js)
A simple Express-based backend for the Poetic Music Generator app.

## Endpoints
- POST /generate — create lyrics + mock audio
- GET /history — view songs
- GET /song/:id — view one song
- GET /health — check server status

## Run locally
```
npm install
node index.js
```
Visit http://localhost:8080/health

## Deploy
Upload to GitHub → deploy to Render/Railway/Vercel.
Set `OPENAI_API_KEY` or `USE_MOCK=1`.
