// Animated Chart Components - Data Visualization (2025 Trend)
import React, { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface ChartData {
  label: string;
  value: number;
  color?: string;
}

// Animated Bar Chart
export const AnimatedBarChart: React.FC<{
  data: ChartData[];
  height?: number;
  showValues?: boolean;
  className?: string;
}> = ({ data, height = 200, showValues = true, className }) => {
  const [animatedData, setAnimatedData] = useState<ChartData[]>(
    data.map((item) => ({ ...item, value: 0 }))
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedData(data);
    }, 100);
    return () => clearTimeout(timer);
  }, [data]);

  const maxValue = Math.max(...data.map((item) => item.value));

  return (
    <div className={cn('space-y-3', className)}>
      {animatedData.map((item, index) => {
        const percentage = (item.value / maxValue) * 100;
        const color = item.color || '#ff7043';

        return (
          <div key={index} className="space-y-1">
            <div className="flex justify-between items-center text-sm">
              <span className="font-medium text-gray-700 dark:text-gray-300">
                {item.label}
              </span>
              {showValues && (
                <span className="font-bold text-gray-900 dark:text-gray-100">
                  {item.value.toLocaleString()}
                </span>
              )}
            </div>
            <div className="relative h-8 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className="absolute inset-y-0 left-0 rounded-full transition-all duration-1000 ease-out"
                style={{
                  width: `${percentage}%`,
                  background: `linear-gradient(90deg, ${color}, ${color}dd)`,
                }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

// Animated Line Chart (Simple)
export const AnimatedLineChart: React.FC<{
  data: number[];
  labels?: string[];
  color?: string;
  height?: number;
  className?: string;
}> = ({ data, labels, color = '#ff7043', height = 150, className }) => {
  const [animatedData, setAnimatedData] = useState<number[]>(data.map(() => 0));

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedData(data);
    }, 100);
    return () => clearTimeout(timer);
  }, [data]);

  const maxValue = Math.max(...data);
  const points = animatedData
    .map((value, index) => {
      const x = (index / (data.length - 1)) * 100;
      const y = 100 - (value / maxValue) * 100;
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <div className={cn('relative', className)} style={{ height }}>
      <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
        {/* Grid Lines */}
        {[0, 25, 50, 75, 100].map((y) => (
          <line
            key={y}
            x1="0"
            y1={y}
            x2="100"
            y2={y}
            stroke="currentColor"
            strokeWidth="0.2"
            className="text-gray-300 dark:text-gray-600"
          />
        ))}

        {/* Area under line */}
        <polygon
          points={`0,100 ${points} 100,100`}
          fill={color}
          fillOpacity="0.2"
          className="transition-all duration-1000 ease-out"
        />

        {/* Line */}
        <polyline
          points={points}
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="transition-all duration-1000 ease-out"
        />

        {/* Data Points */}
        {animatedData.map((value, index) => {
          const x = (index / (data.length - 1)) * 100;
          const y = 100 - (value / maxValue) * 100;
          return (
            <circle
              key={index}
              cx={x}
              cy={y}
              r="2"
              fill={color}
              className="transition-all duration-1000 ease-out"
            />
          );
        })}
      </svg>

      {/* Labels */}
      {labels && (
        <div className="flex justify-between mt-2 text-xs text-gray-600 dark:text-gray-400">
          {labels.map((label, index) => (
            <span key={index}>{label}</span>
          ))}
        </div>
      )}
    </div>
  );
};

// Animated Donut Chart
export const AnimatedDonutChart: React.FC<{
  data: ChartData[];
  size?: number;
  thickness?: number;
  showLegend?: boolean;
  className?: string;
}> = ({ data, size = 200, thickness = 30, showLegend = true, className }) => {
  const [animatedProgress, setAnimatedProgress] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedProgress(100);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  const total = data.reduce((sum, item) => sum + item.value, 0);
  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;

  let currentAngle = -90; // Start from top

  return (
    <div className={cn('flex flex-col items-center gap-4', className)}>
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background Circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={thickness}
          className="text-gray-200 dark:text-gray-700"
        />

        {/* Data Segments */}
        {data.map((item, index) => {
          const percentage = (item.value / total) * 100;
          const segmentLength = (circumference * percentage) / 100;
          const offset = circumference - (segmentLength * animatedProgress) / 100;
          const color = item.color || `hsl(${(index * 360) / data.length}, 70%, 60%)`;

          const segment = (
            <circle
              key={index}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={color}
              strokeWidth={thickness}
              strokeDasharray={`${segmentLength} ${circumference}`}
              strokeDashoffset={offset}
              transform={`rotate(${currentAngle} ${size / 2} ${size / 2})`}
              className="transition-all duration-1000 ease-out"
            />
          );

          currentAngle += (percentage * 360) / 100;
          return segment;
        })}

        {/* Center Text */}
        <text
          x={size / 2}
          y={size / 2}
          textAnchor="middle"
          dominantBaseline="middle"
          className="text-2xl font-bold fill-current text-gray-900 dark:text-gray-100"
          transform={`rotate(90 ${size / 2} ${size / 2})`}
        >
          {total}
        </text>
      </svg>

      {/* Legend */}
      {showLegend && (
        <div className="grid grid-cols-2 gap-2 w-full">
          {data.map((item, index) => {
            const color = item.color || `hsl(${(index * 360) / data.length}, 70%, 60%)`;
            const percentage = ((item.value / total) * 100).toFixed(1);

            return (
              <div key={index} className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: color }}
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  {item.label} ({percentage}%)
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// Animated Progress Ring
export const AnimatedProgressRing: React.FC<{
  value: number;
  max?: number;
  size?: number;
  thickness?: number;
  color?: string;
  label?: string;
  className?: string;
}> = ({
  value,
  max = 100,
  size = 120,
  thickness = 12,
  color = '#ff7043',
  label,
  className,
}) => {
  const [animatedValue, setAnimatedValue] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedValue(value);
    }, 100);
    return () => clearTimeout(timer);
  }, [value]);

  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;
  const percentage = (animatedValue / max) * 100;
  const offset = circumference - (circumference * percentage) / 100;

  return (
    <div className={cn('relative inline-flex items-center justify-center', className)}>
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background Circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={thickness}
          className="text-gray-200 dark:text-gray-700"
        />

        {/* Progress Circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={thickness}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-out"
        />
      </svg>

      {/* Center Content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          {Math.round(percentage)}%
        </span>
        {label && (
          <span className="text-xs text-gray-600 dark:text-gray-400">{label}</span>
        )}
      </div>
    </div>
  );
};

export default AnimatedBarChart;
