
# Python Microservice

FastAPI microservice for Multilat Analysis Tool.

## Setup

1. Install dependencies:
```bash
cd python-svc
pip install -r requirements.txt
```

2. Run the development server:
```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

## API Endpoints

### Core Endpoints (Phase 2)

- `GET /` - Health check
- `GET /figure/ternary/{sessionId}` - Returns Plotly trace arrays for ternary plots
- `GET /search?q=<query>` - Search comment snippets, returns ranked results
- `GET /keyword/{term}` - Get speaker list, counts, and context for a keyword

### Response Format

All endpoints return CORS-enabled JSON responses ready for consumption by the React frontend.

#### Ternary Plot Data
```json
{
  "data": [{
    "type": "scatterternary",
    "mode": "markers", 
    "a": [0.1, 0.2, 0.3],
    "b": [0.4, 0.5, 0.6],
    "c": [0.5, 0.3, 0.1],
    "text": ["Speaker 1", "Speaker 2", "Speaker 3"],
    "marker": {
      "color": ["red", "blue", "green"],
      "size": [10, 15, 12]
    }
  }],
  "layout": {
    "ternary": {
      "sum": 1,
      "aaxis": {"title": "Axis A"},
      "baxis": {"title": "Axis B"},
      "caxis": {"title": "Axis C"}
    },
    "title": "Ternary Plot - Session X"
  }
}
```

## Database

The service connects to the SQLite database at `/data/oewg_analysis_dash.db` in read-only mode.

## Development Notes

- CORS is enabled for all origins (configure for production)
- Database queries are placeholders and need to be updated based on actual schema
- Error handling and logging included
- Ready for integration with React frontend using react-query
