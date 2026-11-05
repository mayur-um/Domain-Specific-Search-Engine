import { useState, useEffect, useRef } from 'react';
import {
  Search,
  Home,
  FileText,
  BarChart3,
  Settings,
  Info,
  Zap,
  CloudUpload,
  CheckCircle2,
  ExternalLink,
  Clock,
  ArrowRight,
  RefreshCw,
  FolderOpen
} from 'lucide-react';
import './App.css';

// Points dynamically to local Flask backend in dev mode, or configured production URL
const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV
    ? 'http://127.0.0.1:5000'
    : 'https://domain-specific-search-engine-1.onrender.com');

function App() {
  // Navigation active tab: 'home' | 'documents' | 'statistics' | 'settings' | 'about'
  const [activeTab, setActiveTab] = useState('home');

  // Search states
  const [query, setQuery] = useState('routing');
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Stats state
  const [stats, setStats] = useState({
    total_documents: 7,
    total_searches: 245,
    avg_response: '0.3s',
    total_terms: 1420,
    status: 'online'
  });
  const [serverOnline, setServerOnline] = useState(true);

  // Documents state for 'My Documents' tab
  const [documentsList, setDocumentsList] = useState([]);
  const [isLoadingDocs, setIsLoadingDocs] = useState(false);

  // Upload states
  const [selectedFiles, setSelectedFiles] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState('');
  const [statusBanner, setStatusBanner] = useState(
    'Ready to search! Upload documents above or start typing your query.'
  );
  const fileInputRef = useRef(null);

  // Suggestions chips
  const sampleSuggestions = [
    'machine learning',
    'data science',
    'research papers',
    'routing',
    'tcp',
    'ip address'
  ];

  // Fetch quick stats and server health on mount
  const fetchStats = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/stats`);
      if (res.ok) {
        const data = await res.json();
        setStats(data);
        setServerOnline(true);
      } else {
        setServerOnline(false);
      }
    } catch {
      setServerOnline(false);
    }
  };

  const fetchDocuments = async () => {
    setIsLoadingDocs(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/documents`);
      if (res.ok) {
        const data = await res.json();
        setDocumentsList(data);
      }
    } catch (e) {
      console.error('Failed to load documents:', e);
    } finally {
      setIsLoadingDocs(false);
    }
  };

  useEffect(() => {
    fetchStats();
    // Run an initial search for sample view
    handleSearch('routing');
  }, []);

  useEffect(() => {
    if (activeTab === 'documents') {
      fetchDocuments();
    }
  }, [activeTab]);

  // Search function
  const handleSearch = async (searchTerm) => {
    const term = typeof searchTerm === 'string' ? searchTerm : query;
    if (!term.trim()) return;

    setIsSearching(true);
    setHasSearched(true);
    setErrorMessage('');

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/search?q=${encodeURIComponent(term.trim())}`
      );

      if (!response.ok) {
        throw new Error(`Server returned error ${response.status}`);
      }

      const data = await response.json();
      setResults(data);
      setServerOnline(true);
      setStatusBanner(
        `Search completed: Found ${data.length} document(s) matching "${term.trim()}".`
      );
      // Refresh stats after query
      fetchStats();
    } catch (error) {
      console.error('Backend connection failed:', error);
      setServerOnline(false);
      setErrorMessage(
        'Could not connect to backend at ' +
          API_BASE_URL +
          '. Make sure the Flask server is running.'
      );
      setStatusBanner('Search failed: Backend server unreachable.');
    } finally {
      setIsSearching(false);
    }
  };

  // Select multiple files
  const handleFileChange = (event) => {
    if (event.target.files && event.target.files.length > 0) {
      setSelectedFiles(event.target.files);
      setUploadMessage(`${event.target.files.length} file(s) selected`);
    }
  };

  // Upload multiple files
  const handleUpload = async () => {
    if (!selectedFiles || selectedFiles.length === 0) {
      setUploadMessage('Please select at least one file first.');
      return;
    }

    const formData = new FormData();
    for (let i = 0; i < selectedFiles.length; i++) {
      formData.append('file', selectedFiles[i]);
    }

    setIsUploading(true);
    try {
      setUploadMessage(`Uploading ${selectedFiles.length} file(s)...`);

      const response = await fetch(`${API_BASE_URL}/api/upload`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        setUploadMessage(data.message || 'Files uploaded successfully!');
        setStatusBanner(data.message || 'Files uploaded and indexed successfully!');
        setSelectedFiles(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        fetchStats();
        if (activeTab === 'documents') {
          fetchDocuments();
        }
      } else {
        setUploadMessage('Error: ' + (data.error || 'Upload failed.'));
      }
    } catch (error) {
      console.error(error);
      setUploadMessage('Failed to connect to backend server.');
    } finally {
      setIsUploading(false);
    }
  };

  const getFormatBadge = (type) => {
    const t = (type || 'PDF').toUpperCase();
    if (t.includes('PDF')) return <span className="format-badge badge-pdf">PDF</span>;
    if (t.includes('DOC')) return <span className="format-badge badge-doc">DOC</span>;
    return <span className="format-badge badge-txt">TXT</span>;
  };

  return (
    <div className="app-layout">
      {/* LEFT SIDEBAR */}
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="brand-icon-wrapper">
            <Search className="brand-icon" size={26} strokeWidth={2.5} />
          </div>
          <div className="brand-text">
            <h2>DSSE</h2>
            <span>Search Smarter</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          <button
            className={`nav-item ${activeTab === 'home' ? 'active' : ''}`}
            onClick={() => setActiveTab('home')}
          >
            <Home size={19} />
            <span>Home</span>
          </button>

          <button
            className={`nav-item ${activeTab === 'documents' ? 'active' : ''}`}
            onClick={() => setActiveTab('documents')}
          >
            <FileText size={19} />
            <span>My Documents</span>
          </button>

          <button
            className={`nav-item ${activeTab === 'statistics' ? 'active' : ''}`}
            onClick={() => setActiveTab('statistics')}
          >
            <BarChart3 size={19} />
            <span>Statistics</span>
          </button>

          <button
            className={`nav-item ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => setActiveTab('settings')}
          >
            <Settings size={19} />
            <span>Settings</span>
          </button>

          <button
            className={`nav-item ${activeTab === 'about' ? 'active' : ''}`}
            onClick={() => setActiveTab('about')}
          >
            <Info size={19} />
            <span>About</span>
          </button>
        </nav>

        <div className="sidebar-footer">
          <div className="powered-badge">
            <div className="powered-icon">
              <Zap size={16} />
            </div>
            <div className="powered-text">
              <span className="powered-sub">Powered by</span>
              <span className="powered-main">BM25 + TF-IDF</span>
            </div>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <div className="main-wrapper">
        {/* TOP STATUS BAR */}
        <header className="top-header">
          <div className="status-indicator">
            <span
              className={`status-dot ${serverOnline ? 'online' : 'offline'}`}
            ></span>
            <span className="status-text">
              {serverOnline ? 'Server Online' : 'Server Offline'}
            </span>
          </div>

          <div className="user-profile">
            <div className="avatar-circle">S</div>
          </div>
        </header>

        {/* TAB 1: HOME DASHBOARD */}
        {activeTab === 'home' && (
          <main className="content-container">
            {/* HERO SECTION */}
            <section className="hero-section">
              <div className="hero-art">
                {/* Large Stylized Magnifying Glass Illustration */}
                <svg
                  className="hero-magnifier"
                  width="86"
                  height="86"
                  viewBox="0 0 100 100"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <circle
                    cx="42"
                    cy="42"
                    r="28"
                    stroke="#5b36d6"
                    strokeWidth="9"
                    fill="none"
                  />
                  <line
                    x1="62"
                    y1="62"
                    x2="88"
                    y2="88"
                    stroke="#4322b3"
                    strokeWidth="11"
                    strokeLinecap="round"
                  />
                  <circle cx="34" cy="34" r="8" fill="#e0e7ff" opacity="0.6" />
                </svg>
              </div>

              <h1 className="hero-title">Domain-Specific Search Engine</h1>
              <p className="hero-subtitle">
                Find the right information, instantly.
              </p>
              <p className="hero-tagline">Search • Upload • Discover</p>
            </section>

            {/* SEARCH BAR SECTION */}
            <div className="search-container">
              <div className="search-bar">
                <Search className="search-input-icon" size={20} />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder="Search your documents..."
                />
                <button
                  className="search-btn"
                  onClick={() => handleSearch()}
                  disabled={isSearching}
                >
                  {isSearching ? 'Searching...' : 'Search'}
                </button>
              </div>

              {/* Try: Suggestions */}
              <div className="suggestions-row">
                <span className="try-label">Try:</span>
                {sampleSuggestions.map((item, idx) => (
                  <button
                    key={idx}
                    className="suggestion-chip"
                    onClick={() => {
                      setQuery(item);
                      handleSearch(item);
                    }}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>

            {/* MIDDLE CARDS: UPLOAD & SEARCH FEATURES */}
            <div className="cards-grid">
              {/* CARD 1: UPLOAD DOCUMENTS */}
              <div className="card upload-card">
                <div className="cloud-icon-wrapper">
                  <CloudUpload size={48} className="cloud-icon" />
                </div>
                <h3 className="card-title">Upload Documents</h3>
                <p className="card-description">
                  Choose PDF, DOCX or TXT files to add to your search collection.
                </p>

                <input
                  ref={fileInputRef}
                  type="file"
                  id="document-upload"
                  multiple
                  accept=".pdf,.docx,.txt"
                  onChange={handleFileChange}
                  style={{ display: 'none' }}
                />

                <label htmlFor="document-upload" className="choose-btn">
                  Choose Files
                </label>

                {selectedFiles && (
                  <div className="upload-controls">
                    <span className="selected-count">
                      {selectedFiles.length} file(s) selected
                    </span>
                    <button
                      className="confirm-upload-btn"
                      onClick={handleUpload}
                      disabled={isUploading}
                    >
                      {isUploading ? 'Uploading...' : 'Confirm Upload'}
                    </button>
                  </div>
                )}

                {uploadMessage && !selectedFiles && (
                  <span className="upload-status-msg">{uploadMessage}</span>
                )}

                <span className="card-footer-note">
                  Supported formats: PDF, DOCX, TXT
                </span>
              </div>

              {/* CARD 2: SEARCH FEATURES */}
              <div className="card features-card">
                <div className="features-left">
                  <h3 className="features-title">Search Features</h3>
                  <ul className="features-list">
                    <li>
                      <CheckCircle2 className="check-icon" size={18} />
                      <span>Domain-Specific Search</span>
                    </li>
                    <li>
                      <CheckCircle2 className="check-icon" size={18} />
                      <span>BM25 + TF-IDF Hybrid</span>
                    </li>
                    <li>
                      <CheckCircle2 className="check-icon" size={18} />
                      <span>Multiple File Support</span>
                    </li>
                    <li>
                      <CheckCircle2 className="check-icon" size={18} />
                      <span>Fast & Accurate Results</span>
                    </li>
                  </ul>
                </div>

                <div className="features-right">
                  {/* Layered Document Illustration with Magnifier */}
                  <div className="doc-illustration-wrapper">
                    <svg
                      width="150"
                      height="120"
                      viewBox="0 0 170 140"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      {/* Back page */}
                      <rect
                        x="20"
                        y="15"
                        width="80"
                        height="105"
                        rx="8"
                        fill="#ddd6fe"
                        stroke="#c4b5fd"
                        strokeWidth="2"
                        transform="rotate(-8 20 15)"
                      />
                      <line
                        x1="30"
                        y1="38"
                        x2="75"
                        y2="32"
                        stroke="#a78bfa"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                      />
                      <line
                        x1="32"
                        y1="50"
                        x2="77"
                        y2="44"
                        stroke="#a78bfa"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                      />
                      <line
                        x1="34"
                        y1="62"
                        x2="79"
                        y2="56"
                        stroke="#a78bfa"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                      />

                      {/* Middle page */}
                      <rect
                        x="45"
                        y="10"
                        width="82"
                        height="110"
                        rx="8"
                        fill="#ede9fe"
                        stroke="#c4b5fd"
                        strokeWidth="2"
                        transform="rotate(-2 45 10)"
                      />
                      <line
                        x1="58"
                        y1="30"
                        x2="105"
                        y2="28"
                        stroke="#8b5cf6"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                      />
                      <line
                        x1="58"
                        y1="42"
                        x2="105"
                        y2="40"
                        stroke="#8b5cf6"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                      />
                      <line
                        x1="58"
                        y1="54"
                        x2="105"
                        y2="52"
                        stroke="#8b5cf6"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                      />

                      {/* Front page */}
                      <rect
                        x="65"
                        y="14"
                        width="82"
                        height="112"
                        rx="8"
                        fill="#ffffff"
                        stroke="#c4b5fd"
                        strokeWidth="2"
                      />
                      <line
                        x1="78"
                        y1="32"
                        x2="130"
                        y2="32"
                        stroke="#7c3aed"
                        strokeWidth="3"
                        strokeLinecap="round"
                      />
                      <line
                        x1="78"
                        y1="46"
                        x2="130"
                        y2="46"
                        stroke="#a78bfa"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                      />
                      <line
                        x1="78"
                        y1="58"
                        x2="130"
                        y2="58"
                        stroke="#a78bfa"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                      />
                      <line
                        x1="78"
                        y1="70"
                        x2="120"
                        y2="70"
                        stroke="#a78bfa"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                      />

                      {/* Magnifying Glass Over Pages */}
                      <g transform="translate(10, 10)">
                        <circle
                          cx="115"
                          cy="65"
                          r="22"
                          stroke="#5b36d6"
                          strokeWidth="7"
                          fill="rgba(245, 243, 255, 0.45)"
                        />
                        <line
                          x1="131"
                          y1="81"
                          x2="152"
                          y2="102"
                          stroke="#4322b3"
                          strokeWidth="8"
                          strokeLinecap="round"
                        />
                      </g>
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* BOTTOM SECTION: QUICK STATS & SEARCH RESULTS */}
            <div className="bottom-grid">
              {/* QUICK STATS CARD */}
              <div className="card stats-card">
                <div className="stats-header">
                  <BarChart3 className="stats-icon" size={20} />
                  <h3>Quick Stats</h3>
                </div>

                <div className="stat-row">
                  <div className="stat-icon-box purple">
                    <FileText size={18} />
                  </div>
                  <div className="stat-content">
                    <span className="stat-label">Total Documents</span>
                    <span className="stat-value">{stats.total_documents}</span>
                  </div>
                </div>

                <div className="stat-row">
                  <div className="stat-icon-box blue">
                    <Search size={18} />
                  </div>
                  <div className="stat-content">
                    <span className="stat-label">Total Searches</span>
                    <span className="stat-value">{stats.total_searches}</span>
                  </div>
                </div>

                <div className="stat-row">
                  <div className="stat-icon-box green">
                    <Clock size={18} />
                  </div>
                  <div className="stat-content">
                    <span className="stat-label">Avg. Response</span>
                    <span className="stat-value">{stats.avg_response}</span>
                  </div>
                </div>
              </div>

              {/* SEARCH RESULTS CARD */}
              <div className="card results-card">
                <div className="results-header">
                  <div className="results-header-left">
                    <BarChart3 className="results-header-icon" size={18} />
                    <h3>
                      Search Results{' '}
                      <span className="count-label">
                        ({results.length} found)
                      </span>
                    </h3>
                  </div>

                  <span className="algorithm-badge">
                    Algorithm: BM25 + TF-IDF Hybrid
                  </span>
                </div>

                {errorMessage && (
                  <div className="error-box">{errorMessage}</div>
                )}

                <div className="results-list">
                  {results.map((result, index) => (
                    <div className="result-item" key={index}>
                      <div className="result-badge-col">
                        {getFormatBadge(result.type)}
                      </div>

                      <div className="result-info-col">
                        <h4 className="result-title">{result.title}</h4>
                        <span className="result-path">
                          {result.display_path || `/documents/${result.path}`}
                        </span>

                        <p
                          className="result-snippet"
                          dangerouslySetInnerHTML={{
                            __html: result.snippet,
                          }}
                        />
                      </div>

                      <div className="result-actions-col">
                        <span className="match-percentage">
                          {result.percentage || '95.2%'}
                        </span>

                        <a
                          href={`${API_BASE_URL}/api/files/${encodeURIComponent(
                            result.filename || result.path
                          )}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="view-btn"
                        >
                          View <ExternalLink size={13} />
                        </a>
                      </div>
                    </div>
                  ))}

                  {results.length === 0 && !isSearching && (
                    <div className="empty-results">
                      <p>No matching documents found in the current index.</p>
                      <small>Try typing a different term like "network", "routing", or "tcp".</small>
                    </div>
                  )}

                  {isSearching && (
                    <div className="loading-results">
                      <div className="spinner"></div>
                      <p>Searching index with BM25 ranking algorithm...</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* BOTTOM STATUS NOTIFICATION BANNER */}
            <div className="bottom-notification-banner">
              <CheckCircle2 className="notif-icon" size={18} />
              <span>{statusBanner}</span>
            </div>
          </main>
        )}

        {/* TAB 2: MY DOCUMENTS VIEW */}
        {activeTab === 'documents' && (
          <main className="content-container">
            <div className="page-header">
              <h2>My Documents Collection</h2>
              <p>Browse all study materials and indexed reference textbooks.</p>
            </div>

            <div className="card documents-table-card">
              <div className="table-header">
                <h3>Indexed Documents ({documentsList.length})</h3>
                <button
                  className="refresh-btn"
                  onClick={fetchDocuments}
                  disabled={isLoadingDocs}
                >
                  <RefreshCw size={14} className={isLoadingDocs ? 'spin' : ''} />
                  Refresh
                </button>
              </div>

              <div className="table-container">
                <table className="docs-table">
                  <thead>
                    <tr>
                      <th>Format</th>
                      <th>Document Title</th>
                      <th>System Path</th>
                      <th>Total Words</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {documentsList.map((doc, idx) => (
                      <tr key={idx}>
                        <td>{getFormatBadge(doc.type)}</td>
                        <td className="doc-title-cell">{doc.title}</td>
                        <td className="doc-path-cell">{doc.display_path}</td>
                        <td>{doc.total_words?.toLocaleString()} words</td>
                        <td>
                          <a
                            href={`${API_BASE_URL}/api/files/${encodeURIComponent(
                              doc.filename
                            )}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="view-btn"
                          >
                            Open <ExternalLink size={12} />
                          </a>
                        </td>
                      </tr>
                    ))}
                    {documentsList.length === 0 && !isLoadingDocs && (
                      <tr>
                        <td colSpan="5" className="empty-cell">
                          No documents found. Use the upload card on the Home tab to add documents.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </main>
        )}

        {/* TAB 3: STATISTICS VIEW */}
        {activeTab === 'statistics' && (
          <main className="content-container">
            <div className="page-header">
              <h2>Information Retrieval Statistics</h2>
              <p>Performance metrics and inverted index breakdown.</p>
            </div>

            <div className="stats-cards-grid">
              <div className="card stat-card-box">
                <span className="stat-box-label">Corpus Documents</span>
                <span className="stat-box-val">{stats.total_documents}</span>
                <span className="stat-box-sub">Active academic papers & manuals</span>
              </div>

              <div className="card stat-card-box">
                <span className="stat-box-label">Unique Stems in Index</span>
                <span className="stat-box-val">{stats.total_terms}</span>
                <span className="stat-box-sub">Tokenized with Porter Stemmer</span>
              </div>

              <div className="card stat-card-box">
                <span className="stat-box-label">Total Queries Served</span>
                <span className="stat-box-val">{stats.total_searches}</span>
                <span className="stat-box-sub">Handled by BM25 ranking</span>
              </div>

              <div className="card stat-card-box">
                <span className="stat-box-label">Average Latency</span>
                <span className="stat-box-val">{stats.avg_response}</span>
                <span className="stat-box-sub">In-memory caching pipeline</span>
              </div>
            </div>

            <div className="card params-card">
              <h3>BM25 Tuning Parameters</h3>
              <p>The ranking algorithm applies probabilistic relevance ranking with these calibrated values:</p>
              <ul>
                <li><strong>k1 = 1.5:</strong> Calibrates term frequency saturation limits.</li>
                <li><strong>b = 0.75:</strong> Regulates document length normalization penalty.</li>
                <li><strong>Stemmer:</strong> Porter Stemmer root algorithm maps variations (e.g. routing/routers → router).</li>
              </ul>
            </div>
          </main>
        )}

        {/* TAB 4: SETTINGS VIEW */}
        {activeTab === 'settings' && (
          <main className="content-container">
            <div className="page-header">
              <h2>Engine Settings & Configuration</h2>
              <p>Customize endpoint connections and search parameters.</p>
            </div>

            <div className="card settings-card">
              <div className="setting-group">
                <label>Active Backend API Endpoint</label>
                <input
                  type="text"
                  value={API_BASE_URL}
                  disabled
                  className="settings-input"
                />
                <small>Defined via Vite environment or auto-detected local host.</small>
              </div>

              <div className="setting-group">
                <label>Current Status</label>
                <div className="settings-status-box">
                  <span className={`status-dot ${serverOnline ? 'online' : 'offline'}`} />
                  <span>{serverOnline ? 'Connected to Flask Service' : 'Offline / Disconnected'}</span>
                </div>
              </div>
            </div>
          </main>
        )}

        {/* TAB 5: ABOUT VIEW */}
        {activeTab === 'about' && (
          <main className="content-container">
            <div className="page-header">
              <h2>About Domain-Specific Search Engine (DSSE)</h2>
              <p>Dr. AIT Information Science & Engineering Curriculum Project.</p>
            </div>

            <div className="card about-card">
              <h3>Project Overview</h3>
              <p>
                DSSE is an information retrieval system designed to index and search domain-specific
                curriculum materials including course modules, laboratory manuals, and model papers.
              </p>
              <div className="about-tech-stack">
                <span className="tech-tag">React + Vite</span>
                <span className="tech-tag">Flask Python</span>
                <span className="tech-tag">BM25 Ranking</span>
                <span className="tech-tag">TF-IDF Baseline</span>
                <span className="tech-tag">Porter Stemmer</span>
                <span className="tech-tag">PyPDF2 & python-docx</span>
              </div>
            </div>
          </main>
        )}
      </div>
    </div>
  );
}

export default App;
