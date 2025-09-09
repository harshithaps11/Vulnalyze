import React, { useState } from 'react';
import { Search, Upload, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';

interface ScanConfigurationFormProps {
  onSubmit: (config: any) => void;
}

export function ScanConfigurationForm({ onSubmit }: ScanConfigurationFormProps) {
  const [scanType, setScanType] = useState('dynamic');
  const [url, setUrl] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [excludePaths, setExcludePaths] = useState('');
  const [customPayload, setCustomPayload] = useState('');
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const config = {
      url,
      type: scanType,
      advanced: showAdvanced ? {
        authentication: {
          username,
          password,
        },
        excludePaths: excludePaths.split('\n').filter(Boolean),
        customPayloads: customPayload.split('\n').filter(Boolean),
      } : undefined,
    };
    
    onSubmit(config);
  };

  return (
    <Card>
      <h2 className="text-xl font-semibold text-white mb-6">Scan Configuration</h2>
      
      <form onSubmit={handleSubmit}>
        <div className="space-y-6">
          {/* Target Input */}
          <div>
            <label htmlFor="url" className="block text-sm font-medium text-dark-300 mb-1">
              Target URL
            </label>
            <div className="relative">
              <input
                type="text"
                id="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="input pr-10"
                placeholder="https://example.com"
                required
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <Search size={18} className="text-dark-400" />
              </div>
            </div>
            <p className="mt-1 text-xs text-dark-400">
              Enter the full URL including protocol (https://)
            </p>
          </div>
          
          {/* Upload Code Option */}
          <div className="border border-dashed border-dark-600 rounded-md p-4 text-center">
            <div className="space-y-2">
              <Upload size={24} className="mx-auto text-dark-400" />
              <p className="text-sm text-dark-300">
                Or drag and drop code files here
              </p>
              <p className="text-xs text-dark-400">
                Supported formats: .zip, .tar.gz, or individual files
              </p>
              <button
                type="button"
                className="mt-2 inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-md text-primary-400 border border-primary-700/50 hover:bg-primary-900/30"
              >
                Browse Files
              </button>
            </div>
          </div>
          
          {/* Scan Type Selection */}
          <div>
            <label className="block text-sm font-medium text-dark-300 mb-2">
              Scan Type
            </label>
            <div className="grid grid-cols-3 gap-4">
              <label className={`border rounded-md p-3 cursor-pointer ${scanType === 'static' ? 'bg-primary-900/30 border-primary-700' : 'border-dark-600 hover:bg-dark-700'}`}>
                <input
                  type="radio"
                  name="scanType"
                  value="static"
                  checked={scanType === 'static'}
                  onChange={() => setScanType('static')}
                  className="sr-only"
                />
                <p className="text-sm font-medium text-white mb-1">Static Analysis</p>
                <p className="text-xs text-dark-400">Code review without execution</p>
              </label>
              
              <label className={`border rounded-md p-3 cursor-pointer ${scanType === 'dynamic' ? 'bg-primary-900/30 border-primary-700' : 'border-dark-600 hover:bg-dark-700'}`}>
                <input
                  type="radio"
                  name="scanType"
                  value="dynamic"
                  checked={scanType === 'dynamic'}
                  onChange={() => setScanType('dynamic')}
                  className="sr-only"
                />
                <p className="text-sm font-medium text-white mb-1">Dynamic Analysis</p>
                <p className="text-xs text-dark-400">Runtime behavior testing</p>
              </label>
              
              <label className={`border rounded-md p-3 cursor-pointer ${scanType === 'hybrid' ? 'bg-primary-900/30 border-primary-700' : 'border-dark-600 hover:bg-dark-700'}`}>
                <input
                  type="radio"
                  name="scanType"
                  value="hybrid"
                  checked={scanType === 'hybrid'}
                  onChange={() => setScanType('hybrid')}
                  className="sr-only"
                />
                <p className="text-sm font-medium text-white mb-1">Hybrid</p>
                <p className="text-xs text-dark-400">Combined static & dynamic</p>
              </label>
            </div>
          </div>
          
          {/* Advanced Settings */}
          <div>
            <button
              type="button"
              className="flex items-center text-sm text-dark-300 hover:text-white"
              onClick={() => setShowAdvanced(!showAdvanced)}
            >
              {showAdvanced ? <ChevronUp size={16} className="mr-1" /> : <ChevronDown size={16} className="mr-1" />}
              Advanced Settings
            </button>
            
            {showAdvanced && (
              <div className="mt-4 space-y-4 p-4 border border-dark-700 rounded-md">
                {/* Authentication */}
                <div>
                  <h4 className="text-sm font-medium text-dark-200 mb-2">Authentication</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="username" className="block text-xs text-dark-300 mb-1">
                        Username
                      </label>
                      <input
                        type="text"
                        id="username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="input"
                        placeholder="Username"
                      />
                    </div>
                    <div>
                      <label htmlFor="password" className="block text-xs text-dark-300 mb-1">
                        Password
                      </label>
                      <input
                        type="password"
                        id="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="input"
                        placeholder="Password"
                      />
                    </div>
                  </div>
                </div>
                
                {/* Custom Payload */}
                <div>
                  <label htmlFor="customPayload" className="block text-sm font-medium text-dark-300 mb-1">
                    Custom Payloads (one per line)
                  </label>
                  <textarea
                    id="customPayload"
                    value={customPayload}
                    onChange={(e) => setCustomPayload(e.target.value)}
                    className="input h-24 resize-none"
                    placeholder="' OR 1=1--"
                  ></textarea>
                </div>
                
                {/* Exclude Paths */}
                <div>
                  <label htmlFor="excludePaths" className="block text-sm font-medium text-dark-300 mb-1">
                    Exclude Paths (one per line)
                  </label>
                  <textarea
                    id="excludePaths"
                    value={excludePaths}
                    onChange={(e) => setExcludePaths(e.target.value)}
                    className="input h-24 resize-none"
                    placeholder="/admin/*
/api/internal/*"
                  ></textarea>
                </div>
              </div>
            )}
          </div>
          
          {/* Submit Button */}
          <div className="pt-2">
            <Button type="submit" size="lg" className="w-full">
              Start Scan
            </Button>
          </div>
        </div>
      </form>
    </Card>
  );
}