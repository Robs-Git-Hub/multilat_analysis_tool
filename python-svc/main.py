
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
import sqlite3
import json
from pathlib import Path
from typing import List, Dict, Any, Optional
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Multilat Analysis API",
    description="FastAPI microservice for diplomatic analytics",
    version="1.0.0"
)

# CORS middleware to allow React frontend access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify your frontend domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Database path
DB_PATH = Path(__file__).parent.parent / "data" / "oewg_analysis_dash.db"

def get_db_connection():
    """Create and return a database connection."""
    try:
        conn = sqlite3.connect(str(DB_PATH))
        conn.row_factory = sqlite3.Row  # Enable dict-like access to rows
        return conn
    except Exception as e:
        logger.error(f"Database connection error: {e}")
        raise HTTPException(status_code=500, detail="Database connection failed")

@app.get("/")
async def root():
    """Health check endpoint."""
    return {"message": "Multilat Analysis API is running", "version": "1.0.0"}

@app.get("/figure/ternary/{session_id}")
async def get_ternary_data(session_id: str):
    """
    Get ternary plot data for a specific session.
    Returns Plotly trace arrays ready for react-plotly.js.
    """
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Query ternary data - this is a placeholder structure
        # The actual query will depend on the exact schema in oewg_analysis_dash.db
        query = """
        SELECT 
            speaker_name,
            x_coord,
            y_coord, 
            z_coord,
            text_content,
            marker_color,
            marker_size
        FROM ternary_plot_data 
        WHERE session_id = ?
        """
        
        cursor.execute(query, (session_id,))
        rows = cursor.fetchall()
        
        if not rows:
            # Return empty trace structure if no data found
            return {
                "data": [{
                    "type": "scatterternary",
                    "mode": "markers",
                    "a": [],
                    "b": [],
                    "c": [],
                    "text": [],
                    "marker": {
                        "color": [],
                        "size": []
                    }
                }],
                "layout": {
                    "ternary": {
                        "sum": 1,
                        "aaxis": {"title": "Axis A"},
                        "baxis": {"title": "Axis B"}, 
                        "caxis": {"title": "Axis C"}
                    },
                    "title": f"Ternary Plot - Session {session_id}"
                }
            }
        
        # Transform data into Plotly format
        trace_data = {
            "type": "scatterternary",
            "mode": "markers",
            "a": [row["x_coord"] for row in rows],
            "b": [row["y_coord"] for row in rows],
            "c": [row["z_coord"] for row in rows],
            "text": [row["text_content"] for row in rows],
            "marker": {
                "color": [row["marker_color"] for row in rows],
                "size": [row["marker_size"] for row in rows]
            }
        }
        
        layout = {
            "ternary": {
                "sum": 1,
                "aaxis": {"title": "Axis A"},
                "baxis": {"title": "Axis B"},
                "caxis": {"title": "Axis C"}
            },
            "title": f"Ternary Plot - Session {session_id}",
            "height": 600
        }
        
        conn.close()
        
        return {
            "data": [trace_data],
            "layout": layout
        }
        
    except Exception as e:
        logger.error(f"Error fetching ternary data: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/search")
async def search_comments(q: str = Query(..., description="Search query")):
    """
    Search for comment snippets and return ranked results.
    """
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Search query - placeholder structure
        query = """
        SELECT 
            snippet_id,
            snippet_text,
            speaker_name,
            session_id,
            relevance_score
        FROM comment_snippets 
        WHERE snippet_text LIKE ?
        ORDER BY relevance_score DESC
        LIMIT 50
        """
        
        search_term = f"%{q}%"
        cursor.execute(query, (search_term,))
        rows = cursor.fetchall()
        
        results = []
        for row in rows:
            results.append({
                "id": row["snippet_id"],
                "text": row["snippet_text"],
                "speaker": row["speaker_name"],
                "session": row["session_id"],
                "score": row["relevance_score"]
            })
        
        conn.close()
        
        return {
            "query": q,
            "results": results,
            "total": len(results)
        }
        
    except Exception as e:
        logger.error(f"Error in search: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/keyword/{term}")
async def get_keyword_details(term: str):
    """
    Get speaker list, counts, and context lines for a specific keyword.
    """
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Keyword analysis query - placeholder structure  
        query = """
        SELECT 
            speaker_name,
            mention_count,
            context_lines
        FROM keyword_analysis 
        WHERE keyword = ?
        ORDER BY mention_count DESC
        """
        
        cursor.execute(query, (term,))
        rows = cursor.fetchall()
        
        speakers = []
        for row in rows:
            speakers.append({
                "name": row["speaker_name"],
                "count": row["mention_count"],
                "context": json.loads(row["context_lines"]) if row["context_lines"] else []
            })
        
        conn.close()
        
        total_mentions = sum(speaker["count"] for speaker in speakers)
        
        return {
            "keyword": term,
            "total_mentions": total_mentions,
            "speakers": speakers
        }
        
    except Exception as e:
        logger.error(f"Error fetching keyword details: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
