import io
import os
import sys

# Ensure backend folder is in python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

try:
    import pytest
except ImportError:
    pytest = None

from app import app, stemmer, get_highlighted_snippet


if pytest is not None:
    @pytest.fixture
    def client():
        app.config['TESTING'] = True
        with app.test_client() as client:
            yield client


def test_stemming_matches():
    """Proves the NLP stemmer maps variations to the same root."""
    assert stemmer.stem("routers") == stemmer.stem("router")
    assert stemmer.stem("networks") == stemmer.stem("network")


def test_snippet_page_marker_extraction():
    """Proves the snippet engine extracts and cleans the [PG:n] marker."""
    dummy_text = "start of document [PG:12] the router directs traffic. end of document"
    snippet = get_highlighted_snippet(dummy_text, "router")

    assert "(Page 12)" in snippet
    assert "<mark>router</mark>" in snippet
    assert "[PG:12]" not in snippet  # the raw marker was stripped


def test_security_upload_rejects_html(client):
    """Proves the API blocks files that are not pdf/docx/txt."""
    data = {'file': (io.BytesIO(b"<html><script>alert('hack')</script></html>"), 'virus.html')}
    response = client.post('/api/upload', data=data, content_type='multipart/form-data')

    # No file should have been indexed
    assert b"0 of 1 files" in response.data


def test_ranking_logic(client):
    """BM25 puts a routing-heavy document first for the query 'routing'."""
    response = client.get('/api/search?q=routing')
    assert response.status_code == 200

    results = response.get_json()
    assert results, "search returned nothing"
    assert results[0]['path'] in ("unit3-Network_Layer.pdf", "BCS502-module-3-pdf.pdf")

    scores = [float(r['score'].split("BM25: ")[1].split(" |")[0]) for r in results]
    assert scores == sorted(scores, reverse=True)


def test_health_check(client):
    """Proves the health check endpoint returns 200 and counts."""
    response = client.get('/api/health')
    assert response.status_code == 200
    data = response.get_json()
    assert data["status"] == "healthy"
    assert data["total_documents"] > 0


def test_stats_endpoint(client):
    """Proves stats endpoint returns total_documents, total_searches, avg_response."""
    response = client.get('/api/stats')
    assert response.status_code == 200
    data = response.get_json()
    assert 'total_documents' in data
    assert 'total_searches' in data
    assert 'avg_response' in data


def test_documents_endpoint(client):
    """Proves documents endpoint returns indexed files list."""
    response = client.get('/api/documents')
    assert response.status_code == 200
    docs = response.get_json()
    assert isinstance(docs, list)
    assert len(docs) > 0
    assert 'title' in docs[0]
    assert 'type' in docs[0]


def test_serve_file_exists(client):
    """Proves that sample documents can be served."""
    response = client.get('/api/files/BCS502-module-1-pdf.pdf')
    assert response.status_code == 200


def test_serve_file_not_found(client):
    """Proves requesting nonexistent file returns clean 404."""
    response = client.get('/api/files/nonexistent.pdf')
    assert response.status_code == 404


if __name__ == '__main__':
    print("Running tests...")
    test_stemming_matches()
    print("[PASS] test_stemming_matches")
    test_snippet_page_marker_extraction()
    print("[PASS] test_snippet_page_marker_extraction")
    app.config['TESTING'] = True
    with app.test_client() as c:
        test_security_upload_rejects_html(c)
        print("[PASS] test_security_upload_rejects_html")
        test_ranking_logic(c)
        print("[PASS] test_ranking_logic")
        test_health_check(c)
        print("[PASS] test_health_check")
        test_stats_endpoint(c)
        print("[PASS] test_stats_endpoint")
        test_documents_endpoint(c)
        print("[PASS] test_documents_endpoint")
        test_serve_file_exists(c)
        print("[PASS] test_serve_file_exists")
        test_serve_file_not_found(c)
        print("[PASS] test_serve_file_not_found")
    print("All tests passed successfully!")
