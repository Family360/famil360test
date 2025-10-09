// WhatsApp Business Integration Service
import { Capacitor } from '@capacitor/core';
import { Browser } from '@capacitor/browser';
import { Share } from '@capacitor/share';
import { formatPhoneNumber, isValidPhoneNumber } from '@/data/countryCodes';
import { currencyService } from './currencyService';
import languageService from './languageService';

export interface WhatsAppConfig {
  businessNumber: string;
  businessName: string;
  countryCode: string;
  isEnabled: boolean;
  autoMessage: string;
  orderTemplate: string;
  customerTemplate: string;
  createdAt: string;
  updatedAt: string;
}

export interface OrderData {
  id: string;
  customerName?: string;
  customerPhone?: string;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
    total: number;
  }>;
  subtotal: number;
  tax?: number;
  total: number;
  orderDate: string;
  status?: string;
  notes?: string;
}

class WhatsAppService {
  private readonly CONFIG_KEY = 'whatsapp_business_config';
  private readonly DEFAULT_TEMPLATES = {
    order: `🍕 *New Order #{orderId}*
📅 Date: {date}
👤 Customer: {customerName}
📞 Phone: {customerPhone}

📋 *Order Details:*
{orderItems}

💰 *Total: {total}*

📝 Notes: {notes}

Thank you for choosing {businessName}! 🙏`,

    customer: `Hello {customerName}! 👋

Your order #{orderId} has been received and is being prepared.

📋 *Order Summary:*
{orderItems}

💰 *Total: {total}*

We'll notify you when it's ready for pickup/delivery.

Thank you for choosing {businessName}! 🍕✨`,

    reminder: `Hi {customerName}! 👋

Just a friendly reminder about your order #{orderId}:

📋 {orderItems}
💰 Total: {total}

Status: {status}

{businessName} 🍕`
  };

  // Get WhatsApp configuration
  async getConfig(): Promise<WhatsAppConfig | null> {
    try {
      const configStr = localStorage.getItem(this.CONFIG_KEY);
      if (!configStr) return null;
      
      const config = JSON.parse(configStr) as WhatsAppConfig;
      return config;
    } catch (error) {
      console.error('Failed to get WhatsApp config:', error);
      return null;
    }
  }

  // Save WhatsApp configuration
  async saveConfig(config: Partial<WhatsAppConfig>): Promise<void> {
    try {
      const existingConfig = await this.getConfig();
      const now = new Date().toISOString();
      
      const newConfig: WhatsAppConfig = {
        businessNumber: config.businessNumber || '',
        businessName: config.businessName || '',
        countryCode: config.countryCode || 'US',
        isEnabled: config.isEnabled ?? true,
        autoMessage: config.autoMessage || this.DEFAULT_TEMPLATES.order,
        orderTemplate: config.orderTemplate || this.DEFAULT_TEMPLATES.order,
        customerTemplate: config.customerTemplate || this.DEFAULT_TEMPLATES.customer,
        createdAt: existingConfig?.createdAt || now,
        updatedAt: now,
        ...config
      };

      localStorage.setItem(this.CONFIG_KEY, JSON.stringify(newConfig));
    } catch (error) {
      console.error('Failed to save WhatsApp config:', error);
      throw error;
    }
  }

  // Validate WhatsApp configuration
  async isConfigured(): Promise<boolean> {
    const config = await this.getConfig();
    return !!(config?.businessNumber && config?.isEnabled && isValidPhoneNumber(config.businessNumber));
  }

  // Format order items for WhatsApp message
  private formatOrderItems(items: OrderData['items']): string {
    return items.map((item, index) => 
      `${index + 1}. ${item.name} x${item.quantity} - ${currencyService.formatAmount(item.total)}`
    ).join('\n');
  }

  // Replace template variables
  private replaceTemplateVariables(template: string, data: {
    orderId: string;
    customerName?: string;
    customerPhone?: string;
    orderItems: string;
    total: string;
    date: string;
    businessName: string;
    notes?: string;
    status?: string;
  }): string {
    return template
      .replace(/{orderId}/g, data.orderId)
      .replace(/{customerName}/g, data.customerName || languageService.translate('customer'))
      .replace(/{customerPhone}/g, data.customerPhone || '')
      .replace(/{orderItems}/g, data.orderItems)
      .replace(/{total}/g, data.total)
      .replace(/{date}/g, data.date)
      .replace(/{businessName}/g, data.businessName)
      .replace(/{notes}/g, data.notes || languageService.translate('no_additional_notes'))
      .replace(/{status}/g, data.status || languageService.translate('confirmed'));
  }

