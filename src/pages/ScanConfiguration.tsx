import React from 'react';
import { PageContainer } from '../components/layout/PageContainer';
import { ScanConfigurationForm } from '../components/scan/ScanConfigurationForm';
import { useNavigate } from 'react-router-dom';

export function ScanConfiguration() {
  const navigate = useNavigate();
  
  const handleSubmit = (config: any) => {
    console.log('Scan configuration:', config);
    // Navigate to the scan progress page
    navigate('/scan/progress/new-scan');
  };

  return (
    <PageContainer
      title="New Security Scan"
      description="Configure the parameters for your security vulnerability scan"
    >
      <div className="max-w-3xl mx-auto">
        <ScanConfigurationForm onSubmit={handleSubmit} />
      </div>
    </PageContainer>
  );
}