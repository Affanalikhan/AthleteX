import React, { useState } from 'react';
import axios from 'axios';
import './App.css';
import Dashboard from './components/Dashboard';
import UploadSection from './components/UploadSection';

function App() {
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleAnalyze = async (file) => {
    setLoading(true);
    setError(null);
    setResults(null);

    const formData = new FormData();
    formData.append('video', file);

    try {
      const response = await axios.post('http://localhost:8000/api/analyze', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setResults(response.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Analysis failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="App">
      <header className="app-header">
        <h1>🏃 Endurance Run Coach</h1>
        <p>AI-powered running form analysis</p>
      </header>

      <main className="app-main">
        {!results && (
          <UploadSection 
            onAnalyze={handleAnalyze} 
            loading={loading} 
            error={error} 
          />
        )}

        {results && <Dashboard data={results} onReset={() => setResults(null)} />}
      </main>
    </div>
  );
}

export default App;
