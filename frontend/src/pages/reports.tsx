import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { api } from '@/lib/api';
import { VulnerabilityActions } from '@/components/vulnerability/VulnerabilityActions';
import { ExportPDF } from '@/components/vulnerability/ExportPDF';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface Vulnerability {
  id: number;
  title: string;
  description: string;
  severity: string;
  location: string;
  evidence: string;
  is_false_positive:boolean;
  remediation_status?: string;
  remediation_notes?: string;
}

interface Scan {
  id: number;
  name: string;
  organization: {
    id: number;
    name: string;
  };
  vulnerabilities: Vulnerability[];
}

export default function Reports() {
  const router = useRouter();
  const [scans, setScans] = useState<Scan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchScans();
  }, []);

  const fetchScans = async () => {
    try {
      const response = await api.get('/scans');
      setScans(response.data);
    } catch (error) {
      console.error('Error fetching scans:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleVulnerabilityUpdate = () => {
    fetchScans();
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Vulnerability Reports</h1>

      {scans.map((scan) => (
        <div key={scan.id} className="mb-8 bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-2xl font-semibold">{scan.name}</h2>
              <p className="text-gray-600">Organization: {scan.organization.name}</p>
            </div>
            <ExportPDF
              vulnerabilities={scan.vulnerabilities}
              scanName={scan.name}
              organizationName={scan.organization.name}
            />
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Vulnerability
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Severity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {scan.vulnerabilities.map((vulnerability) => (
                  <tr key={vulnerability.id}>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">
                        {vulnerability.title}
                      </div>
                      <div className="text-sm text-gray-500">
                        {vulnerability.description}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge
                        variant={
                          vulnerability.severity === 'high'
                            ? 'destructive'
                            : vulnerability.severity === 'medium'
                            ? 'secondary'
                            : 'default'
                        }
                      >
                        {vulnerability.severity}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      {vulnerability.remediation_status ? (
                        <Badge variant="outline">
                          {vulnerability.remediation_status}
                        </Badge>
                      ) : (
                        <Badge variant="default">Open</Badge>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <VulnerabilityActions
                        vulnerability={vulnerability}
                        onUpdate={handleVulnerabilityUpdate}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );
} 