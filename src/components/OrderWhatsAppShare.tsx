// Order WhatsApp Sharing Component
import React, { useState, useEffect } from 'react';
import { MessageSquare, Share2, Send, Phone, User, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import whatsAppService, { OrderData } from '@/services/whatsAppService';
import { COUNTRY_CODES } from '@/data/countryCodes';
import languageService from '@/services/languageService';

interface OrderWhatsAppShareProps {
  order: OrderData;
  onClose?: () => void;
  className?: string;
}

const OrderWhatsAppShare: React.FC<OrderWhatsAppShareProps> = ({
  order,
  onClose,
  className = ''
}) => {
  const [isConfigured, setIsConfigured] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [customerPhone, setCustomerPhone] = useState(order.customerPhone || '');
  const [customerCountry, setCustomerCountry] = useState('US');
  const [generatedMessage, setGeneratedMessage] = useState('');
  const [messageType, setMessageType] = useState<'business' | 'customer'>('business');
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const t = (key: string) => languageService.translate(key);

  useEffect(() => {
    checkWhatsAppConfig();
    generateMessage();
  }, [messageType]);

  const checkWhatsAppConfig = async () => {
    try {
      const configured = await whatsAppService.isConfigured();
      setIsConfigured(configured);
    } catch (error) {
      console.error('Failed to check WhatsApp config:', error);
    }
  };

  const generateMessage = async () => {
    try {
      const message = await whatsAppService.generateOrderMessage(order);
      setGeneratedMessage(message);
    } catch (error) {
      console.error('Failed to generate message:', error);
      setGeneratedMessage(t('failed_to_generate_message'));
    }
  };

  const handleSendToBusiness = async () => {
    if (!isConfigured) {
      toast({
        title: t('whatsapp_not_configured'),
        description: t('please_configure_whatsapp_first'),
        variant: 'destructive'
      });
      return;
    }

    setIsLoading(true);
    try {
      await whatsAppService.sendOrderToWhatsApp(order);
      toast({
        title: t('order_sent'),
        description: t('order_sent_to_whatsapp'),
        className: 'bg-gradient-to-r from-green-400 to-teal-500 text-white shadow-lg rounded-lg'
      });
      onClose?.();
    } catch (error) {
      console.error('Failed to send order to WhatsApp:', error);
      toast({
        title: t('sending_failed'),
        description: t('failed_to_send_order'),
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendToCustomer = async () => {
    if (!customerPhone.trim()) {
      toast({
        title: t('phone_required'),
        description: t('please_enter_customer_phone'),
        variant: 'destructive'
      });
      return;
    }

    const selectedCountry = COUNTRY_CODES.find(c => c.code === customerCountry);
    const fullPhone = `${selectedCountry?.dialCode}${customerPhone.replace(/\D/g, '')}`;

    if (!whatsAppService.validatePhoneNumber(fullPhone)) {
      toast({
        title: t('invalid_phone'),
        description: t('please_enter_valid_phone'),
        variant: 'destructive'
      });
      return;
    }

    setIsLoading(true);
    try {
      await whatsAppService.sendOrderToCustomer(order, fullPhone);
      toast({
        title: t('order_sent'),
        description: t('order_sent_to_customer'),
        className: 'bg-gradient-to-r from-green-400 to-teal-500 text-white shadow-lg rounded-lg'
      });
      onClose?.();
    } catch (error) {
      console.error('Failed to send order to customer:', error);
      toast({
        title: t('sending_failed'),
        description: t('failed_to_send_to_customer'),
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleShareOrder = async () => {
    setIsLoading(true);
    try {
      await whatsAppService.shareOrder(order);
      toast({
        title: t('order_shared'),
        description: t('order_shared_successfully'),
        className: 'bg-gradient-to-r from-blue-400 to-purple-500 text-white shadow-lg rounded-lg'
      });
    } catch (error) {
      console.error('Failed to share order:', error);
      toast({
        title: t('sharing_failed'),
        description: t('failed_to_share_order'),
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyMessage = async () => {
    try {
      await navigator.clipboard.writeText(generatedMessage);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({
        title: t('copied'),
        description: t('message_copied_to_clipboard'),
        className: 'bg-gradient-to-r from-blue-400 to-purple-500 text-white shadow-lg rounded-lg'
      });
    } catch (error) {
      console.error('Failed to copy message:', error);
      toast({
        title: t('copy_failed'),
        description: t('failed_to_copy_message'),
        variant: 'destructive'
      });
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="text-center">
        <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-teal-600 rounded-full mx-auto mb-4 flex items-center justify-center">
          <MessageSquare size={32} className="text-white" />
        </div>
        <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-2">
          {t('share_order_via_whatsapp')}
        </h2>
        <p className="text-gray-600 dark:text-gray-400 text-sm">
          {t('order_id')}: #{order.id}
        </p>
      </div>

      {/* Configuration Status */}
      {!isConfigured && (
        <Card className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800">
          <div className="flex items-center">
            <MessageSquare size={20} className="text-yellow-600 dark:text-yellow-400 mr-3" />
            <div>
              <h4 className="text-sm font-semibold text-yellow-800 dark:text-yellow-200">
                {t('whatsapp_not_configured')}
              </h4>
              <p className="text-xs text-yellow-700 dark:text-yellow-300">
                {t('configure_whatsapp_to_send_orders')}
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Button
          onClick={handleSendToBusiness}
          disabled={isLoading || !isConfigured}
          className="h-16 flex flex-col items-center justify-center bg-gradient-to-r from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700 text-white"
        >
          <Send size={20} className="mb-1" />
          <span className="text-sm">{t('send_to_business')}</span>
        </Button>

        <Button
          onClick={handleSendToCustomer}
          disabled={isLoading}
          variant="outline"
          className="h-16 flex flex-col items-center justify-center"
        >
          <User size={20} className="mb-1" />
          <span className="text-sm">{t('send_to_customer')}</span>
        </Button>

        <Button
          onClick={handleShareOrder}
          disabled={isLoading}
          variant="outline"
          className="h-16 flex flex-col items-center justify-center"
        >
          <Share2 size={20} className="mb-1" />
          <span className="text-sm">{t('share_order')}</span>
        </Button>
      </div>

      {/* Customer Phone Input */}
      <Card className="p-4 bg-white/80 dark:bg-gray-800/80 backdrop-blur-md">
        <h3 className="text-md font-semibold mb-3 flex items-center">
          <Phone size={18} className="mr-2" />
          {t('customer_phone_number')}
        </h3>
        
        <div className="flex gap-2 mb-3">
          <Select value={customerCountry} onValueChange={setCustomerCountry}>
            <SelectTrigger className="w-32">
              <SelectValue>
                <div className="flex items-center gap-2">
                  <span className="text-sm">{COUNTRY_CODES.find(c => c.code === customerCountry)?.dialCode}</span>
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
            value={customerPhone}
            onChange={(e) => setCustomerPhone(e.target.value.replace(/\D/g, ''))}
            placeholder={t('enter_phone_number')}
            className="flex-1"
            type="tel"
          />
        </div>

        <p className="text-xs text-gray-500 dark:text-gray-400">
          {t('customer_phone_help')}
        </p>
      </Card>

      {/* Message Preview */}
      <Card className="p-4 bg-white/80 dark:bg-gray-800/80 backdrop-blur-md">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-md font-semibold flex items-center">
            <MessageSquare size={18} className="mr-2" />
            {t('message_preview')}
          </h3>
          <Button
            onClick={handleCopyMessage}
            variant="ghost"
            size="sm"
            className="flex items-center gap-2"
          >
            {copied ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
            {copied ? t('copied') : t('copy')}
          </Button>
        </div>
        
        <Textarea
          value={generatedMessage}
          onChange={(e) => setGeneratedMessage(e.target.value)}
          rows={8}
          className="w-full font-mono text-sm bg-gray-50 dark:bg-gray-900/50"
          placeholder={t('message_will_appear_here')}
        />
        
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
          {t('you_can_edit_message_before_sending')}
        </p>
      </Card>

      {/* Order Summary */}
      <Card className="p-4 bg-white/80 dark:bg-gray-800/80 backdrop-blur-md">
        <h3 className="text-md font-semibold mb-3">{t('order_summary')}</h3>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">{t('order_id')}:</span>
            <span className="font-medium">#{order.id}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">{t('customer')}:</span>
            <span className="font-medium">{order.customerName || t('walk_in_customer')}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">{t('items')}:</span>
            <span className="font-medium">{order.items.length}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">{t('total')}:</span>
            <span className="font-bold text-green-600 dark:text-green-400">
              ${order.total.toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">{t('date')}:</span>
            <span className="font-medium">
              {new Date(order.orderDate).toLocaleDateString()}
            </span>
          </div>
        </div>
      </Card>

      {/* Close Button */}
      {onClose && (
        <div className="text-center">
          <Button
            onClick={onClose}
            variant="outline"
            className="w-full"
          >
            {t('close')}
          </Button>
        </div>
      )}
    </div>
  );
};

export default OrderWhatsAppShare;
