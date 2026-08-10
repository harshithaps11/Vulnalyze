import React, { useEffect, useState } from 'react';
import { Card } from '../ui/Card';
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { apiClient } from '../../services/apiClient';

// Register Chart.js components
ChartJS.register(ArcElement, Tooltip, Legend);

interface MetricItemProps {
  label: string;
  value: number;
}

function MetricItem({ label, value }: MetricItemProps) {
  return (
    <div className="bg-dark-700/80 p-2.5 rounded-lg border border-dark-600/60 shadow-sm">
      <p className="text-xs text-dark-400 font-medium">{label}</p>
      <div className="flex items-end mt-1">
        <span className="text-xl font-bold text-dark-100">{value}</span>
      </div>
    </div>
  );
}

export function DashboardMetricsCard() {
  const [metrics, setMetrics] = useState({
    total: 0,
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
    info: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchMetrics() {
      try {
        const response = await apiClient.get('/scans');
        const scans = response.data || [];

        const counts = { total: 0, critical: 0, high: 0, medium: 0, low: 0, info: 0 };
        for (const scan of scans) {
          for (const vuln of scan.vulnerabilities || []) {
            const sev = (vuln.severity || 'low').toLowerCase();
            counts.total += 1;
            if (sev in counts) {
              (counts as any)[sev] += 1;
            } else {
              counts.info += 1;
            }
          }
        }
        setMetrics(counts);
      } catch (err) {
        console.error('Failed to fetch scan metrics:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchMetrics();
  }, []);

  const severityDistributionData = {
    labels: ['Critical', 'High', 'Medium', 'Low', 'Info'],
    datasets: [
      {
        label: 'Vulnerabilities',
        data: [metrics.critical, metrics.high, metrics.medium, metrics.low, metrics.info],
        backgroundColor: ['#DC2626', '#EA580C', '#F59E0B', '#10B981', '#3B82F6'],
        borderWidth: 0,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right' as const,
        labels: {
          color: '#94a3b8',
          font: { size: 11 },
          padding: 12,
        },
      },
      tooltip: {
        backgroundColor: '#1e293b',
        titleColor: '#f1f5f9',
        bodyColor: '#f1f5f9',
        borderColor: '#334155',
        borderWidth: 1,
      },
    },
    cutout: '68%',
  };

  if (loading) {
    return (
      <Card className="h-full">
        <div className="flex flex-col h-full animate-pulse space-y-4">
          <div className="h-5 bg-dark-700 rounded w-40" />
          <div className="grid grid-cols-2 gap-3">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-12 bg-dark-700/60 rounded-lg" />
            ))}
          </div>
          <div className="h-44 w-full bg-dark-700/40 rounded-full" />
        </div>
      </Card>
    );
  }

  return (
    <Card className="h-full flex flex-col">
      <div className="flex flex-col h-full">
        <h3 className="text-lg font-semibold text-dark-100 mb-3">Vulnerability Metrics</h3>

        <div className="grid grid-cols-2 gap-2.5 mb-3">
          <MetricItem label="Total Vulns" value={metrics.total} />
          <MetricItem label="Critical" value={metrics.critical} />
          <MetricItem label="High" value={metrics.high} />
          <MetricItem label="Medium" value={metrics.medium} />
        </div>

        <div className="flex-grow min-h-[180px] flex items-center justify-center">
          {metrics.total > 0 ? (
            <div className="h-44 w-full">
              <Doughnut data={severityDistributionData} options={chartOptions} />
            </div>
          ) : (
            <p className="text-dark-400 text-xs text-center py-6">
              No vulnerability data yet. Run a scan to see metrics.
            </p>
          )}
        </div>
      </div>
    </Card>
  );
}