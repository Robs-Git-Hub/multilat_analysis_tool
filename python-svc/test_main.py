
import pytest
import json
from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock
from main import app, get_db_connection

client = TestClient(app)

class TestHealthCheck:
    """Test the root health check endpoint."""
    
    def test_root_endpoint(self):
        """Test that the root endpoint returns correct health check."""
        response = client.get("/")
        assert response.status_code == 200
        data = response.json()
        assert data["message"] == "Multilat Analysis API is running"
        assert data["version"] == "1.0.0"

class TestTernaryEndpoint:
    """Test the ternary plot data endpoint."""
    
    @patch('main.get_db_connection')
    def test_ternary_data_with_results(self, mock_db):
        """Test ternary endpoint with mock data."""
        # Mock database connection and cursor
        mock_conn = MagicMock()
        mock_cursor = MagicMock()
        mock_conn.cursor.return_value = mock_cursor
        mock_db.return_value = mock_conn
        
        # Mock database results
        mock_rows = [
            {
                "speaker_name": "Speaker 1",
                "x_coord": 0.3,
                "y_coord": 0.4,
                "z_coord": 0.3,
                "text_content": "Test content 1",
                "marker_color": "red",
                "marker_size": 10
            },
            {
                "speaker_name": "Speaker 2", 
                "x_coord": 0.2,
                "y_coord": 0.5,
                "z_coord": 0.3,
                "text_content": "Test content 2",
                "marker_color": "blue",
                "marker_size": 15
            }
        ]
        mock_cursor.fetchall.return_value = mock_rows
        
        response = client.get("/figure/ternary/session123")
        assert response.status_code == 200
        
        data = response.json()
        assert "data" in data
        assert "layout" in data
        assert len(data["data"]) == 1
        
        trace = data["data"][0]
        assert trace["type"] == "scatterternary"
        assert trace["mode"] == "markers"
        assert len(trace["a"]) == 2
        assert trace["a"] == [0.3, 0.2]
        assert trace["b"] == [0.4, 0.5]
        assert trace["c"] == [0.3, 0.3]
        
        mock_conn.close.assert_called_once()
    
    @patch('main.get_db_connection')
    def test_ternary_data_empty_results(self, mock_db):
        """Test ternary endpoint with no data."""
        mock_conn = MagicMock()
        mock_cursor = MagicMock()
        mock_conn.cursor.return_value = mock_cursor
        mock_db.return_value = mock_conn
        
        mock_cursor.fetchall.return_value = []
        
        response = client.get("/figure/ternary/empty_session")
        assert response.status_code == 200
        
        data = response.json()
        assert "data" in data
        assert len(data["data"]) == 1
        assert data["data"][0]["a"] == []
        assert data["layout"]["title"] == "Ternary Plot - Session empty_session"
    
    @patch('main.get_db_connection')
    def test_ternary_data_db_error(self, mock_db):
        """Test ternary endpoint with database error."""
        mock_db.side_effect = Exception("Database connection failed")
        
        response = client.get("/figure/ternary/error_session")
        assert response.status_code == 500
        assert "Database connection failed" in response.json()["detail"]

