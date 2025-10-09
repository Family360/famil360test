// Privacy & Data Transparency Screen
import React from 'react';
import { Shield, Lock, Database, Eye, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import languageService from '@/services/languageService';
import { cn } from '@/lib/utils';

interface PrivacyScreenProps {
  className?: string;
  onClose?: () => void;
}

const PrivacyScreen: React.FC<PrivacyScreenProps> = ({ className, onClose }) => {
  const t = (key: string) => languageService.translate(key);

  return (
    <div className={cn('glass-card p-5 mb-6 animate-fade-in', className)}>
      <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4 flex items-center">
        <Shield size={20} className="mr-2 text-[#ff7043]" />
        {t('privacy_data_transparency') || 'Privacy & Data Transparency'}
      </h2>

      <div className="space-y-4">
        {/* Main Privacy Statement */}
        <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-800 rounded-xl">
          <div className="flex items-start gap-3">
            <Lock size={24} className="text-green-600 dark:text-green-400 flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-semibold text-green-900 dark:text-green-100 mb-2">
                {t('your_data_is_private') || 'Your Data is 100% Private'}
              </h3>
              <p className="text-sm text-green-800 dark:text-green-200">
                {t('privacy_statement') || 'Your data is stored locally on your device. We do not collect or manage any business data.'}
              </p>
            </div>
          </div>
        </div>

        {/* What We Store Locally */}
        <div>
          <h3 className="font-medium text-gray-800 dark:text-gray-100 mb-3 flex items-center gap-2">
            <Database size={18} className="text-[#ff7043]" />
            {t('what_we_store_locally') || 'What We Store Locally'}
          </h3>
          <div className="space-y-2">
            {[
              { icon: '📦', text: t('orders_and_sales') || 'Orders and sales records' },
              { icon: '🍔', text: t('menu_items') || 'Menu items and prices' },
              { icon: '📊', text: t('inventory_data') || 'Inventory and stock levels' },
              { icon: '💰', text: t('expenses_records') || 'Expense records' },
              { icon: '⚙️', text: t('app_settings') || 'App settings and preferences' },
            ].map((item, idx) => (
              <div key={idx} className="flex items-center gap-3 p-3 bg-white/30 dark:bg-gray-800/30 rounded-lg">
                <span className="text-xl">{item.icon}</span>
                <span className="text-sm text-gray-700 dark:text-gray-300">{item.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* What We Don't Collect */}
        <div>
          <h3 className="font-medium text-gray-800 dark:text-gray-100 mb-3 flex items-center gap-2">
            <Eye size={18} className="text-red-600 dark:text-red-400" />
            {t('what_we_dont_collect') || 'What We Don\'t Collect'}
          </h3>
          <div className="space-y-2">
            {[
              t('no_personal_info') || 'No personal customer information',
              t('no_financial_data') || 'No financial or payment data',
              t('no_location_tracking') || 'No location tracking',
              t('no_analytics') || 'No usage analytics or tracking',
            ].map((text, idx) => (
              <div key={idx} className="flex items-center gap-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <span className="text-red-600 dark:text-red-400 font-bold">✗</span>
                <span className="text-sm text-red-900 dark:text-red-100">{text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Data Security */}
        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl">
          <div className="flex items-start gap-3">
            <AlertCircle size={20} className="text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                {t('data_security') || 'Data Security'}
              </h3>
              <p className="text-sm text-blue-800 dark:text-blue-200">
                {t('data_security_desc') || 'All data is encrypted and stored securely on your device. You have full control over your data through backup and restore features.'}
              </p>
            </div>
          </div>
        </div>

        {onClose && (
          <Button
            onClick={onClose}
            className="w-full bg-gradient-to-r from-[#ff7043] to-[#ff9f43] text-white hover:from-[#ff8a5b] hover:to-[#ffb86c]"
          >
            {t('got_it') || 'Got It'}
          </Button>
        )}
      </div>
    </div>
  );
};

export default PrivacyScreen;
