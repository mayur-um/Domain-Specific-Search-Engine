# Backend - Domain-Specific Search Engine

Flask REST API and information retrieval engine using BM25 and TF-IDF ranking with NLTK Porter Stemming.

## Directory Structure
```text
backend/
├── app.py                # Flask API application, inverted index logic, BM25 & TF-IDF ranking
├── evaluate.py           # Evaluation benchmark (Hits@1, Recall@5, MRR vs Random baseline)
├── terms_count.py        # Term frequency analyzer for document corpus
├── test_app.py           # Test suite (NLP stemming, snippet markers, upload security, ranking)
├── requirements.txt      # Core production dependencies
├── requirements-dev.txt  # Development & test dependencies
├── sample_docs/          # Curated PDF course materials auto-indexed at startup
└── data/                 # Generated inverted index and cached document text (gitignored)
```

## Setup & Running

1. **Navigate to the backend directory:**
   ```bash
   cd backend
   ```

2. **Create and activate a virtual environment (optional if using root `.venv`):**
   ```bash
   python -m venv .venv
   # Windows PowerShell:
   .venv\Scripts\Activate.ps1
   # Linux/macOS:
   source .venv/bin/activate
   ```

3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Start the API server:**
   ```bash
   python app.py
   ```
   The server runs by default on `http://127.0.0.1:5000`. On initial startup, documents in `sample_docs/` are automatically processed and indexed.

## API Endpoints

- `POST /api/upload`: Upload one or multiple documents (`.pdf`, `.docx`, `.txt`)
- `GET /api/search?q=<query>`: Search indexed documents using BM25 + TF-IDF ranking
- `GET /api/files/<filename>`: Retrieve or view original document files

## Running Tests & Evaluation

- **Run Tests:**
  ```bash
  python test_app.py
  # or with pytest:
  pytest test_app.py
  ```

- **Run Evaluation:**
  ```bash
  python evaluate.py
  ```

