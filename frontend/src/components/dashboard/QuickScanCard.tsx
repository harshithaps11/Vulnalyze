import React, { useState } from 'react';
import { Search, AlertCircle, Loader2 } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Link, useNavigate } from 'react-router-dom';
import { apiClient } from '../../services/apiClient';

export function QuickScanCard() {
  const navigate = useNavigate();
  const [url, setUrl] = useState('');
  const [scanType, setScanType] = useState('dynamic');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUrl(e.target.value);
    if (error) setError('');
  };

  const handleScanTypeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setScanType(e.target.value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) {
      setError('URL is required');
      return;
    }

    try {
      new URL(url);
    } catch (err) {
      setError('Please enter a valid URL (including http:// or https://)');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await apiClient.post('/scans', {
        target_url: url,
        scan_type: scanType,
        source_code: null,
      });

      const scanUuid = response.data?.uuid;
      if (scanUuid) {
        navigate(`/progress/${scanUuid}`);
      } else {
        navigate('/results');
      }
    } catch (err: any) {
      console.error('Failed to create quick scan:', err);
      setError(err?.response?.data?.detail || 'Failed to trigger scan. Is backend running?');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="h-full">
      <h3 className="text-lg font-semibold text-white mb-4">Quick Scan</h3>

      <form onSubmit={handleSubmit}>
        <div className="space-y-4">
          <div>
            <label htmlFor="url" className="block text-sm font-medium text-dark-300 mb-1">
              Target URL to Scan
            </label>
            <div className="relative">
              <input
                type="text"
                id="url"
                value={url}
                onChange={handleUrlChange}
                className="input pr-10 text-sm"
                placeholder="https://example.com"
                required
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <Search size={18} className="text-dark-400" />
              </div>
            </div>
            {error && (
              <div className="mt-1 flex items-center text-xs text-severity-critical">
                <AlertCircle size={14} className="mr-1 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-dark-300 mb-2">Scan Type</label>
            <div className="flex space-x-4">
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  name="scanType"
                  value="static"
                  checked={scanType === 'static'}
                  onChange={handleScanTypeChange}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-dark-500 bg-dark-700"
                />
                <span className="ml-2 text-sm text-dark-300">Static</span>
              </label>
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  name="scanType"
                  value="dynamic"
                  checked={scanType === 'dynamic'}
                  onChange={handleScanTypeChange}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-dark-500 bg-dark-700"
                />
                <span className="ml-2 text-sm text-dark-300">Dynamic</span>
              </label>
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  name="scanType"
                  value="hybrid"
                  checked={scanType === 'hybrid'}
                  onChange={handleScanTypeChange}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-dark-500 bg-dark-700"
                />
                <span className="ml-2 text-sm text-dark-300">Hybrid</span>
              </label>
            </div>
          </div>

          <div className="pt-2">
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 size={16} className="animate-spin" />
                  Initiating...
                </span>
              ) : (
                'Start Quick Scan'
              )}
            </Button>
          </div>

          <div className="text-center">
            <Link to="/scan" className="text-xs text-primary-500 hover:text-primary-400">
              Advanced scan options →
            </Link>
          </div>
        </div>
      </form>
    </Card>
  );
}