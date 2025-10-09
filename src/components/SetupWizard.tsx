// First-Time Setup Wizard with Backup Restore Option
import React, { useState, useEffect } from 'react';
import { ArrowRight, ArrowLeft, Upload, Smartphone, Settings, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { Progress } from '@/components/ui/progress';
import backupService, { BackupData, UserProfile } from '@/services/backupService';
import whatsAppService from '@/services/whatsAppService';
import { COUNTRY_CODES } from '@/data/countryCodes';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import languageService from '@/services/languageService';

interface SetupWizardProps {
  onComplete: (hasRestoredData: boolean) => void;
}

type SetupStep = 'welcome' | 'restore' | 'profile' | 'whatsapp' | 'complete';

const SetupWizard: React.FC<SetupWizardProps> = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState<SetupStep>('welcome');
  const [progress, setProgress] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [hasBackupFile, setHasBackupFile] = useState(false);
  const [profile, setProfile] = useState<Partial<UserProfile>>({
    fullName: '',
    email: '',
    businessName: '',
    phone: ''
  });
  const [whatsappConfig, setWhatsappConfig] = useState({
    businessName: '',
    businessNumber: '',
    countryCode: 'US'
  });
  const { toast } = useToast();

  const t = (key: string) => languageService.translate(key);

  const steps: SetupStep[] = ['welcome', 'restore', 'profile', 'whatsapp', 'complete'];

  useEffect(() => {
    const stepIndex = steps.indexOf(currentStep);
    setProgress((stepIndex / (steps.length - 1)) * 100);
  }, [currentStep]);

  const handleNext = () => {
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex < steps.length - 1) {
      setCurrentStep(steps[currentIndex + 1]);
    }
  };

  const handleBack = () => {
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1]);
    }
  };

  const handleFileRestore = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    try {
      const fileContent = await file.text();
      let backup: BackupData;
      
      try {
        backup = JSON.parse(fileContent);
      } catch {
        // Try decompressing
        const LZString = await import('lz-string');
        const decompressed = LZString.decompress(fileContent);
        backup = JSON.parse(decompressed);
      }

      await backupService.restoreFromBackup(backup);
      
      // Pre-fill forms with restored data
      if (backup.userData.profile) {
        setProfile(backup.userData.profile);
      }
      if (backup.userData.whatsappConfig) {
        setWhatsappConfig({
          businessName: backup.userData.whatsappConfig.businessName,
          businessNumber: backup.userData.whatsappConfig.businessNumber,
          countryCode: backup.userData.whatsappConfig.countryCode
        });
      }

      setHasBackupFile(true);
      toast({
        title: t('restore_successful'),
        description: t('backup_data_restored'),
        className: 'bg-gradient-to-r from-green-400 to-teal-500 text-white shadow-lg rounded-lg'
      });

      // Skip to WhatsApp setup if profile was restored
      if (backup.userData.profile?.fullName) {
        setCurrentStep('whatsapp');
      } else {
        handleNext();
      }
    } catch (error) {
      console.error('Restore failed:', error);
      toast({
        title: t('restore_failed'),
        description: t('invalid_backup_file'),
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
      event.target.value = '';
    }
  };

  const handleProfileSave = async () => {
    if (!profile.fullName?.trim() || !profile.email?.trim()) {
      toast({
        title: t('validation_error'),
        description: t('please_fill_required_fields'),
        variant: 'destructive'
      });
      return;
    }

    setIsLoading(true);
    try {
      await backupService.saveUserProfile(profile);
      toast({
        title: t('profile_saved'),
        description: t('profile_information_saved'),
        className: 'bg-gradient-to-r from-green-400 to-teal-500 text-white shadow-lg rounded-lg'
      });
      handleNext();
    } catch (error) {
      console.error('Failed to save profile:', error);
      toast({
        title: t('error'),
        description: t('failed_to_save_profile'),
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleWhatsAppSave = async () => {
    if (whatsappConfig.businessName && whatsappConfig.businessNumber) {
      setIsLoading(true);
      try {
        const selectedCountry = COUNTRY_CODES.find(c => c.code === whatsappConfig.countryCode);
        const fullNumber = `${selectedCountry?.dialCode}${whatsappConfig.businessNumber.replace(/\D/g, '')}`;
        
        await whatsAppService.saveConfig({
          businessName: whatsappConfig.businessName,
          businessNumber: fullNumber,
          countryCode: whatsappConfig.countryCode,
          isEnabled: true
        });

        toast({
          title: t('whatsapp_configured'),
          description: t('whatsapp_setup_complete'),
          className: 'bg-gradient-to-r from-green-400 to-teal-500 text-white shadow-lg rounded-lg'
        });
      } catch (error) {
        console.error('Failed to save WhatsApp config:', error);
        toast({
          title: t('error'),
          description: t('failed_to_save_whatsapp_config'),
          variant: 'destructive'
        });
      } finally {
        setIsLoading(false);
      }
    }
    handleNext();
  };

  const handleComplete = async () => {
    setIsLoading(true);
    try {
      // Create initial backup
      await backupService.createBackup();
      
      // Enable auto backup
      await backupService.saveAppSettings({
        autoBackup: true,
        backupFrequency: 'weekly'
      });

      toast({
        title: t('setup_complete'),
        description: t('welcome_to_foodcart360'),
        className: 'bg-gradient-to-r from-green-400 to-teal-500 text-white shadow-lg rounded-lg'
      });

      setTimeout(() => {
        onComplete(hasBackupFile);
      }, 1500);
    } catch (error) {
      console.error('Setup completion failed:', error);
      onComplete(hasBackupFile);
    } finally {
      setIsLoading(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 'welcome':
        return (
          <div className="text-center space-y-6">
            <div className="w-24 h-24 bg-gradient-to-r from-orange-500 to-red-600 rounded-full mx-auto flex items-center justify-center">
              <Smartphone size={48} className="text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-4">
                {t('welcome_to_foodcart360')}
              </h1>
              <p className="text-gray-600 dark:text-gray-400 text-lg">
                {t('lets_set_up_your_food_cart_business')}
              </p>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
                <div className="flex items-center">
                  <CheckCircle size={16} className="text-green-500 mr-2" />
                  {t('manage_orders')}
                </div>
                <div className="flex items-center">
                  <CheckCircle size={16} className="text-green-500 mr-2" />
                  {t('track_inventory')}
                </div>
                <div className="flex items-center">
                  <CheckCircle size={16} className="text-green-500 mr-2" />
                  {t('whatsapp_integration')}
                </div>
              </div>
            </div>
            <Button
              onClick={handleNext}
              className="w-full bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white"
            >
              {t('get_started')}
              <ArrowRight size={20} className="ml-2" />
            </Button>
          </div>
        );

      case 'restore':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <Upload size={48} className="mx-auto mb-4 text-blue-500" />
              <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">
                {t('restore_from_backup')}
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                {t('do_you_have_existing_backup')}
              </p>
            </div>

            <Card className="p-6 border-2 border-dashed border-gray-300 dark:border-gray-600">
              <div className="text-center">
                <Upload size={32} className="mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-medium mb-2">{t('upload_backup_file')}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  {t('select_json_backup_file')}
                </p>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleFileRestore}
                  className="hidden"
                  id="backup-restore-input"
                  disabled={isLoading}
                />
                <Button
                  onClick={() => document.getElementById('backup-restore-input')?.click()}
                  disabled={isLoading}
                  variant="outline"
                  className="mb-4"
                >
                  {isLoading ? t('restoring') : t('choose_file')}
                </Button>
              </div>
            </Card>

            <div className="flex space-x-4">
              <Button
                onClick={handleBack}
                variant="outline"
                className="flex-1"
              >
                <ArrowLeft size={20} className="mr-2" />
                {t('back')}
              </Button>
              <Button
                onClick={handleNext}
                className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white"
              >
                {t('skip_restore')}
                <ArrowRight size={20} className="ml-2" />
              </Button>
            </div>
          </div>
        );

      case 'profile':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <Settings size={48} className="mx-auto mb-4 text-green-500" />
              <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">
                {t('business_profile')}
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                {t('tell_us_about_your_business')}
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('full_name')} *
                </label>
                <Input
                  value={profile.fullName || ''}
                  onChange={(e) => setProfile(prev => ({ ...prev, fullName: e.target.value }))}
                  placeholder={t('enter_your_full_name')}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('email')} *
                </label>
                <Input
                  type="email"
                  value={profile.email || ''}
                  onChange={(e) => setProfile(prev => ({ ...prev, email: e.target.value }))}
                  placeholder={t('enter_your_email')}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('business_name')}
                </label>
                <Input
                  value={profile.businessName || ''}
                  onChange={(e) => setProfile(prev => ({ ...prev, businessName: e.target.value }))}
                  placeholder={t('enter_business_name')}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('phone_number')}
                </label>
                <Input
                  type="tel"
                  value={profile.phone || ''}
                  onChange={(e) => setProfile(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder={t('enter_phone_number')}
                />
              </div>
            </div>

            <div className="flex space-x-4">
              <Button
                onClick={handleBack}
                variant="outline"
                className="flex-1"
              >
                <ArrowLeft size={20} className="mr-2" />
                {t('back')}
              </Button>
              <Button
                onClick={handleProfileSave}
                disabled={isLoading}
                className="flex-1 bg-gradient-to-r from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700 text-white"
              >
                {isLoading ? t('saving') : t('continue')}
                <ArrowRight size={20} className="ml-2" />
              </Button>
            </div>
          </div>
        );

      case 'whatsapp':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-teal-600 rounded-full mx-auto mb-4 flex items-center justify-center">
                <span className="text-2xl">📱</span>
              </div>
              <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">
                {t('whatsapp_integration')}
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                {t('connect_whatsapp_for_orders')}
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('business_name')}
                </label>
                <Input
                  value={whatsappConfig.businessName}
                  onChange={(e) => setWhatsappConfig(prev => ({ ...prev, businessName: e.target.value }))}
                  placeholder={t('enter_business_name')}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('whatsapp_business_number')}
                </label>
                <div className="flex gap-2">
                  <Select
                    value={whatsappConfig.countryCode}
                    onValueChange={(value) => setWhatsappConfig(prev => ({ ...prev, countryCode: value }))}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue>
                        <div className="flex items-center gap-2">
                          <span className="text-sm">{COUNTRY_CODES.find(c => c.code === whatsappConfig.countryCode)?.dialCode}</span>
                        </div>
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent className="max-h-60">
                      {COUNTRY_CODES.slice(0, 20).map((country) => (
                        <SelectItem key={country.code} value={country.code}>
                          <div className="flex items-center gap-2">
                            <span className="text-sm">{country.dialCode}</span>
                            <span className="text-xs text-gray-500">{country.name}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    value={whatsappConfig.businessNumber}
                    onChange={(e) => setWhatsappConfig(prev => ({ ...prev, businessNumber: e.target.value.replace(/\D/g, '') }))}
                    placeholder={t('enter_phone_number')}
                    className="flex-1"
                    type="tel"
                  />
                </div>
              </div>
            </div>

            <Card className="p-4 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
              <div className="flex items-start">
                <AlertCircle size={20} className="text-blue-600 dark:text-blue-400 mr-3 mt-0.5" />
                <div>
                  <h4 className="text-sm font-semibold text-blue-800 dark:text-blue-200 mb-1">
                    {t('optional_setup')}
                  </h4>
                  <p className="text-xs text-blue-700 dark:text-blue-300">
                    {t('whatsapp_setup_optional')}
                  </p>
                </div>
              </div>
            </Card>

            <div className="flex space-x-4">
              <Button
                onClick={handleBack}
                variant="outline"
                className="flex-1"
              >
                <ArrowLeft size={20} className="mr-2" />
                {t('back')}
              </Button>
              <Button
                onClick={handleWhatsAppSave}
                disabled={isLoading}
                className="flex-1 bg-gradient-to-r from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700 text-white"
              >
                {isLoading ? t('saving') : t('continue')}
                <ArrowRight size={20} className="ml-2" />
              </Button>
            </div>
          </div>
        );

      case 'complete':
        return (
          <div className="text-center space-y-6">
            <div className="w-24 h-24 bg-gradient-to-r from-green-500 to-teal-600 rounded-full mx-auto flex items-center justify-center">
              <CheckCircle size={48} className="text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-4">
                {t('setup_complete')}
              </h1>
              <p className="text-gray-600 dark:text-gray-400 text-lg">
                {t('ready_to_manage_your_food_cart')}
              </p>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="flex flex-col items-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <CheckCircle size={24} className="text-green-500 mb-2" />
                  <span className="font-medium">{t('profile_configured')}</span>
                </div>
                <div className="flex flex-col items-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <CheckCircle size={24} className="text-blue-500 mb-2" />
                  <span className="font-medium">{t('backup_enabled')}</span>
                </div>
                <div className="flex flex-col items-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                  <CheckCircle size={24} className="text-purple-500 mb-2" />
                  <span className="font-medium">{t('whatsapp_ready')}</span>
                </div>
              </div>
            </div>
            <Button
              onClick={handleComplete}
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700 text-white"
              size="lg"
            >
              {isLoading ? t('finalizing') : t('start_using_foodcart360')}
            </Button>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#ffffff] via-[#f8f9fa] to-[#e9ecef] dark:from-[#1A1A2E] dark:via-[#16213E] dark:to-[#0F3460] flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
            <span>{t('setup_progress')}</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="w-full" />
        </div>

        {/* Main Content */}
        <Card className="p-8 bg-white/80 dark:bg-gray-800/80 backdrop-blur-md shadow-xl">
          {renderStep()}
        </Card>

        {/* Step Indicator */}
        <div className="flex justify-center mt-6 space-x-2">
          {steps.map((step, index) => (
            <div
              key={step}
              className={`w-3 h-3 rounded-full transition-colors ${
                steps.indexOf(currentStep) >= index
                  ? 'bg-green-500'
                  : 'bg-gray-300 dark:bg-gray-600'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default SetupWizard;