  // Generate WhatsApp message for order
  async generateOrderMessage(orderData: OrderData, template?: string): Promise<string> {
    const config = await this.getConfig();
    if (!config) throw new Error('WhatsApp not configured');

    const messageTemplate = template || config.orderTemplate;
    const orderItems = this.formatOrderItems(orderData.items);
    
    return this.replaceTemplateVariables(messageTemplate, {
      orderId: orderData.id,
      customerName: orderData.customerName,
      customerPhone: orderData.customerPhone,
      orderItems,
      total: currencyService.formatAmount(orderData.total),
      date: new Date(orderData.orderDate).toLocaleDateString(),
      businessName: config.businessName,
      notes: orderData.notes,
      status: orderData.status
    });
  }

  // Send order to WhatsApp (business owner)
  async sendOrderToWhatsApp(orderData: OrderData): Promise<void> {
    const config = await this.getConfig();
    if (!config) throw new Error('WhatsApp not configured');

    const message = await this.generateOrderMessage(orderData);
    const formattedNumber = formatPhoneNumber(config.businessNumber, config.countryCode);
    
    await this.openWhatsApp(formattedNumber, message);
  }

  // Send order confirmation to customer
  async sendOrderToCustomer(orderData: OrderData, customerNumber: string): Promise<void> {
    if (!customerNumber || !isValidPhoneNumber(customerNumber)) {
      throw new Error('Invalid customer phone number');
    }

    const config = await this.getConfig();
    if (!config) throw new Error('WhatsApp not configured');

    const message = this.replaceTemplateVariables(config.customerTemplate, {
      orderId: orderData.id,
      customerName: orderData.customerName,
      customerPhone: orderData.customerPhone,
      orderItems: this.formatOrderItems(orderData.items),
      total: currencyService.formatAmount(orderData.total),
      date: new Date(orderData.orderDate).toLocaleDateString(),
      businessName: config.businessName,
      notes: orderData.notes,
      status: orderData.status
    });

    await this.openWhatsApp(customerNumber, message);
  }

  // Open WhatsApp with pre-filled message
  private async openWhatsApp(phoneNumber: string, message: string): Promise<void> {
    try {
      // Clean phone number (remove spaces, dashes, etc.)
      const cleanNumber = phoneNumber.replace(/\D/g, '');
      const encodedMessage = encodeURIComponent(message);
      const whatsappUrl = `https://wa.me/${cleanNumber}?text=${encodedMessage}`;

      if (Capacitor.isNativePlatform()) {
        // Use Capacitor Browser for native apps
        await Browser.open({ 
          url: whatsappUrl,
          presentationStyle: 'popover'
        });
      } else {
        // Use window.open for web
        const newWindow = window.open(whatsappUrl, '_blank');
        if (!newWindow) {
          // Fallback if popup blocked
          window.location.href = whatsappUrl;
        }
      }
    } catch (error) {
      console.error('Failed to open WhatsApp:', error);
      
      // Fallback: try to share via native share if available
      if (Capacitor.isNativePlatform()) {
        try {
          await Share.share({
            title: languageService.translate('share_order'),
            text: message,
            dialogTitle: languageService.translate('share_via_whatsapp')
          });
        } catch (shareError) {
          console.error('Share fallback failed:', shareError);
          throw new Error('Failed to open WhatsApp. Please check if WhatsApp is installed.');
        }
      } else {
        throw error;
      }
    }
  }

  // Share order via any available method
  async shareOrder(orderData: OrderData): Promise<void> {
    const message = await this.generateOrderMessage(orderData);
    
    if (Capacitor.isNativePlatform()) {
      try {
        await Share.share({
          title: languageService.translate('order_details'),
          text: message,
          dialogTitle: languageService.translate('share_order')
        });
      } catch (error) {
        console.error('Failed to share order:', error);
        throw error;
      }
    } else {
      // Web fallback: copy to clipboard
      try {
        await navigator.clipboard.writeText(message);
        // You could show a toast here
      } catch (error) {
        // Final fallback: create a temporary textarea
        const textarea = document.createElement('textarea');
        textarea.value = message;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
    }
  }

  // Get default templates
  getDefaultTemplates() {
    return this.DEFAULT_TEMPLATES;
  }

  // Validate phone number
  validatePhoneNumber(number: string): boolean {
    return isValidPhoneNumber(number);
  }

  // Format phone number for display
  formatPhoneForDisplay(number: string, countryCode: string): string {
    return formatPhoneNumber(number, countryCode);
  }

  // Test WhatsApp integration
  async testWhatsApp(): Promise<void> {
    const config = await this.getConfig();
    if (!config) throw new Error('WhatsApp not configured');

    const testMessage = `🧪 ${languageService.translate('test_message_from')} ${config.businessName}\n\n${languageService.translate('whatsapp_integration_working')}! ✅`;
    const formattedNumber = formatPhoneNumber(config.businessNumber, config.countryCode);
    
    await this.openWhatsApp(formattedNumber, testMessage);
  }
}

export const whatsAppService = new WhatsAppService();
export default whatsAppService;
