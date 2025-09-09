import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000/api';

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface ApiResponse {
  response: string;
}

interface CodeAnalysis {
  vulnerabilities: Vulnerability[];
  suggestions: Suggestion[];
  performance: PerformanceMetric[];
}

interface Vulnerability {
  type: string;
  severity: 'low' | 'medium' | 'high';
  description: string;
  location: string;
  fix?: string;
}

interface Suggestion {
  type: 'security' | 'performance' | 'best-practice';
  description: string;
  impact: 'low' | 'medium' | 'high';
  priority: number;
}

interface PerformanceMetric {
  metric: string;
  value: string;
  recommendation: string;
}

// Fallback responses when API is not available
const fallbackResponses = {
  security: `I've analyzed your code and found potential security concerns:

1. Input validation is missing in the user data processing function
2. Consider implementing rate limiting for API endpoints
3. Add proper error handling for database operations
4. Use parameterized queries instead of string concatenation
5. Implement proper XSS protection

Would you like me to provide specific fixes for any of these issues?`,
  
  enhancement: `Here are some suggestions to enhance your code:

1. Use TypeScript for better type safety
2. Implement proper error handling
3. Add input validation
4. Use modern ES6+ features
5. Add unit tests for critical functions`,
  
  general: `I can help you with:

1. Security analysis of your code
2. Code enhancement suggestions
3. Best practices implementation
4. Vulnerability fixes

What specific aspect would you like me to focus on?`
};

export const analyzeCodeWithAI = async (code: string, question: string): Promise<string> => {
  try {
    const response = await axios.post<ApiResponse>(`${API_BASE_URL}/analyze`, {
      code,
      question
    });

    return response.data.response;
  } catch (error) {
    console.error('Error calling API:', error);
    return fallbackResponses.general;
  }
};

export const getCodeFix = async (code: string, vulnerability: string): Promise<string> => {
  try {
    const response = await axios.post<ApiResponse>(`${API_BASE_URL}/fix`, {
      code,
      vulnerability
    });

    return response.data.response;
  } catch (error) {
    console.error('Error getting code fix:', error);
    return code;
  }
};

export const getCodeExplanation = async (code: string): Promise<string> => {
  try {
    const response = await axios.post<ApiResponse>(`${API_BASE_URL}/explain`, {
      code
    });

    return response.data.response;
  } catch (error) {
    console.error('Error getting code explanation:', error);
    return "Unable to generate code explanation at this time.";
  }
};

export const getBestPractices = async (code: string): Promise<Suggestion[]> => {
  try {
    const response = await axios.post<ApiResponse>(`${API_BASE_URL}/best-practices`, {
      code
    });

    return JSON.parse(response.data.response);
  } catch (error) {
    console.error('Error getting best practices:', error);
    return [];
  }
};

export const getPerformanceAnalysis = async (code: string): Promise<PerformanceMetric[]> => {
  try {
    const response = await axios.post<ApiResponse>(`${API_BASE_URL}/performance`, {
      code
    });

    return JSON.parse(response.data.response);
  } catch (error) {
    console.error('Error getting performance analysis:', error);
    return [];
  }
}; 