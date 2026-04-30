# ML Service

Python microservice that wraps the [Transkun](https://github.com/wei-zeng98/piano-a2s) neural network to transcribe audio recordings into MIDI / note sequences.

## Stack

- **Python 3.10+**
- **FastAPI** — lightweight HTTP framework for the service endpoint
- **Uvicorn** — ASGI server
- **Transkun** — open-source piano transcription model
- **PyTorch / torchaudio** — deep learning runtime

## Folder Structure

```
ml-service/
├── models/         Downloaded or exported Transkun model weights
├── src/
│   └── main.py     (to be created) FastAPI app entry point
├── requirements.txt
└── README.md
```

## Setup

```bash
# Create and activate a virtual environment
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run the service
uvicorn src.main:app --reload --port 8000
```

The service listens at http://localhost:8000 by default.

## API (planned)

| Method | Path | Description |
|--------|------|-------------|
| POST | `/transcribe` | Upload an audio file, receive note events |
