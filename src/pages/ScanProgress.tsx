import React from 'react';
import { PageContainer } from '../components/layout/PageContainer';
import { ScanProgressPanel } from '../components/scan/ScanProgressPanel';
import { useParams, useNavigate } from 'react-router-dom';

export function ScanProgress() {
  const { scanId } = useParams();
  const navigate = useNavigate();
  
  const handleStop = () => {
    if (confirm('Are you sure you want to stop the scan? This action cannot be undone.')) {
      console.log('Stopping scan');
      navigate('/results');
    }
  };
  
  const handlePause = () => {
    console.log('Pausing scan');
    // In a real app, this would pause the scan on the backend
  };

  return (
    <PageContainer
      title="Scan in Progress"
      description="Real-time monitoring of your security scan"
    >
      <div className="max-w-4xl mx-auto">
        <ScanProgressPanel 
          scanId={scanId || 'new-scan'}
          scanName="Web Application Security Scan"
          onStop={handleStop}
          onPause={handlePause}
        />
      </div>
    </PageContainer>
  );
}