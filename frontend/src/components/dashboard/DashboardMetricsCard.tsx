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
  trend?: 'up' | 'down';
  trendValue?: string;
}

function MetricItem({ label, value, trend, trendValue }: MetricItemProps) {
  return (
    <div>
      <p className="text-sm text-dark-400">{label}</p>
      <div className="flex items-end mt-1">
        <span className="text-2xl font-semibold text-white">{value}</span>
        {trend && trendValue && (
          <span className={`ml-2 text-xs font-medium ${trend === 'up' ? 'text-severity-critical' : 'text-severity-low'}`}>
            {trend === 'up' ? '↑' : '↓'} {trendValue}
          </span>
        )}
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

        // Compute real totals from all scan vulnerabilities
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

  // Build chart data from real metrics
  const severityDistributionData = {
    labels: ['Critical', 'High', 'Medium', 'Low', 'Info'],
    datasets: [
      {
        label: 'Vulnerabilities',
        data: [metrics.critical, metrics.high, metrics.medium, metrics.low, metrics.info],
        backgroundColor: [
          '#DC2626', // Critical - Red
          '#EA580C', // High - Orange
          '#F59E0B', // Medium - Amber
          '#10B981', // Low - Green
          '#3B82F6', // Info - Blue
        ],
        borderWidth: 0,
      },
    ],
  };

  // Chart.js options
  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'right' as const,
        labels: {
          color: '#cbd5e1', // text-dark-300
          font: {
            size: 12,
          },
          padding: 20,
        },
      },
      tooltip: {
        backgroundColor: '#1e293b', // bg-dark-800
        titleColor: '#f1f5f9', // text-dark-100
        bodyColor: '#f1f5f9', // text-dark-100
        borderColor: '#334155', // border-dark-700
        borderWidth: 1,
      },
    },
    cutout: '70%',
  };

  if (loading) {
    return (
      <Card className="h-full">
        <div className="flex flex-col h-full animate-pulse">
          <div className="h-5 bg-dark-700 rounded w-48 mb-4" />
          <div className="grid grid-cols-2 gap-4 mb-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i}>
                <div className="h-3 bg-dark-700 rounded w-24 mb-2" />
                <div className="h-7 bg-dark-700 rounded w-12" />
              </div>
            ))}
          </div>
          <div className="flex-grow flex items-center justify-center">
            <div className="h-56 w-56 bg-dark-700 rounded-full" />
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <div className="flex flex-col h-full">
        <h3 className="text-lg font-semibold text-white mb-4">Vulnerability Metrics</h3>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <MetricItem label="Total Vulnerabilities" value={metrics.total} />
          <MetricItem label="Critical" value={metrics.critical} />
          <MetricItem label="High" value={metrics.high} />
          <MetricItem label="Medium" value={metrics.medium} />
        </div>

        <div className="flex-grow mt-2">
          <div className="h-56 flex items-center justify-center">
            {metrics.total > 0 ? (
              <Doughnut data={severityDistributionData} options={chartOptions} />
            ) : (
              <p className="text-dark-400 text-sm">No vulnerability data yet. Run a scan to see metrics.</p>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}