import React from 'react';
import { PageContainer } from '../components/layout/PageContainer';
import { VulnerabilityTable } from '../components/results/VulnerabilityTable';
import { Button } from '../components/ui/Button';
import { Download, FileText, RefreshCw } from 'lucide-react';

export function ScanResults() {
  return (
    <PageContainer
      title="Scan Results"
      description="Detailed findings from your security scan"
      actions={
        <div className="flex gap-2">
          <Button 
            variant="secondary" 
            size="sm"
            icon={<RefreshCw size={16} />}
          >
            Re-scan
          </Button>
          <Button 
            variant="secondary" 
            size="sm"
            icon={<FileText size={16} />}
          >
            Full Report
          </Button>
          <Button 
            variant="primary" 
            size="sm"
            icon={<Download size={16} />}
          >
            Export
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        <VulnerabilityTable />
      </div>
    </PageContainer>
  );
}