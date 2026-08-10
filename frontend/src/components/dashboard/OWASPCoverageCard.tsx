import React, { useEffect, useState } from 'react';
import { Card } from '../ui/Card';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { apiClient } from '../../services/apiClient';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const OWASP_CATEGORIES = [
  'Broken Access Control', 
  'Cryptographic Failures', 
  'Injection', 
  'Insecure Design',
  'Security Misconfiguration',
  'Vulnerable Components',
  'Auth Failures',
  'Software Integrity',
  'Logging Failures',
  'SSRF'
];

export function OWASPCoverageCard() {
  const [coverageCounts, setCoverageCounts] = useState<number[]>([1, 1, 1, 1, 1, 1, 1, 1, 1, 1]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchOwaspMetrics() {
      try {
        const response = await apiClient.get('/scans');
        const scans = response.data || [];
        const categoryMap: Record<string, number> = {
          'Broken Access Control': 0,
          'Cryptographic Failures': 0,
          'Injection': 0,
          'Insecure Design': 0,
          'Security Misconfiguration': 0,
          'Vulnerable Components': 0,
          'Auth Failures': 0,
          'Software Integrity': 0,
          'Logging Failures': 0,
          'SSRF': 0,
        };

        for (const scan of scans) {
          for (const vuln of scan.vulnerabilities || []) {
            const cat = vuln.owasp_category || vuln.vuln_metadata?.owasp || '';
            if (cat.includes('A01') || cat.includes('Access Control')) categoryMap['Broken Access Control'] += 1;
            else if (cat.includes('A02') || cat.includes('Cryptographic')) categoryMap['Cryptographic Failures'] += 1;
            else if (cat.includes('A03') || cat.includes('Injection')) categoryMap['Injection'] += 1;
            else if (cat.includes('A04') || cat.includes('Design')) categoryMap['Insecure Design'] += 1;
            else if (cat.includes('A05') || cat.includes('Misconfiguration')) categoryMap['Security Misconfiguration'] += 1;
            else if (cat.includes('A06') || cat.includes('Components')) categoryMap['Vulnerable Components'] += 1;
            else if (cat.includes('A07') || cat.includes('Authentication')) categoryMap['Auth Failures'] += 1;
            else if (cat.includes('A08') || cat.includes('Integrity')) categoryMap['Software Integrity'] += 1;
            else if (cat.includes('A09') || cat.includes('Logging')) categoryMap['Logging Failures'] += 1;
            else if (cat.includes('A10') || cat.includes('SSRF')) categoryMap['SSRF'] += 1;
          }
        }

        const counts = OWASP_CATEGORIES.map(cat => categoryMap[cat] || 0);
        setCoverageCounts(counts);
      } catch (err) {
        console.error('Failed to calculate OWASP coverage:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchOwaspMetrics();
  }, []);

  const chartData = {
    labels: OWASP_CATEGORIES,
    datasets: [
      {
        label: 'Detected Findings',
        data: coverageCounts,
        backgroundColor: '#3b82f6',
        borderColor: '#2563eb',
        borderWidth: 1,
        borderRadius: 4,
      },
    ],
  };

  const chartOptions = {
    indexAxis: 'y' as const,
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: '#1e293b',
        titleColor: '#f1f5f9',
        bodyColor: '#f1f5f9',
        borderColor: '#334155',
        borderWidth: 1,
      },
    },
    scales: {
      x: {
        grid: {
          color: 'rgba(51, 65, 85, 0.3)',
        },
        ticks: {
          color: '#94a3b8',
          precision: 0,
        },
        beginAtZero: true,
      },
      y: {
        grid: {
          display: false,
        },
        ticks: {
          color: '#94a3b8',
          font: {
            size: 11,
          },
          callback: function(value: any) {
            const label = OWASP_CATEGORIES[value] || '';
            return label.length > 18 ? label.substring(0, 18) + '...' : label;
          },
        },
      },
    },
  };

  return (
    <Card className="h-full">
      <div className="flex flex-col h-full">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-white">OWASP Top 10 Distribution</h3>
          <span className="text-xs px-2.5 py-1 bg-primary-500/20 text-primary-400 rounded-full font-medium">
            Active Rule Protection
          </span>
        </div>

        <div className="flex-grow h-[300px]">
          {loading ? (
            <div className="h-full w-full bg-dark-700/40 animate-pulse rounded-lg" />
          ) : (
            <Bar data={chartData} options={chartOptions} />
          )}
        </div>
      </div>
    </Card>
  );
}