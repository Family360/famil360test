// WhatsApp Business Configuration Screen
import React, { useState, useEffect } from 'react';
import { ArrowLeft, Phone, Building2, MessageSquare, TestTube, Check, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { COUNTRY_CODES, CountryCode } from '@/data/countryCodes';
import whatsAppService, { WhatsAppConfig } from '@/services/whatsAppService';
import languageService from '@/services/languageService';

interface WhatsAppConfigScreenProps {
  onBack: () => void;
}

const WhatsAppConfigScreen: React.FC<WhatsAppConfigScreenProps> = ({ onBack }) => {
  const [config, setConfig] = useState<Partial<WhatsAppConfig>>({
    businessNumber: '',
    businessName: '',
    countryCode: 'US',
    isEnabled: true,
    orderTemplate: '',
    customerTemplate: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState<CountryCode | null>(() => {
    const initialCode = (typeof window !== 'undefined') ? (JSON.parse(JSON.stringify({ code: 'US' })).code) : 'US';
    return COUNTRY_CODES.find(c => c.code === (initialCode)) || COUNTRY_CODES[0];
  });
  const [searchCountry, setSearchCountry] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const { toast } = useToast();

  const t = (key: string) => languageService.translate(key);

  // Load existing configuration
  useEffect(() => {
    loadConfig();
  }, []);

  // Update selected country when country code changes
  useEffect(() => {
    const country = COUNTRY_CODES.find(c => c.code === config.countryCode);
    if (country) setSelectedCountry(country);
  }, [config.countryCode]);

  const loadConfig = async () => {
    try {
      const existingConfig = await whatsAppService.getConfig();
      if (existingConfig) {
        setConfig(existingConfig);
        setPhoneNumber(existingConfig.businessNumber.replace(existingConfig.businessNumber.match(/^\+\d+/)?.[0] || '', ''));
      } else {
        // Load default templates
        const templates = whatsAppService.getDefaultTemplates();
        setConfig(prev => ({
          ...prev,
          orderTemplate: templates.order,
          customerTemplate: templates.customer
        }));
      }
    } catch (error) {
      console.error('Failed to load WhatsApp config:', error);
      toast({
        title: t('error'),
        description: t('failed_to_load_whatsapp_config'),
        variant: 'destructive'
      });
    }
  };

  const handleSave = async () => {
    if (!config.businessName?.trim()) {
      toast({
        title: t('validation_error'),
        description: t('business_name_required'),
        variant: 'destructive'
      });
      return;
    }

    if (!phoneNumber.trim()) {
      toast({
        title: t('validation_error'),
        description: t('phone_number_required'),
        variant: 'destructive'
      });
      return;
    }

    setIsLoading(true);
    try {
      const fullPhoneNumber = `${selectedCountry?.dialCode}${phoneNumber.replace(/\D/g, '')}`;
      
      if (!whatsAppService.validatePhoneNumber(fullPhoneNumber)) {
        toast({
          title: t('validation_error'),
          description: t('invalid_phone_number'),
          variant: 'destructive'
        });
        return;
      }

      await whatsAppService.saveConfig({
        ...config,
        businessNumber: fullPhoneNumber,
        countryCode: selectedCountry?.code || 'US'
      });

      toast({
        title: t('success'),
        description: t('whatsapp_config_saved'),
        className: 'bg-gradient-to-r from-green-400 to-teal-500 text-white shadow-lg rounded-lg'
      });

      onBack();
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
  };

  const handleTest = async () => {
    if (!config.businessName || !phoneNumber) {
      toast({
        title: t('validation_error'),
        description: t('please_fill_required_fields'),
        variant: 'destructive'
      });
      return;
    }

    setIsTesting(true);
    try {
      // Save config first
      const fullPhoneNumber = `${selectedCountry?.dialCode}${phoneNumber.replace(/\D/g, '')}`;
      await whatsAppService.saveConfig({
        ...config,
        businessNumber: fullPhoneNumber,
        countryCode: selectedCountry?.code || 'US'
      });

      // Test WhatsApp
      await whatsAppService.testWhatsApp();
      
      toast({
        title: t('test_successful'),
        description: t('whatsapp_opened_successfully'),
        className: 'bg-gradient-to-r from-green-400 to-teal-500 text-white shadow-lg rounded-lg'
      });
    } catch (error) {
      console.error('WhatsApp test failed:', error);
      toast({
        title: t('test_failed'),
        description: t('whatsapp_test_failed'),
        variant: 'destructive'
      });
    } finally {
      setIsTesting(false);
    }
  };

  const filteredCountries = COUNTRY_CODES.filter(country =>
    country.name.toLowerCase().includes(searchCountry.toLowerCase()) ||
    country.dialCode.includes(searchCountry) ||
    country.code.toLowerCase().includes(searchCountry.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#ffffff] via-[#f8f9fa] to-[#e9ecef] dark:from-[#1A1A2E] dark:via-[#16213E] dark:to-[#0F3460] p-4">
      <div className="max-w-2xl mx-auto">
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
              {t('whatsapp_business_setup')}
            </h1>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              {t('configure_whatsapp_integration')}
            </p>
          </div>
        </div>

        {/* Configuration Form */}
        <Card className="p-6 mb-6 bg-white/80 dark:bg-gray-800/80 backdrop-blur-md">
          <div className="space-y-6">
            {/* Enable/Disable Toggle */}
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                  {t('enable_whatsapp_integration')}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {t('toggle_whatsapp_functionality')}
                </p>
              </div>
              <Switch
                checked={config.isEnabled}
                onCheckedChange={(checked) => setConfig(prev => ({ ...prev, isEnabled: checked }))}
              />
            </div>

            {config.isEnabled && (
              <>
                {/* Business Name */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center">
                    <Building2 size={16} className="mr-2" />
                    {t('business_name')} *
                  </label>
                  <Input
                    value={config.businessName || ''}
                    onChange={(e) => setConfig(prev => ({ ...prev, businessName: e.target.value }))}
                    placeholder={t('enter_business_name')}
                    className="w-full"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {t('business_name_help')}
                  </p>
                </div>

                {/* Phone Number */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center">
                    <Phone size={16} className="mr-2" />
                    {t('whatsapp_business_number')} *
                  </label>
                  
                  <div className="flex gap-2">
                    {/* Country Selector */}
                    <Select
                      value={config.countryCode || selectedCountry?.code || 'US'}
                      onValueChange={(value) => {
                        const country = COUNTRY_CODES.find(c => c.code === value);
                        if (country) {
                          setSelectedCountry(country);
                          setConfig(prev => ({ ...prev, countryCode: country.code }));
                        }
                      }}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue>
                          <div className="flex items-center gap-2">
                            <span className="text-sm">{selectedCountry?.dialCode}</span>
                          </div>
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent className="max-h-60">
                        <div className="p-2">
                          <Input
                            placeholder={t('search_country')}
                            value={searchCountry}
                            onChange={(e) => setSearchCountry(e.target.value)}
                            className="mb-2"
                          />
                        </div>
                        {filteredCountries.map((country) => (
                          <SelectItem key={country.code} value={country.code}>
                            <div className="flex items-center gap-2">
                              <span className="text-sm">{country.dialCode}</span>
                              <span className="text-xs text-gray-500">{country.name}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    {/* Phone Number Input */}
                    <Input
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
                      placeholder={t('enter_phone_number')}
                      className="flex-1"
                      type="tel"
                    />
                  </div>
                  
                  {selectedCountry && phoneNumber && (
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-gray-600 dark:text-gray-400">
                        {t('full_number')}: {selectedCountry.dialCode}{phoneNumber}
                      </span>
                      {whatsAppService.validatePhoneNumber(`${selectedCountry.dialCode}${phoneNumber}`) ? (
                        <Check size={16} className="text-green-500" />
                      ) : (
                        <AlertCircle size={16} className="text-red-500" />
                      )}
                    </div>
                  )}
                  
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {t('whatsapp_number_help')}
                  </p>
                </div>

                {/* Order Template */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center">
                    <MessageSquare size={16} className="mr-2" />
                    {t('order_message_template')}
                  </label>
                  <Textarea
                    value={config.orderTemplate || ''}
                    onChange={(e) => setConfig(prev => ({ ...prev, orderTemplate: e.target.value }))}
                    placeholder={t('order_template_placeholder')}
                    rows={8}
                    className="w-full font-mono text-sm"
                  />
                  <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
                    <p>{t('available_variables')}:</p>
                    <div className="grid grid-cols-2 gap-2">
                      <span>• {'{orderId}'} - {t('order_id')}</span>
                      <span>• {'{customerName}'} - {t('customer_name')}</span>
                      <span>• {'{customerPhone}'} - {t('customer_phone')}</span>
                      <span>• {'{orderItems}'} - {t('order_items')}</span>
                      <span>• {'{total}'} - {t('total_amount')}</span>
                      <span>• {'{date}'} - {t('order_date')}</span>
                      <span>• {'{businessName}'} - {t('business_name')}</span>
                      <span>• {'{notes}'} - {t('order_notes')}</span>
                    </div>
                  </div>
                </div>

                {/* Customer Template */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center">
                    <MessageSquare size={16} className="mr-2" />
                    {t('customer_message_template')}
                  </label>
                  <Textarea
                    value={config.customerTemplate || ''}
                    onChange={(e) => setConfig(prev => ({ ...prev, customerTemplate: e.target.value }))}
                    placeholder={t('customer_template_placeholder')}
                    rows={6}
                    className="w-full font-mono text-sm"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {t('customer_template_help')}
                  </p>
                </div>
              </>
            )}
          </div>
        </Card>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button
            onClick={handleSave}
            disabled={isLoading || !config.businessName || !phoneNumber}
            className="flex-1 bg-gradient-to-r from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700 text-white"
          >
            {isLoading ? t('saving') : t('save_configuration')}
          </Button>
          
          {config.isEnabled && config.businessName && phoneNumber && (
            <Button
              onClick={handleTest}
              disabled={isTesting}
              variant="outline"
              className="flex items-center gap-2"
            >
              <TestTube size={16} />
              {isTesting ? t('testing') : t('test_whatsapp')}
            </Button>
          )}
        </div>

        {/* Help Section */}
        <Card className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
          <h3 className="text-sm font-semibold text-blue-800 dark:text-blue-200 mb-2">
            {t('whatsapp_setup_help')}
          </h3>
          <ul className="text-xs text-blue-700 dark:text-blue-300 space-y-1">
            <li>• {t('whatsapp_help_1')}</li>
            <li>• {t('whatsapp_help_2')}</li>
            <li>• {t('whatsapp_help_3')}</li>
            <li>• {t('whatsapp_help_4')}</li>
          </ul>
        </Card>
      </div>
    </div>
  );
};

export default WhatsAppConfigScreen;
