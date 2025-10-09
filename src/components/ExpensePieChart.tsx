import React from 'react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { currencyService } from '../services/currencyService';
import { useLanguageContext } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

interface PieChartData {
  name: string;
  value: number;
}

interface ExpensePieChartProps {
  data: PieChartData[];
}

const COLORS = ['#ff7043', '#ff9f43', '#ff80ab', '#ffab91', '#ffe0b2', '#ffdab9'];

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white/20 dark:bg-gray-800/20 border border-white/10 dark:border-gray-700/30 rounded-xl p-3 backdrop-blur-md text-gray-800 dark:text-gray-100 text-sm">
        <p>{`${payload[0].name}: ${currencyService.formatAmount(payload[0].value)}`}</p>
      </div>
    );
  }
  return null;
};

const CustomLegend = ({ payload }: any) => (
  <div className="flex flex-wrap justify-center gap-2 mt-2">
    {payload.map((entry: any, index: number) => (
      <div
        key={`legend-${index}`}
        className="flex items-center gap-1 text-xs text-gray-700 dark:text-gray-300"
      >
        <div
          className="w-3 h-3 rounded-full"
          style={{ backgroundColor: COLORS[index % COLORS.length] }}
        />
        <span>{entry.value}</span>
      </div>
    ))}
  </div>
);

const ExpensePieChart: React.FC<ExpensePieChartProps> = ({ data }) => {
  const { t } = useLanguageContext();
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-56 text-gray-600 dark:text-gray-400">
        <p>{t('no_expense_data_period')}</p>
      </div>
    );
  }

  return (
    <div
      className="w-full h-56 bg-white/20 dark:bg-gray-800/20 rounded-2xl border border-white/10 dark:border-gray-700/30 p-4 backdrop-blur-md relative overflow-hidden animate-fade-in stat-card"
      aria-label="Expense distribution pie chart"
    >
      <style>
        {`
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .animate-fade-in {
            animation: fadeIn 0.5s ease-out forwards;
          }
          @keyframes shimmer {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(100%); }
          }
          .animate-shimmer {
            animation: shimmer 2s infinite;
          }
          .stat-card {
            position: relative;
            overflow: hidden;
          }
          .stat-card::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 4px;
            background: linear-gradient(90deg, #ff7043, #ff9f43);
            border-radius: 8px 8px 0 0;
          }
          .glass-card {
            background: rgba(255, 255, 255, 0.2);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 16px;
            box-shadow: 0 8px 20px rgba(0, 0, 0, 0.08);
          }
          .dark .glass-card {
            background: rgba(26, 26, 46, 0.4);
            border: 1px solid rgba(255, 255, 255, 0.05);
          }
        `}
      </style>
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 dark:via-gray-700/10 to-transparent animate-shimmer z-0" />
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            outerRadius="80%"
            dataKey="value"
            nameKey="name"
            isAnimationActive={true}
            animationDuration={800}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend content={<CustomLegend />} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ExpensePieChart;