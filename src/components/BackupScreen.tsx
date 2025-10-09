// Comprehensive Backup & Restore Screen
import React, { useState, useEffect } from 'react';
import { ArrowLeft, Download, Upload, Share2, QrCode, Settings, Shield, Clock, HardDrive, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import backupService, { BackupData, BackupOptions } from '@/services/backupService';
import languageService from '@/services/languageService';

interface BackupScreenProps {
  onBack: () => void;
}

const BackupScreen: React.FC<BackupScreenProps> = ({ onBack }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [backupProgress, setBackupProgress] = useState(0);
  const [backupStats, setBackupStats] = useState<any>(null);
  const [backupOptions, setBackupOptions] = useState<BackupOptions>({
    includeOrders: true,
    includeMenu: true,
    includeInventory: true,
    includeExpenses: true,
    includeCashBalance: true,
    includeSettings: true,
    includeWhatsApp: true,
    includeSubscription: false,
    compress: true,
    encrypt: false
  });
  const [qrCodeData, setQrCodeData] = useState<string>('');
  const [showQR, setShowQR] = useState(false);
  const { toast } = useToast();

  const t = (key: string) => languageService.translate(key);

  useEffect(() => {
    loadBackupStats();
  }, []);

  const loadBackupStats = async () => {
    try {
      const stats = await backupService.getBackupStats();
      setBackupStats(stats);
    } catch (error) {
      console.error('Failed to load backup stats:', error);
    }
  };

  const handleCreateBackup = async () => {
    setIsLoading(true);
    setBackupProgress(0);
    
    try {
      // Simulate progress
      setBackupProgress(20);
      
      const backup = await backupService.createBackup(backupOptions);
      setBackupProgress(60);
      
      const fileName = await backupService.exportBackupToFile(backup, backupOptions);
      setBackupProgress(100);
      
      toast({
        title: t('backup_created'),
        description: t('backup_saved_successfully') + ': ' + fileName,
        className: 'bg-gradient-to-r from-green-400 to-teal-500 text-white shadow-lg rounded-lg'
      });
      
      await loadBackupStats();
    } catch (error) {
      console.error('Backup creation failed:', error);
      toast({
        title: t('backup_failed'),
        description: t('backup_creation_error'),
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
      setBackupProgress(0);
    }
  };

  const handleGenerateQR = async () => {
    setIsLoading(true);
    
    try {
      const backup = await backupService.createBackup({
        includeOrders: false,
        includeMenu: false,
        includeInventory: false,
        includeExpenses: false,
        includeCashBalance: false,
        includeSettings: true,
        includeWhatsApp: true,
        includeSubscription: false,
        compress: true,
        encrypt: false
      });
      
      const qrData = await backupService.generateBackupQR(backup);
      setQrCodeData(qrData);
      setShowQR(true);
      
      toast({
        title: t('qr_code_generated'),
        description: t('qr_code_contains_settings'),
        className: 'bg-gradient-to-r from-blue-400 to-purple-500 text-white shadow-lg rounded-lg'
      });
    } catch (error) {
      console.error('QR generation failed:', error);
      toast({
        title: t('qr_generation_failed'),
        description: t('qr_generation_error'),
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleShareBackup = async () => {
    setIsLoading(true);
    
    try {
      const backup = await backupService.createBackup(backupOptions);
      await backupService.shareBackup(backup);
      
      toast({
        title: t('backup_shared'),
        description: t('backup_shared_successfully'),
        className: 'bg-gradient-to-r from-green-400 to-teal-500 text-white shadow-lg rounded-lg'
      });
    } catch (error) {
      console.error('Backup sharing failed:', error);
      toast({
        title: t('sharing_failed'),
        description: t('backup_sharing_error'),
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileRestore = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    setBackupProgress(0);
    
    try {
      const fileContent = await file.text();
      setBackupProgress(30);
      
      let backup: BackupData;
      try {
        backup = JSON.parse(fileContent);
      } catch {
        // Try decompressing
        const decompressed = require('lz-string').decompress(fileContent);
        backup = JSON.parse(decompressed);
      }
      
      setBackupProgress(60);
      
      await backupService.restoreFromBackup(backup, backupOptions);
      setBackupProgress(100);
      
      toast({
        title: t('restore_successful'),
        description: t('data_restored_successfully'),
        className: 'bg-gradient-to-r from-green-400 to-teal-500 text-white shadow-lg rounded-lg'
      });
      
      await loadBackupStats();
    } catch (error) {
      console.error('Restore failed:', error);
      toast({
        title: t('restore_failed'),
        description: t('restore_error'),
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
      setBackupProgress(0);
      // Reset file input
      event.target.value = '';
    }
  };

  const handleAutoBackupToggle = async (enabled: boolean) => {
    try {
      await backupService.saveAppSettings({ autoBackup: enabled });
      await loadBackupStats();
      
      toast({
        title: t('settings_updated'),
        description: enabled ? t('auto_backup_enabled') : t('auto_backup_disabled'),
        className: 'bg-gradient-to-r from-blue-400 to-purple-500 text-white shadow-lg rounded-lg'
      });
    } catch (error) {
      console.error('Failed to update auto backup setting:', error);
      toast({
        title: t('error'),
        description: t('failed_to_update_settings'),
        variant: 'destructive'
      });
    }
  };

  const handleBackupFrequencyChange = async (frequency: string) => {
    try {
      await backupService.saveAppSettings({ 
        backupFrequency: frequency as 'daily' | 'weekly' | 'monthly' 
      });
      await loadBackupStats();
      
      toast({
        title: t('settings_updated'),
        description: t('backup_frequency_updated'),
        className: 'bg-gradient-to-r from-blue-400 to-purple-500 text-white shadow-lg rounded-lg'
      });
    } catch (error) {
      console.error('Failed to update backup frequency:', error);
      toast({
        title: t('error'),
        description: t('failed_to_update_settings'),
        variant: 'destructive'
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#ffffff] via-[#f8f9fa] to-[#e9ecef] dark:from-[#1A1A2E] dark:via-[#16213E] dark:to-[#0F3460] p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="mr-4 p-2"
          >
            <ArrowLeft size={20} />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
              {t('backup_and_restore')}
            </h1>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              {t('manage_your_data_backups')}
            </p>
          </div>
        </div>

        {/* Progress Bar */}
        {isLoading && backupProgress > 0 && (
          <Card className="p-4 mb-6 bg-white/80 dark:bg-gray-800/80">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>{t('processing')}</span>
                <span>{backupProgress}%</span>
              </div>
              <Progress value={backupProgress} className="w-full" />
            </div>
          </Card>
        )}

        <Tabs defaultValue="backup" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="backup">{t('create_backup')}</TabsTrigger>
            <TabsTrigger value="restore">{t('restore_data')}</TabsTrigger>
            <TabsTrigger value="settings">{t('backup_settings')}</TabsTrigger>
          </TabsList>

          {/* Create Backup Tab */}
          <TabsContent value="backup" className="space-y-6">
            {/* Backup Statistics */}
            {backupStats && (
              <Card className="p-6 bg-white/80 dark:bg-gray-800/80 backdrop-blur-md">
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <HardDrive size={20} className="mr-2" />
                  {t('backup_statistics')}
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      {backupStats.lastBackup ? new Date(backupStats.lastBackup).toLocaleDateString() : t('never')}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">{t('last_backup')}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {backupStats.autoBackupEnabled ? t('enabled') : t('disabled')}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">{t('auto_backup')}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                      {t(backupStats.backupFrequency)}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">{t('frequency')}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                      {backupStats.totalBackups}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">{t('total_backups')}</div>
                  </div>
                </div>
              </Card>
            )}

            {/* Backup Options */}
            <Card className="p-6 bg-white/80 dark:bg-gray-800/80 backdrop-blur-md">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <Settings size={20} className="mr-2" />
                {t('backup_options')}
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Object.entries(backupOptions).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between">
                    <label className="text-sm font-medium">
                      {t(key.replace(/([A-Z])/g, '_$1').toLowerCase())}
                    </label>
                    <Switch
                      checked={value}
                      onCheckedChange={(checked) => 
                        setBackupOptions(prev => ({ ...prev, [key]: checked }))
                      }
                    />
                  </div>
                ))}
              </div>
            </Card>

            {/* Backup Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button
                onClick={handleCreateBackup}
                disabled={isLoading}
                className="h-20 flex flex-col items-center justify-center bg-gradient-to-r from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700 text-white"
              >
                <Download size={24} className="mb-2" />
                <span>{t('create_full_backup')}</span>
              </Button>

              <Button
                onClick={handleGenerateQR}
                disabled={isLoading}
                variant="outline"
                className="h-20 flex flex-col items-center justify-center"
              >
                <QrCode size={24} className="mb-2" />
                <span>{t('generate_qr_backup')}</span>
              </Button>

              <Button
                onClick={handleShareBackup}
                disabled={isLoading}
                variant="outline"
                className="h-20 flex flex-col items-center justify-center"
              >
                <Share2 size={24} className="mb-2" />
                <span>{t('share_backup')}</span>
              </Button>
            </div>

            {/* QR Code Display */}
            {showQR && qrCodeData && (
              <Card className="p-6 bg-white/80 dark:bg-gray-800/80 backdrop-blur-md text-center">
                <h3 className="text-lg font-semibold mb-4">{t('settings_qr_code')}</h3>
                <div className="flex justify-center mb-4">
                  <img src={qrCodeData} alt="Backup QR Code" className="max-w-xs" />
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  {t('qr_code_instructions')}
                </p>
                <Button
                  onClick={() => setShowQR(false)}
                  variant="outline"
                >
                  {t('close')}
                </Button>
              </Card>
            )}
          </TabsContent>

          {/* Restore Data Tab */}
          <TabsContent value="restore" className="space-y-6">
            <Card className="p-6 bg-white/80 dark:bg-gray-800/80 backdrop-blur-md">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <Upload size={20} className="mr-2" />
                {t('restore_from_backup')}
              </h3>
              
              <div className="space-y-4">
                <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center">
                  <Upload size={48} className="mx-auto mb-4 text-gray-400" />
                  <h4 className="text-lg font-medium mb-2">{t('select_backup_file')}</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    {t('choose_json_backup_file')}
                  </p>
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleFileRestore}
                    className="hidden"
                    id="backup-file-input"
                    disabled={isLoading}
                  />
                  <Button
                    onClick={() => document.getElementById('backup-file-input')?.click()}
                    disabled={isLoading}
                    className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white"
                  >
                    {t('choose_file')}
                  </Button>
                </div>

                {/* Restore Options */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t">
                  <h4 className="col-span-full text-md font-medium mb-2">{t('restore_options')}</h4>
                  {Object.entries(backupOptions).filter(([key]) => key.startsWith('include')).map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between">
                      <label className="text-sm font-medium">
                        {t(key.replace(/([A-Z])/g, '_$1').toLowerCase())}
                      </label>
                      <Switch
                        checked={value}
                        onCheckedChange={(checked) => 
                          setBackupOptions(prev => ({ ...prev, [key]: checked }))
                        }
                      />
                    </div>
                  ))}
                </div>
              </div>
            </Card>

            {/* Warning */}
            <Card className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800">
              <div className="flex items-start">
                <Shield size={20} className="text-yellow-600 dark:text-yellow-400 mr-3 mt-0.5" />
                <div>
                  <h4 className="text-sm font-semibold text-yellow-800 dark:text-yellow-200 mb-1">
                    {t('restore_warning')}
                  </h4>
                  <p className="text-xs text-yellow-700 dark:text-yellow-300">
                    {t('restore_warning_message')}
                  </p>
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* Backup Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <Card className="p-6 bg-white/80 dark:bg-gray-800/80 backdrop-blur-md">
              <h3 className="text-lg font-semibold mb-6 flex items-center">
                <Clock size={20} className="mr-2" />
                {t('automatic_backup_settings')}
              </h3>
              
              <div className="space-y-6">
                {/* Auto Backup Toggle */}
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-md font-medium">{t('enable_automatic_backup')}</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {t('auto_backup_description')}
                    </p>
                  </div>
                  <Switch
                    checked={backupStats?.autoBackupEnabled || false}
                    onCheckedChange={handleAutoBackupToggle}
                  />
                </div>

                {/* Backup Frequency */}
                {backupStats?.autoBackupEnabled && (
                  <div>
                    <label className="text-md font-medium block mb-2">
                      {t('backup_frequency')}
                    </label>
                    <Select
                      value={backupStats?.backupFrequency || 'weekly'}
                      onValueChange={handleBackupFrequencyChange}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">{t('daily')}</SelectItem>
                        <SelectItem value="weekly">{t('weekly')}</SelectItem>
                        <SelectItem value="monthly">{t('monthly')}</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {t('backup_frequency_description')}
                    </p>
                  </div>
                )}
              </div>
            </Card>

            {/* Device Migration Guide */}
            <Card className="p-6 bg-white/80 dark:bg-gray-800/80 backdrop-blur-md">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <Smartphone size={20} className="mr-2" />
                {t('device_migration_guide')}
              </h3>
              
              <div className="space-y-4">
                <div className="flex items-start">
                  <div className="bg-blue-100 dark:bg-blue-900/30 rounded-full p-2 mr-4">
                    <span className="text-blue-600 dark:text-blue-400 font-bold text-sm">1</span>
                  </div>
                  <div>
                    <h4 className="font-medium">{t('old_device_step')}</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{t('old_device_description')}</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="bg-green-100 dark:bg-green-900/30 rounded-full p-2 mr-4">
                    <span className="text-green-600 dark:text-green-400 font-bold text-sm">2</span>
                  </div>
                  <div>
                    <h4 className="font-medium">{t('transfer_step')}</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{t('transfer_description')}</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="bg-purple-100 dark:bg-purple-900/30 rounded-full p-2 mr-4">
                    <span className="text-purple-600 dark:text-purple-400 font-bold text-sm">3</span>
                  </div>
                  <div>
                    <h4 className="font-medium">{t('new_device_step')}</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{t('new_device_description')}</p>
                  </div>
                </div>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default BackupScreen;
