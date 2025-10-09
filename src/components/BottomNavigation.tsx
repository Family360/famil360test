// src/components/BottomNavigation.tsx
import React from 'react';
import { Home, ShoppingCart, Package, Settings, ReceiptText, BarChart3 } from 'lucide-react';
import { useLanguageContext } from '../contexts/LanguageContext';
import { cn } from '@/lib/utils';

export type AppState = 'dashboard' | 'orders' | 'inventory' | 'expenses' | 'reports' | 'settings';

interface BottomNavigationProps {
  activeTab: AppState;
  onTabChange: (tab: AppState) => void;
}

const BottomNavigation = React.memo(({ activeTab, onTabChange }: BottomNavigationProps) => {
  const { t } = useLanguageContext();

  const tabs = React.useMemo(() => [
    { id: 'dashboard' as AppState, label: t('dashboard'), icon: Home },
    { id: 'orders' as AppState, label: t('orders'), icon: ShoppingCart },
    { id: 'inventory' as AppState, label: t('inventory'), icon: Package },
    { id: 'expenses' as AppState, label: t('expenses'), icon: ReceiptText },
    { id: 'reports' as AppState, label: t('reports'), icon: BarChart3 },
    { id: 'settings' as AppState, label: t('settings'), icon: Settings },
  ], [t]);

  return (
    <>
      <style>
        {`
          @keyframes navPulse {
            0% { transform: scale(1); }
            50% { transform: scale(1.05); }
            100% { transform: scale(1); }
          }
          .bottom-nav-item {
            position: relative;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            touch-action: manipulation;
            min-height: 44px;
            min-width: 44px;
            margin: 0 4px;
          }
          .bottom-nav-item.active::after {
            content: '';
            position: absolute;
            bottom: -6px;
            left: 50%;
            transform: translateX(-50%);
            width: 5px;
            height: 5px;
            background: linear-gradient(135deg, #ff7043, #ff9f43);
            border-radius: 50%;
            box-shadow: 0 0 10px rgba(255, 112, 67, 0.5);
          }
          .bottom-nav-item.active {
            color: #ff7043;
          }
          .bottom-nav-item:hover:not(.active) {
            transform: translateY(-2px);
            color: #ff9f43;
          }
          @media (hover: none) {
            .bottom-nav-item:hover:not(.active) {
              transform: none;
            }
          }
          .animate-pulse-slow {
            animation: navPulse 2s ease-in-out infinite;
          }
          .glass-nav {
            background: rgba(255, 255, 255, 0.25);
            backdrop-filter: blur(20px);
            -webkit-backdrop-filter: blur(20px);
            border: 1px solid rgba(255, 255, 255, 0.18);
          }
          .dark .glass-nav {
            background: rgba(26, 26, 46, 0.6);
            border: 1px solid rgba(255, 255, 255, 0.1);
          }
          .nav-icon-container {
            transition: all 0.3s ease;
          }
          .bottom-nav-item.active .nav-icon-container {
            background: linear-gradient(135deg, rgba(255, 112, 67, 0.2), rgba(255, 159, 67, 0.2));
            transform: scale(1.1);
          }
          .bottom-nav-safe-area {
            padding-bottom: 0.5rem;
            padding-bottom: max(0.5rem, env(safe-area-inset-bottom));
          }
        `}
      </style>

      <div className="h-20 md:h-24" />

      <nav className="fixed bottom-0 left-0 right-0 glass-nav border-t border-white/10 dark:border-gray-700/30 p-2 flex justify-around items-center shadow-2xl z-50 bottom-nav-safe-area">
        <div className="flex justify-evenly items-center w-full max-w-md mx-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => {
                  console.log(`Switching to tab: ${tab.id}`);
                  onTabChange(tab.id);
                }}
                className={cn(
                  'bottom-nav-item flex flex-col items-center py-2 px-2 sm:px-3 rounded-xl transition-all duration-300',
                  'min-w-[60px] sm:min-w-[70px] glass-nav',
                  isActive
                    ? 'text-[#ff7043] bg-gradient-to-b from-white/40 to-white/20 dark:from-gray-800/40 dark:to-gray-900/20 shadow-md animate-pulse-slow'
                    : 'text-gray-600 dark:text-gray-400 hover:text-[#ff9f43] dark:hover:text-[#ffb86c] hover:bg-white/10 dark:hover:bg-gray-800/20'
                )}
                aria-label={tab.label}
                aria-current={isActive ? 'page' : undefined}
              >
                <div
                  className={cn(
                    'nav-icon-container p-1.5 rounded-lg mb-1 transition-all duration-300',
                    isActive
                      ? 'bg-gradient-to-br from-[#ff7043]/20 to-[#ff9f43]/20'
                      : 'bg-white/20 dark:bg-gray-800/20'
                  )}
                >
                  <Icon
                    size={20}
                    className={isActive ? 'text-[#ff7043]' : 'text-current'}
                    strokeWidth={isActive ? 2.5 : 2}
                  />
                </div>
                <span className="text-[11px] xs:text-xs font-medium leading-tight text-center px-1">
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
});

BottomNavigation.displayName = 'BottomNavigation';

export default BottomNavigation;