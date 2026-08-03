import React from 'react';
import { Card } from '../ui/Card';
import { severityDistributionData } from '../../data/mockData';
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';

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

  return (
    <Card className="h-full">
      <div className="flex flex-col h-full">
        <h3 className="text-lg font-semibold text-white mb-4">Vulnerability Metrics</h3>
        
        <div className="grid grid-cols-2 gap-4 mb-6">
          <MetricItem label="Total Vulnerabilities" value={61} trend="down" trendValue="12%" />
          <MetricItem label="Critical" value={3} trend="down" trendValue="2" />
          <MetricItem label="High" value={8} />
          <MetricItem label="Medium" value={15} trend="up" trendValue="3" />
        </div>
        
        <div className="flex-grow mt-2">
          <div className="h-56 flex items-center justify-center">
            <Doughnut data={severityDistributionData} options={chartOptions} />
          </div>
        </div>
      </div>
    </Card>
  );
}