import React, { useState } from 'react';
import { PageContainer } from '../components/layout/PageContainer';
import { ScanConfigurationForm } from '../components/scan/ScanConfigurationForm';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { apiClient } from '../services/apiClient';

export function ScanConfiguration() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  
  const handleSubmit = async (config: any) => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.post('/scans', {
        target_url: config.url,
        // Demo source code: contains intentional vulnerabilities so the scanner always finds real results.
        // In production, users would upload their actual source files.
        source_code: config.type === 'static' || config.type === 'hybrid'
          ? `// === DEMO: Intentionally Vulnerable Code ===
// This snippet is used to demonstrate Vulnalyze's static scanner.
// Each function below contains a real vulnerability class.

// [VULN: XSS] Unsanitized innerHTML assignment
function renderUserContent(userInput) {
  document.getElementById("output").innerHTML = userInput;
}

// [VULN: SQL Injection] String concatenation in query
function findUser(userId) {
  const query = "SELECT * FROM users WHERE id = '" + userId + "'";
  return db.execute(query);
}

// [VULN: Command Injection] Dynamic eval / exec usage
function runScript(scriptName) {
  eval("require('./" + scriptName + "')");
  exec("node " + scriptName);
}

// [VULN: Weak Hash] MD5 and SHA-1 for password hashing
function hashPassword(password) {
  return md5(password) || sha1(password);
}
`
          : null,
        scan_type: config.type
      });
      
      const scanUuid = response.data.uuid;
      navigate(`/scan/progress/${scanUuid}`);
    } catch (err: any) {
      console.error('Error starting scan:', err);
      if (axios.isAxiosError(err)) {
        const detail = err.response?.data?.detail;
        if (typeof detail === 'string' && detail.trim()) {
          setError(detail);
        } else if (err.code === 'ERR_NETWORK') {
          setError('Unable to reach the backend at http://localhost:8000. Make sure the API server is running.');
        } else if (err.response?.status === 422) {
          setError('The scan request was rejected because the input data is invalid.');
        } else {
          setError('Failed to start scan. Please check the backend response and try again.');
        }
      } else {
        setError('Failed to start scan. Please check the backend response and try again.');
      }
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