import React from 'react';
import { Card } from '../ui/Card';
import { owaspCoverageData } from '../../data/mockData';
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

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

export function OWASPCoverageCard() {
  const chartOptions = {
    indexAxis: 'y' as const,
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: '#1e293b', // bg-dark-800
        titleColor: '#f1f5f9', // text-dark-100
        bodyColor: '#f1f5f9', // text-dark-100
        borderColor: '#334155', // border-dark-700
        borderWidth: 1,
      },
    },
    scales: {
      x: {
        grid: {
          color: 'rgba(51, 65, 85, 0.3)', // dark-700 with opacity
        },
        ticks: {
          color: '#94a3b8', // text-dark-400
        },
        max: 100,
      },
      y: {
        grid: {
          display: false,
        },
        ticks: {
          color: '#94a3b8', // text-dark-400
          font: {
            size: 11,
          },
          callback: function(value: any) {
            const label = owaspCoverageData.labels[value];
            // Truncate long labels
            return label.length > 15 ? label.substring(0, 15) + '...' : label;
          }
        },
      },
    },
  };

  return (
    <Card className="h-full">
      <div className="flex flex-col h-full">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-white">OWASP Top 10 Coverage</h3>
          <span className="text-xs px-2 py-1 bg-primary-500/20 text-primary-400 rounded-full">
            78% Avg. Coverage
          </span>
        </div>
        
        <div className="flex-grow h-[300px]">
          <Bar data={owaspCoverageData} options={chartOptions} />
        </div>
      </div>
    </Card>
  );
}