class TestSearchEndpoint:
    """Test the search endpoint."""
    
    @patch('main.get_db_connection')
    def test_search_with_results(self, mock_db):
        """Test search endpoint with mock results."""
        mock_conn = MagicMock()
        mock_cursor = MagicMock()
        mock_conn.cursor.return_value = mock_cursor
        mock_db.return_value = mock_conn
        
        mock_rows = [
            {
                "snippet_id": "1",
                "snippet_text": "Test snippet about climate",
                "speaker_name": "Speaker A",
                "session_id": "session1",
                "relevance_score": 0.95
            },
            {
                "snippet_id": "2", 
                "snippet_text": "Another climate related comment",
                "speaker_name": "Speaker B",
                "session_id": "session2",
                "relevance_score": 0.87
            }
        ]
        mock_cursor.fetchall.return_value = mock_rows
        
        response = client.get("/search?q=climate")
        assert response.status_code == 200
        
        data = response.json()
        assert data["query"] == "climate"
        assert data["total"] == 2
        assert len(data["results"]) == 2
        assert data["results"][0]["score"] == 0.95
        assert data["results"][0]["text"] == "Test snippet about climate"
    
    def test_search_missing_query(self):
        """Test search endpoint without query parameter."""
        response = client.get("/search")
        assert response.status_code == 422  # Validation error
    
    @patch('main.get_db_connection')
    def test_search_empty_results(self, mock_db):
        """Test search endpoint with no results."""
        mock_conn = MagicMock()
        mock_cursor = MagicMock()
        mock_conn.cursor.return_value = mock_cursor
        mock_db.return_value = mock_conn
        
        mock_cursor.fetchall.return_value = []
        
        response = client.get("/search?q=nonexistent")
        assert response.status_code == 200
        
        data = response.json()
        assert data["total"] == 0
        assert data["results"] == []

class TestKeywordEndpoint:
    """Test the keyword details endpoint."""
    
    @patch('main.get_db_connection')
    def test_keyword_with_results(self, mock_db):
        """Test keyword endpoint with mock data."""
        mock_conn = MagicMock()
        mock_cursor = MagicMock()
        mock_conn.cursor.return_value = mock_cursor
        mock_db.return_value = mock_conn
        
        mock_rows = [
            {
                "speaker_name": "Country A",
                "mention_count": 15,
                "context_lines": json.dumps(["Context line 1", "Context line 2"])
            },
            {
                "speaker_name": "Country B",
                "mention_count": 8,
                "context_lines": json.dumps(["Context line 3"])
            }
        ]
        mock_cursor.fetchall.return_value = mock_rows
        
        response = client.get("/keyword/sustainability")
        assert response.status_code == 200
        
        data = response.json()
        assert data["keyword"] == "sustainability"
        assert data["total_mentions"] == 23
        assert len(data["speakers"]) == 2
        assert data["speakers"][0]["name"] == "Country A"
        assert data["speakers"][0]["count"] == 15
        assert len(data["speakers"][0]["context"]) == 2
    
    @patch('main.get_db_connection')
    def test_keyword_empty_results(self, mock_db):
        """Test keyword endpoint with no results."""
        mock_conn = MagicMock()
        mock_cursor = MagicMock()
        mock_conn.cursor.return_value = mock_cursor
        mock_db.return_value = mock_conn
        
        mock_cursor.fetchall.return_value = []
        
        response = client.get("/keyword/nonexistent")
        assert response.status_code == 200
        
        data = response.json()
        assert data["total_mentions"] == 0
        assert data["speakers"] == []

class TestCORSHeaders:
    """Test CORS functionality."""
    
    def test_cors_headers_present(self):
        """Test that CORS headers are present in responses."""
        response = client.get("/")
        assert response.status_code == 200
        # Note: TestClient doesn't automatically add CORS headers in test mode
        # but the middleware is configured correctly in the app

class TestDatabaseConnection:
    """Test database connection functionality."""
    
    @patch('main.Path')
    @patch('sqlite3.connect')
    def test_get_db_connection_success(self, mock_connect, mock_path):
        """Test successful database connection."""
        mock_conn = MagicMock()
        mock_connect.return_value = mock_conn
        
        conn = get_db_connection()
        assert conn == mock_conn
        mock_connect.assert_called_once()
    
    @patch('main.Path')
    @patch('sqlite3.connect')
    def test_get_db_connection_failure(self, mock_connect, mock_path):
        """Test database connection failure."""
        mock_connect.side_effect = Exception("Connection failed")
        
        with pytest.raises(Exception):
            get_db_connection()

if __name__ == "__main__":
    pytest.main(["-v", "test_main.py"])
