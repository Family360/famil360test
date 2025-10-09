// src/components/InventoryAlerts.tsx
// Real-time inventory alerts component with notification management

import React, { useState, useEffect } from 'react';
import { Bell, AlertTriangle, Package, Clock, CheckCircle, X, Volume2, VolumeX, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { inventoryAlertService, type InventoryAlert, type InventoryAlertSettings } from '@/services/inventoryAlertService';
import { useLanguageContext } from '@/contexts/LanguageContext';

interface InventoryAlertsProps {
  className?: string;
  compact?: boolean;
}

const InventoryAlerts: React.FC<InventoryAlertsProps> = ({ className, compact = false }) => {
  const { t } = useLanguageContext();
  const [alerts, setAlerts] = useState<InventoryAlert[]>([]);
  const [settings, setSettings] = useState<InventoryAlertSettings>(inventoryAlertService.getSettings());
  const [showSettings, setShowSettings] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    // Load initial alerts and settings
    setAlerts(inventoryAlertService.getAlerts());
    setUnreadCount(inventoryAlertService.getActiveAlerts().length);

    // Subscribe to alert changes
    const unsubscribe = inventoryAlertService.onAlertsChange((newAlerts) => {
      setAlerts(newAlerts);
      setUnreadCount(newAlerts.filter(alert => !alert.resolved && !alert.acknowledged).length);
    });

    return unsubscribe;
  }, []);

  const handleAcknowledge = (alertId: string) => {
    inventoryAlertService.acknowledgeAlert(alertId);
  };

  const handleResolve = (alertId: string) => {
    inventoryAlertService.resolveAlert(alertId);
  };

  const handleResolveAll = () => {
    inventoryAlertService.resolveAllAlerts();
  };

  const handleSettingsChange = (key: keyof InventoryAlertSettings, value: any) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    inventoryAlertService.updateSettings({ [key]: value });
  };

  const getSeverityColor = (severity: InventoryAlert['severity']) => {
    switch (severity) {
      case 'critical': return 'text-red-600 bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400';
      case 'high': return 'text-orange-600 bg-orange-50 border-orange-200 dark:bg-orange-900/20 dark:border-orange-800 dark:text-orange-400';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800 dark:text-yellow-400';
      case 'low': return 'text-blue-600 bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-400';
    }
  };

  const getSeverityIcon = (type: InventoryAlert['type']) => {
    switch (type) {
      case 'out_of_stock': return <AlertTriangle size={16} />;
      case 'low_stock': return <Package size={16} />;
      case 'expiring_soon':
      case 'expired': return <Clock size={16} />;
      case 'overstock': return <Package size={16} />;
    }
  };

  const activeAlerts = alerts.filter(alert => !alert.resolved);
  const criticalAlerts = activeAlerts.filter(alert => alert.severity === 'critical');

  if (compact) {
    return (
      <div className={cn('relative', className)}>
        <Button variant="ghost" size="icon" className="relative">
          <Bell size={20} />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </div>
    );
  }

  return (
    <Card className={cn('w-full', className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell size={20} className="text-orange-500" />
            <CardTitle className="text-lg">{t('inventory_alerts')}</CardTitle>
            {unreadCount > 0 && (
              <Badge variant="destructive" className="ml-2">
                {unreadCount} active
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => inventoryAlertService.checkNow()}
            >
              {t('check_now')}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowSettings(!showSettings)}
            >
              <Settings size={16} />
            </Button>
          </div>
        </div>
        {criticalAlerts.length > 0 && (
          <CardDescription className="text-red-600 dark:text-red-400">
            ⚠️ {criticalAlerts.length} critical alert{criticalAlerts.length !== 1 ? 's' : ''} require immediate attention
          </CardDescription>
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        {showSettings && (
          <Card className="bg-gray-50 dark:bg-gray-800/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Alert Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Low Stock Threshold (%)</label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={settings.lowStockThreshold}
                    onChange={(e) => handleSettingsChange('lowStockThreshold', parseInt(e.target.value))}
                    className="w-full px-3 py-2 border rounded-md text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Expiry Warning (days)</label>
                  <input
                    type="number"
                    min="1"
                    max="30"
                    value={settings.expiryWarningDays}
                    onChange={(e) => handleSettingsChange('expiryWarningDays', parseInt(e.target.value))}
                    className="w-full px-3 py-2 border rounded-md text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Check Interval (minutes)</label>
                  <input
                    type="number"
                    min="1"
                    max="60"
                    value={settings.checkIntervalMinutes}
                    onChange={(e) => handleSettingsChange('checkIntervalMinutes', parseInt(e.target.value))}
                    className="w-full px-3 py-2 border rounded-md text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Overstock Threshold (%)</label>
                  <input
                    type="number"
                    min="100"
                    max="300"
                    value={settings.overstockThreshold}
                    onChange={(e) => handleSettingsChange('overstockThreshold', parseInt(e.target.value))}
                    className="w-full px-3 py-2 border rounded-md text-sm"
                  />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={settings.enableNotifications}
                    onCheckedChange={(checked) => handleSettingsChange('enableNotifications', checked)}
                  />
                  <span className="text-sm">Enable Notifications</span>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={settings.enableSound}
                    onCheckedChange={(checked) => handleSettingsChange('enableSound', checked)}
                  />
                  <span className="text-sm">Sound Alerts</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {activeAlerts.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <CheckCircle size={48} className="mx-auto mb-4 opacity-50" />
            <p className="text-sm font-medium">{t('inventory_levels_healthy')}</p>
            <p className="text-xs">{t('no_alerts_at_this_time')}</p>
          </div>
        ) : (
          <>
            {unreadCount > 0 && (
              <div className="flex justify-between items-center p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
                <span className="text-sm text-orange-800 dark:text-orange-200">
                  {unreadCount} new alert{unreadCount !== 1 ? 's' : ''} waiting for attention
                </span>
                <Button size="sm" variant="outline" onClick={handleResolveAll}>
                  Resolve All
                </Button>
              </div>
            )}

            <div className="space-y-3 max-h-96 overflow-y-auto">
              {activeAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className={cn(
                    'p-4 rounded-lg border transition-all duration-200',
                    getSeverityColor(alert.severity),
                    !alert.acknowledged && 'ring-2 ring-offset-2 ring-current'
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1">
                      <div className="mt-0.5">
                        {getSeverityIcon(alert.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-sm capitalize">
                            {alert.type.replace('_', ' ')}
                          </span>
                          <Badge variant="outline" className="text-xs">
                            {alert.severity}
                          </Badge>
                        </div>
                        <p className="text-sm mb-2">{alert.message}</p>
                        <p className="text-xs opacity-70">
                          {new Date(alert.timestamp).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {!alert.acknowledged && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleAcknowledge(alert.id)}
                        >
                          Acknowledge
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleResolve(alert.id)}
                      >
                        <X size={16} />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default InventoryAlerts;
