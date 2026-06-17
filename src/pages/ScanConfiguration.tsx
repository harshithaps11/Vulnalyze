import React, { useState } from 'react';
import { PageContainer } from '../components/layout/PageContainer';
import { ScanConfigurationForm } from '../components/scan/ScanConfigurationForm';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

export function ScanConfiguration() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  
  const handleSubmit = async (config: any) => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.post('http://localhost:8000/api/v1/scans', {
        target_url: config.url,
        source_code: config.type === 'static' || config.type === 'hybrid' ? `// Scan target: ${config.url}\n\nfunction evalInput(userInput) {\n  eval("console.log(" + userInput + ")"); // command injection\n}\n\nfunction updateHtml(userInput) {\n  document.getElementById("content").innerHTML = userInput; // xss\n}\n\nfunction selectUser(userId) {\n  const query = "SELECT * FROM users WHERE id = '" + userId + "'"; // sql injection\n  return query;\n}` : null,
        scan_type: config.type
      });
      
      const scanUuid = response.data.uuid;
      navigate(`/scan/progress/${scanUuid}`);
    } catch (err: any) {
      console.error('Error starting scan:', err);
      setError(err.response?.data?.detail || 'Failed to start scan. Please check if the backend server is running.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageContainer
      title="New Security Scan"
      description="Configure the parameters for your security vulnerability scan"
    >
      <div className="max-w-3xl mx-auto">
        {error && (
          <div className="mb-4 p-4 bg-severity-critical/10 border border-severity-critical/20 rounded-md text-severity-critical text-sm">
            {error}
          </div>
        )}
        {loading ? (
          <div className="text-center py-12 text-dark-300">
            Starting scan and initializing backend processes...
          </div>
        ) : (
          <ScanConfigurationForm onSubmit={handleSubmit} />
        )}
      </div>
    </PageContainer>
  );
}