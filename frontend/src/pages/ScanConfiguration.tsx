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
        source_code: (() => {
          // If the user entered custom code in the form, ALWAYS use the user's code!
          if (config.sourceCode && config.sourceCode.trim()) {
            return config.sourceCode.trim();
          }

          // Dynamic scans do NOT use static source code — only dynamic HTTP header checks
          if (config.type === 'dynamic') return null;
          
          // Fallback demo snippets for static/hybrid/ai_security when no code is entered by the user
          const AI_SECURITY_DEMO = `# === AI SECURITY DEMO: LLM Integration with Vulnerabilities ===
import openai

# [VULN: Hardcoded API Key] OpenAI key in source code
openai.api_key = "sk-proj-a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0"

# [VULN: Prompt Injection] Unsanitized user input interpolated into LLM prompt
def ask_ai(user_message):
    prompt = f"You are a helpful assistant. User says: {user_message}"
    response = openai.ChatCompletion.create(
        model="gpt-4",
        messages=[{"role": "user", "content": prompt}]
    )
    # [VULN: Unvalidated LLM Output] Response used directly without sanitization
    output = response.choices[0].message.content
    document.getElementById("result").innerHTML = output
    return output
`;

          const STATIC_DEMO = `// === DEMO: Intentionally Vulnerable Web App Code ===

// [VULN: XSS] Unsanitized innerHTML assignment
function renderUserContent(userInput) {
  document.getElementById("output").innerHTML = userInput;
}

// [VULN: SQL Injection] String concatenation in query
function findUser(userId) {
  const query = "SELECT * FROM users WHERE id = '" + userId + "'";
  return db.execute(query);
}
`;

          return config.type === 'ai_security' ? AI_SECURITY_DEMO : STATIC_DEMO;
        })(),
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