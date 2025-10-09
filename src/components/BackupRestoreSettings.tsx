// Backup & Restore Settings Component with Google Drive Sync
import React, { useState, useEffect } from 'react';
import { Download, Upload, Cloud, HardDrive, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/components/ui/use-toast';
import { backupService } from '@/services/backupService';
import { googleDriveService } from '@/services/googleDriveService';
import { SubscriptionService } from '@/services/subscriptionService';
import languageService from '@/services/languageService';
import { cn } from '@/lib/utils';

interface BackupRestoreSettingsProps {
  className?: string;
}

const BackupRestoreSettings: React.FC<BackupRestoreSettingsProps> = ({ className }) => {
  const { toast } = useToast();
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [googleDriveEnabled, setGoogleDriveEnabled] = useState(false);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [isDriveBusy, setIsDriveBusy] = useState(false);
  const [lastBackup, setLastBackup] = useState<string | undefined>();

  const t = (key: string) => languageService.translate(key);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    loadBackupStats();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  } , []);

  // List backups on Google Drive (premium-only)
  const handleListDriveBackups = async () => {
    try {
      if (!googleDriveService.isSupported()) {
        toast({ title: t('not_supported') || 'Not supported on this platform' });
        return;
      }
      const isActive = await SubscriptionService.isActive();
      if (!isActive) {
        toast({
          title: t('premium_required') || 'Premium required',
          description: t('google_drive_premium_only') || 'Google Drive backup is available for premium users.',
          variant: 'destructive',
        });
        return;
      }
      setIsDriveBusy(true);
      await googleDriveService.ensureAuth(true);
      const files = await googleDriveService.listBackups();
      if (!files.length) {
        toast({ title: t('no_backups_found') || 'No backups found on Google Drive' });
      } else {
        const latest = files[0];
        toast({
          title: t('found_backups') || 'Found backups',
          description: `${files.length} • Latest: ${latest.name}`,
        });
      }
    } catch (e) {
      console.error('List Drive backups failed:', e);
      toast({ title: t('error') || 'Error', description: t('google_drive_list_failed') || 'Failed to list Google Drive backups', variant: 'destructive' });
    } finally {
      setIsDriveBusy(false);
    }
  };

  // Restore most recent backup from Google Drive (premium-only)
  const handleRestoreFromDrive = async () => {
    try {
      if (!googleDriveService.isSupported()) {
        toast({ title: t('not_supported') || 'Not supported on this platform' });
        return;
      }
      const isActive = await SubscriptionService.isActive();
      if (!isActive) {
        toast({
          title: t('premium_required') || 'Premium required',
          description: t('google_drive_premium_only') || 'Google Drive backup is available for premium users.',
          variant: 'destructive',
        });
        return;
      }
      setIsRestoring(true);
      await googleDriveService.ensureAuth(true);
      const files = await googleDriveService.listBackups();
      if (!files.length) {
        toast({ title: t('no_backups_found') || 'No backups found on Google Drive' });
        return;
      }
      const latest = files[0];
      const backup = await googleDriveService.downloadBackup(latest.id);
      await backupService.restoreFromBackup(backup);
      toast({ title: t('restore_success') || 'Restore successful', description: latest.name });
      setTimeout(() => window.location.reload(), 1200);
    } catch (e) {
      console.error('Restore from Drive failed:', e);
      toast({ title: t('restore_failed') || 'Restore failed', description: t('google_drive_restore_failed') || 'Failed to restore from Google Drive', variant: 'destructive' });
    } finally {
      setIsRestoring(false);
    }
  };

  const loadBackupStats = async () => {
    try {
      const stats = await backupService.getBackupStats();
      setLastBackup(stats.lastBackup);
      setGoogleDriveEnabled(false); // Load from settings when implemented
    } catch (error) {
      console.error('Failed to load backup stats:', error);
    }
  };

  const handleExportBackup = async () => {
    setIsBackingUp(true);
    try {
      const backup = await backupService.createBackup();
      await backupService.exportBackupToFile(backup);
      // If Google Drive sync is enabled and supported, upload as well
      if (googleDriveEnabled && isOnline && googleDriveService.isSupported()) {
        try {
          const isActive = await SubscriptionService.isActive();
          if (!isActive) {
            toast({
              title: t('premium_required') || 'Premium required',
              description: t('google_drive_premium_only') || 'Google Drive backup is available for premium users.',
              variant: 'destructive',
            });
          } else {
            await googleDriveService.ensureAuth(true);
            const { name } = await googleDriveService.uploadBackup(backup);
            toast({
              title: t('backup_success') || 'Backup successful',
              description: `${t('backup_success_desc') || 'Your data has been exported successfully'} • ${name}`,
            });
          }
        } catch (driveErr) {
          console.error('Drive upload failed:', driveErr);
          toast({
            title: t('backup_failed') || 'Backup failed',
            description: t('google_drive_upload_failed') || 'Google Drive upload failed. File was saved locally.',
            variant: 'destructive',
          });
        }
      }
      
      toast({
        title: t('backup_success') || 'Backup successful',
        description: t('backup_success_desc') || 'Your data has been exported successfully',
      });

      await loadBackupStats();
    } catch (error) {
      console.error('Backup failed:', error);
      toast({
        title: t('backup_failed') || 'Backup failed',
        description: t('backup_failed_desc') || 'Failed to create backup. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsBackingUp(false);
    }
  };

  const handleImportBackup = async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.onchange = async (e: Event) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      setIsRestoring(true);
      try {
        const text = await file.text();
        const backup = JSON.parse(text);
        
        await backupService.restoreFromBackup(backup);
        
        toast({
          title: t('restore_success') || 'Restore successful',
          description: t('restore_success_desc') || 'Your data has been restored successfully',
        });

        // Reload the page to reflect restored data
        setTimeout(() => window.location.reload(), 1500);
      } catch (error) {
        console.error('Restore failed:', error);
        toast({
          title: t('restore_failed') || 'Restore failed',
          description: t('restore_failed_desc') || 'Failed to restore backup. Please check the file and try again.',
          variant: 'destructive',
        });
      } finally {
        setIsRestoring(false);
      }
    };

    input.click();
  };

  const handleGoogleDriveToggle = (enabled: boolean) => {
    if (enabled && !isOnline) {
      toast({
        title: t('offline_error') || 'Offline',
        description: t('google_drive_requires_internet') || 'Google Drive sync requires an internet connection',
        variant: 'destructive',
      });
      return;
    }

    setGoogleDriveEnabled(enabled);
    if (enabled && googleDriveService.isSupported()) {
      // Pre-request token so the next backup is seamless
      googleDriveService.ensureAuth(true).catch(() => {/* ignore */});
    }
    
    if (enabled) {
      toast({
        title: t('google_drive_enabled') || 'Google Drive enabled',
        description: t('google_drive_enabled_desc') || 'Your data will be synced to Google Drive when online',
      });
    }
  };

  return (
    <div className={cn('glass-card p-5 mb-6 animate-fade-in', className)}>
      <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4 flex items-center">
        <HardDrive size={20} className="mr-2 text-[#ff7043]" />
        {t('backup_restore') || 'Backup & Restore'}
      </h2>

      <div className="space-y-4">
        {/* Last Backup Info */}
        {lastBackup && (
          <div className="p-3 bg-white/30 dark:bg-gray-800/30 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle size={18} className="text-green-600 dark:text-green-400" />
              <div>
                <div className="text-sm font-medium text-gray-800 dark:text-gray-100">
                  {t('last_backup') || 'Last Backup'}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  {new Date(lastBackup).toLocaleString()}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Online Status */}
        <div className="p-3 bg-white/30 dark:bg-gray-800/30 rounded-xl flex items-center gap-2">
          <div className={cn(
            'w-2 h-2 rounded-full',
            isOnline ? 'bg-green-500' : 'bg-red-500'
          )} />
          <span className="text-sm text-gray-700 dark:text-gray-300">
            {isOnline ? (t('online') || 'Online') : (t('offline') || 'Offline')}
          </span>
        </div>

        {/* Export Backup Button */}
        <Button
          variant="outline"
          className="w-full justify-between text-left bg-white/30 dark:bg-gray-800/30 border-white/10 dark:border-gray-700/30 min-h-[44px]"
          onClick={handleExportBackup}
          disabled={isBackingUp}
        >
          <span className="flex items-center gap-2">
            {isBackingUp ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            {t('export_backup') || 'Export Backup'}
          </span>
        </Button>

        {/* Import Backup Button */}
        <Button
          variant="outline"
          className="w-full justify-between text-left bg-white/30 dark:bg-gray-800/30 border-white/10 dark:border-gray-700/30 min-h-[44px]"
          onClick={handleImportBackup}
          disabled={isRestoring}
        >
          <span className="flex items-center gap-2">
            {isRestoring ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Upload className="h-4 w-4" />
            )}
            {t('import_backup') || 'Import Backup'}
          </span>
        </Button>

        {/* List Drive Backups (Premium, Web) */}
        <Button
          variant="outline"
          className="w-full justify-between text-left bg-white/30 dark:bg-gray-800/30 border-white/10 dark:border-gray-700/30 min-h-[44px]"
          onClick={handleListDriveBackups}
          disabled={!isOnline || isDriveBusy}
        >
          <span className="flex items-center gap-2">
            <Cloud className="h-4 w-4" />
            {t('list_drive_backups') || 'List Drive Backups'}
          </span>
        </Button>

        {/* Restore From Drive (Premium, Web) */}
        <Button
          variant="outline"
          className="w-full justify-between text-left bg-white/30 dark:bg-gray-800/30 border-white/10 dark:border-gray-700/30 min-h-[44px]"
          onClick={handleRestoreFromDrive}
          disabled={!isOnline || isRestoring}
        >
          <span className="flex items-center gap-2">
            {isRestoring ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            {t('restore_from_drive') || 'Restore From Drive'}
          </span>
        </Button>

        {/* Google Drive Sync Toggle */}
        <div className="flex items-center justify-between p-3 bg-white/30 dark:bg-gray-800/30 rounded-xl">
          <div className="flex items-center gap-2">
            <Cloud size={20} className={cn(
              'transition-colors',
              googleDriveEnabled && isOnline ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400'
            )} />
            <div>
              <div className="font-medium text-gray-800 dark:text-gray-100">
                {t('google_drive_sync') || 'Google Drive Sync'}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">
                {t('sync_only_when_online') || 'Syncs only when online'}
              </div>
            </div>
          </div>
          <Switch
            checked={googleDriveEnabled}
            onCheckedChange={handleGoogleDriveToggle}
            disabled={!isOnline}
            className="data-[state=checked]:bg-[#ff7043]"
          />
        </div>

        {/* Info Message */}
        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl">
          <div className="flex items-start gap-2">
            <AlertCircle size={16} className="text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
            <div className="text-xs text-blue-800 dark:text-blue-200">
              {t('backup_info') || 'Your backup includes orders, menu items, inventory, expenses, and settings. The file is encrypted for security.'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BackupRestoreSettings;
