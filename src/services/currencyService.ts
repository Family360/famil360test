// src/services/currencyService.ts
import { localStorageService } from './localStorage';

const SYMBOL_TO_ISO: Record<string, string> = {
  '₹': 'INR',
  '$': 'USD',
  '£': 'GBP',
  '€': 'EUR',
  '¥': 'JPY',
};

class CurrencyService {
  private currentCurrency: string = 'USD'; // Default currency

  constructor() {
    this.loadCurrency();
  }

  private mapToISO(currency: string): string {
    // If already ISO code, return as is
    if (currency.length === 3) return currency.toUpperCase();
    // Map symbol to ISO
    return SYMBOL_TO_ISO[currency] || 'USD';
  }

  private async loadCurrency() {
    const settings = await localStorageService.getSettings();
    this.currentCurrency = this.mapToISO(settings.currency || 'USD');
  }

  async getCurrency(): Promise<string> {
    const settings = await localStorageService.getSettings();
    this.currentCurrency = this.mapToISO(settings.currency || 'USD');
    return this.currentCurrency;
  }

  async setCurrency(currency: string) {
    try {
      const isoCurrency = this.mapToISO(currency);
      this.currentCurrency = isoCurrency;
      const settings = await localStorageService.getSettings();
      settings.currency = isoCurrency;
      await localStorageService.saveSettings(settings);
    } catch (error) {
      console.error('Error setting currency:', error);
    }
  }

  formatAmount(amount: number): string {
    try {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: this.currentCurrency,
      }).format(amount);
    } catch (error) {
      console.error(`Error formatting amount: ${error}`);
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
      }).format(amount);
    }
  }

  formatAmountSimple(amount: number): string {
    try {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: this.currentCurrency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(amount);
    } catch (error) {
      console.error(`Error formatting amount simple: ${error}`);
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(amount);
    }
  }
}

export const currencyService = new CurrencyService();
