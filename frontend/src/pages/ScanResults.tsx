import React, { useEffect, useState } from 'react';
import { PageContainer } from '../components/layout/PageContainer';
import { VulnerabilityTable } from '../components/results/VulnerabilityTable';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Download, FileText, RefreshCw, ShieldAlert, Radar } from 'lucide-react';
import { useParams } from 'react-router-dom';
import { apiClient } from '../services/apiClient';

export function ScanResults() {
  const { scanId } = useParams();
  const [summary, setSummary] = useState<any>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);

  useEffect(() => {
    if (!scanId) {
      setSummary(null);
      return;
    }

    setSummaryLoading(true);
    apiClient.get(`/scans/${scanId}/summary`)
      .then((response) => setSummary(response.data))
      .catch((error) => {
        console.error('Failed to load scan summary:', error);
        setSummary(null);
      })
      .finally(() => setSummaryLoading(false));
  }, [scanId]);

  const handlePrint = () => {
    const reportElement = document.querySelector('.table-container');
    if (!reportElement) {
      alert("Report table not found. Start a scan to generate vulnerabilities first.");
      return;
    }
    
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert("Please allow popups to export the report.");
      return;
    }
    
    printWindow.document.write(`
      <html>
        <head>
          <title>Vulnalyze Security Scan Report - ${scanId || 'Local'}</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
              padding: 40px;
              color: #1f2937;
              background-color: #ffffff;
            }
            h1 {
              font-size: 24px;
              font-weight: 700;
              margin-bottom: 8px;
              color: #111827;
            }
            .meta {
              font-size: 14px;
              color: #4b5563;
              margin-bottom: 24px;
              border-bottom: 1px solid #e5e7eb;
              padding-bottom: 12px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 20px;
            }
            th, td {
              text-align: left;
              padding: 12px;
              border-bottom: 1px solid #e5e7eb;
              font-size: 13px;
            }
            th {
              background-color: #f9fafb;
              font-weight: 600;
              color: #374151;
            }
            .badge {
              display: inline-block;
              padding: 2px 8px;
              font-size: 11px;
              font-weight: 600;
              border-radius: 9999px;
              text-transform: uppercase;
            }
            .critical { background-color: #fee2e2; color: #991b1b; }
            .high { background-color: #ffedd5; color: #9a3412; }
            .medium { background-color: #fef3c7; color: #92400e; }
            .low { background-color: #e0f2fe; color: #075985; }
            .info { background-color: #f3f4f6; color: #374151; }
            /* Hide the actions columns in print */
            th:nth-child(5), td:nth-child(5), th:nth-child(6), td:nth-child(6) {
              display: none;
            }
          </style>
        </head>
        <body>
          <h1>Vulnalyze Security Scan Report</h1>
          <div class="meta">
            <p><strong>Scan ID:</strong> ${scanId || 'Local Sandbox Scan'}</p>
            <p><strong>Generated At:</strong> ${new Date().toLocaleString()}</p>
          </div>
          ${reportElement.outerHTML}
          <script>
            // Style the badges nicely in the printed output
            document.querySelectorAll('tbody tr').forEach(row => {
              const badgeTd = row.children[1];
              if (badgeTd) {
                const txt = badgeTd.textContent.trim().toLowerCase();
                const badgeSpan = document.createElement('span');
                badgeSpan.className = 'badge ' + (txt || 'info');
                badgeSpan.textContent = txt;
                badgeTd.innerHTML = '';
                badgeTd.appendChild(badgeSpan);
              }
            });
            window.onload = function() {
              setTimeout(() => {
                window.print();
                window.close();
              }, 250);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

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
            onClick={() => window.location.reload()}
          >
            Re-scan
          </Button>
          <Button 
            variant="secondary" 
            size="sm"
            icon={<FileText size={16} />}
            onClick={handlePrint}
          >
            Full Report
          </Button>
          <Button 
            variant="primary" 
            size="sm"
            icon={<Download size={16} />}
            onClick={handlePrint}
          >
            Export
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        {scanId && (
          <Card title="Scan Summary" subtitle="A concise view of the latest findings from the backend">
            {summaryLoading ? (
              <p className="text-sm text-dark-400">Loading scan summary...</p>
            ) : summary ? (
              <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-lg border border-dark-700 bg-dark-800/70 p-4">
                  <div className="flex items-center gap-2 text-sm font-medium text-dark-300">
                    <ShieldAlert size={16} className="text-severity-critical" />
                    Total Findings
                  </div>
                  <p className="mt-3 text-3xl font-semibold text-white">{summary.total_vulnerabilities}</p>
                </div>
                <div className="rounded-lg border border-dark-700 bg-dark-800/70 p-4">
                  <div className="flex items-center gap-2 text-sm font-medium text-dark-300">
                    <Radar size={16} className="text-primary-400" />
                    Risk Level
                  </div>
                  <div className="mt-3">
                    <Badge variant={summary.risk_level === 'critical' ? 'critical' : summary.risk_level === 'high' ? 'high' : summary.risk_level === 'medium' ? 'medium' : 'low'}>
                      {summary.risk_level?.toUpperCase()}
                    </Badge>
                  </div>
                </div>
                <div className="rounded-lg border border-dark-700 bg-dark-800/70 p-4">
                  <div className="text-sm font-medium text-dark-300">Severity Breakdown</div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {Object.entries(summary.severity_breakdown || {}).map(([severity, count]) => (
                      <Badge key={severity} variant={severity as any}>
                        {severity}: {count as number}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-sm text-dark-400">The backend did not return a summary for this scan yet.</p>
            )}
          </Card>
        )}
        <VulnerabilityTable scanId={scanId} />
      </div>
    </PageContainer>
  );
}