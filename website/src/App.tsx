import './App.css';
import { useState } from 'react';

function App() {
  const [file, setFile] = useState<File | null>(null);
  const [light, setLight] = useState(false);
  const [heavy, setHeavy] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
const [error, setError] = useState<string | null>(null);

// const [gallery, setGallery] = useState<string[]>([]);
// const [showGallery, setShowGallery] = useState(false);

// const fetchGallery = async () => {
//   try {
//     const API_URL = process.env.REACT_APP_API_URL || 'http://127.0.0.1:5000';
//     const res = await fetch(`${API_URL}/gallery`);
//     const data = await res.json();
//     setGallery(data.images);
//   } catch (err: any) {
//     setError(err.message || 'Failed to fetch gallery');
//   }
// };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setFile(file);
    }
  };

  const handleLightChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setLight(event.target.checked);
  };

  const handleHeavyChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setHeavy(event.target.checked);
  };

  const handleSubmit = async () => {
    if (!file) return alert('Please select a file');
    setIsLoading(true);
    setResultUrl(null);
    setError(null);
  
    const formData = new FormData();
    formData.append('image', file);
    if (light) formData.append('light', 'true');
    if (heavy) formData.append('heavy', 'true');
  
    try {
      const API_URL = process.env.REACT_APP_API_URL || 'http://127.0.0.1:5000';
      const response = await fetch(API_URL + '/process', {
        method: 'POST',
        body: formData,
      });
  
      if (!response.ok) throw new Error('Failed to submit job');
  
      const data = await response.json();
      if (!data.task_id) throw new Error('No task ID returned');
  
      // Start polling for result
      pollForResult(data.task_id, API_URL);
    } catch (err: any) {
      setError(err.message || 'Processing failed');
      setIsLoading(false);
    }
  };
  
  const pollForResult = async (taskId: string, API_URL: string) => {
    const poll = async () => {
      try {
        const res = await fetch(`${API_URL}/task/${taskId}`);
        if (res.status === 202) {
          // Still processing, poll again after delay
          setTimeout(poll, 2000);
        } else if (res.ok) {
          const blob = await res.blob();
          setResultUrl(URL.createObjectURL(blob));
          setIsLoading(false);
        } else {
          setError('Processing failed');
          setIsLoading(false);
        }
      } catch {
        setError('Processing failed');
        setIsLoading(false);
      }
    };
    poll();
  };
  

  return (
    <div className="app-bg">
    <div className="app-card">
      <h1 className="app-title">Image Processor</h1>
      <div>
        <input
          type="file"
          onChange={handleFileChange}
          className="input-file"
        />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={light}
            onChange={handleLightChange}
            className="checkbox-input"
          />
          Light
        </label>
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={heavy}
            onChange={handleHeavyChange}
            className="checkbox-input"
          />
          Heavy
        </label>
      </div>
      <button
        disabled={isLoading}
        onClick={handleSubmit}
        className="button-main"
      >
        {isLoading ? 'Processing...' : 'Upload & Process'}
      </button>
      {isLoading && (
        <div className="status-message processing">Processing your image, please wait...</div>
      )}
      {error && (
        <div className="status-message error">{error}</div>
      )}
      {resultUrl && (
        <div className="processed-image-section">
          <h3 className="processed-image-title">Processed Image:</h3>
          <img
            src={resultUrl}
            alt="Processed"
            className="processed-image"
          />
        </div>
      )}
      {/* <button
        onClick={() => {
          setShowGallery(!showGallery);
          if (!gallery.length) fetchGallery();
        }}
        className="button-gallery"
      >
        {showGallery ? 'Hide Gallery' : 'Show Gallery'}
      </button> */}
      {/* {showGallery && (
        <div className="gallery-section">
          <h3 className="gallery-title">Gallery</h3>
          <div className="gallery-grid">
            {gallery.length > 0 ? (
              gallery.map((imgUrl, idx) => (
                <img
                  key={idx}
                  src={imgUrl}
                  alt={`Processed ${idx}`}
                  className="gallery-image"
                />
              ))
            ) : (
              <div className="gallery-empty">No images yet.</div>
            )}
          </div>
        </div>
      )} */}
    </div>
  </div>
  
  );
}

export default App;
