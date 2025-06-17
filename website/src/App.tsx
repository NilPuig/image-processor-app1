import './App.css';
import { useState } from 'react';

function App() {
  const [file, setFile] = useState<File | null>(null);
  const [light, setLight] = useState(false);
  const [heavy, setHeavy] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [taskId, setTaskId] = useState<string | null>(null);
const [error, setError] = useState<string | null>(null);


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
      const API_URL = process.env.REACT_APP_API_URL || 'http://127.0.0.1:5001';
      const response = await fetch(API_URL + '/process', {
        method: 'POST',
        body: formData,
      });
  
      if (!response.ok) throw new Error('Failed to submit job');
  
      const data = await response.json();
      if (!data.task_id) throw new Error('No task ID returned');
      setTaskId(data.task_id);
  
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
    <div className="App">
      <header className="App-header">
        <input type="file" onChange={handleFileChange} />
        <label>
          <input type="checkbox" checked={light} onChange={handleLightChange} />
          Light
        </label>
        <label>
          <input type="checkbox" checked={heavy} onChange={handleHeavyChange} />
          Heavy
        </label>
        <button disabled={isLoading} onClick={handleSubmit}>
          {isLoading ? 'Processing...' : 'Upload & Process'}
        </button>
        {isLoading && <div>Processing your image, please wait...</div>}
        {error && <div style={{ color: 'red' }}>{error}</div>}
        {resultUrl && (
          <div style={{ marginTop: 20 }}>
            <h3>Processed Image:</h3>
            <img src={resultUrl} alt="Processed" style={{ maxWidth: '100%' }} />
          </div>
        )}
      </header>
    </div>
  );
}

export default App;
