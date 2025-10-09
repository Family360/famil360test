import React, { memo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useLanguageContext } from '@/contexts/LanguageContext';
import { SUPPORTED_LANGUAGES } from '@/services/languageService';

import { cn } from '@/lib/utils';

interface ExpenseData {
  date: string;
  total: number;
}

interface ExpensesChartProps {
  data: ExpenseData[];
}

const CustomTooltip = ({ active, payload, label, t, currentLang }: any) => {
  if (active && payload && payload.length) {
    return (
      <div
        className="bg-white/20 dark:bg-gray-800/20 border border-white/10 dark:border-gray-700/30 rounded-xl p-3 backdrop-blur-md text-gray-800 dark:text-gray-100 text-sm shadow-md"
        dir={currentLang.rtl ? 'rtl' : 'ltr'}
        role="tooltip"
      >
        <p className="font-medium">{t('Date')}: {label}</p>
        <p className="text-[#ff7043] dark:text-[#ffb86c]">
          {t('Total')}: {payload[0].value.toFixed(2)}
        </p>
      </div>
    );
  }
  return null;
};

const ExpensesChart: React.FC<ExpensesChartProps> = ({ data }) => {
  const { t, currentLanguageInfo } = useLanguageContext();
  const currentLang = currentLanguageInfo || SUPPORTED_LANGUAGES[0];

  // Validate data
  const isValidData = data && Array.isArray(data) && data.every(item => typeof item.date === 'string' && typeof item.total === 'number' && item.total >= 0);

  if (!isValidData || data.length === 0) {
    return (
      <div
        className="w-full h-[200px] sm:h-[300px] flex items-center justify-center bg-white/20 dark:bg-gray-800/20 rounded-2xl border border-white/10 dark:border-gray-700/30 backdrop-blur-md relative overflow-hidden animate-fade-in stat-card"
        dir={currentLang.rtl ? 'rtl' : 'ltr'}
        role="alert"
        aria-live="polite"
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
        <p className="text-sm text-gray-600 dark:text-gray-400">{t('No data available')}</p>
      </div>
    );
  }

  return (
    <div
      className="w-full h-[200px] sm:h-[300px] bg-white/20 dark:bg-gray-800/20 rounded-2xl border border-white/10 dark:border-gray-700/30 p-4 backdrop-blur-md relative overflow-hidden animate-fade-in stat-card"
      dir={currentLang.rtl ? 'rtl' : 'ltr'}
      role="figure"
      aria-label={t('Expenses over time')}
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
        `}
      </style>
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 dark:via-gray-700/10 to-transparent animate-shimmer z-0" />
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 12, right: 20, left: currentLang.rtl ? 20 : 8, bottom: 12 }}
        >
          <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200/50 dark:stroke-gray-700/50" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 12, fill: 'currentColor' }}
            className="text-gray-600 dark:text-gray-300"
            reversed={currentLang.rtl}
          />
          <YAxis
            tick={{ fontSize: 12, fill: 'currentColor' }}
            className="text-gray-600 dark:text-gray-300"
            orientation={currentLang.rtl ? 'right' : 'left'}
          />
          <Tooltip content={<CustomTooltip t={t} currentLang={currentLang} />} />
          <Bar
            dataKey="total"
            fill="url(#barGradient)"
            radius={[6, 6, 0, 0]}
            isAnimationActive={true}
            animationDuration={800}
          />
          <defs>
            <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ff7043" />
              <stop offset="100%" stopColor="#ff9f43" />
            </linearGradient>
          </defs>
        </BarChart>
      </ResponsiveContainer>
      <table className="sr-only" aria-hidden="false">
        <caption>{t('Expenses over time')}</caption>
        <thead>
          <tr>
            <th>{t('Date')}</th>
            <th>{t('Total')}</th>
          </tr>
        </thead>
        <tbody>
          {data.map((item, index) => (
            <tr key={index}>
              <td>{item.date}</td>
              <td>{item.total.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default memo(ExpensesChart);