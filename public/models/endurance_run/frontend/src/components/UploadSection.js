import React, { useState } from 'react';
import './UploadSection.css';

function UploadSection({ onAnalyze, loading, error }) {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setPreview(URL.createObjectURL(selectedFile));
    }
  };

  const handleSubmit = () => {
    if (file) {
      onAnalyze(file);
    }
  };

  return (
    <div className="upload-section">
      <div className="upload-card">
        <h2>Upload Your Running Video</h2>
        <p className="upload-instructions">
          📹 Side view or 30-45° angle<br />
          ⏱️ At least 8-15 seconds of steady running<br />
          📁 MP4, MOV, or AVI (max 50 MB)
        </p>

        <input
          type="file"
          accept="video/mp4,video/quicktime,video/x-msvideo"
          onChange={handleFileChange}
          id="video-upload"
          className="file-input"
        />
        <label htmlFor="video-upload" className="file-label">
          {file ? file.name : 'Choose Video File'}
        </label>

        {preview && (
          <video src={preview} controls className="video-preview" />
        )}

        <button
          onClick={handleSubmit}
          disabled={!file || loading}
          className="analyze-btn"
        >
          {loading ? 'Analyzing...' : 'Analyze Run'}
        </button>

        {error && <div className="error-message">{error}</div>}
      </div>
    </div>
  );
}

export default UploadSection;
