// Auto-translate service using Google Translate API (optional)
// This service can automatically translate missing keys to all supported languages

import { SUPPORTED_LANGUAGES } from './languageService';

interface TranslationCache {
  [key: string]: {
    [languageCode: string]: string;
  };
}

class AutoTranslateService {
  private cache: TranslationCache = {};
  private apiKey: string | null = null;

  constructor() {
    // API key from environment (optional)
    this.apiKey = import.meta.env.VITE_GOOGLE_TRANSLATE_API_KEY || null;
  }

  /**
   * Translate a single text to a target language
   * Falls back to the original text if translation fails
   */
  async translateText(
    text: string,
    targetLanguage: string,
    sourceLanguage: string = 'en'
  ): Promise<string> {
    // Check cache first
    const cacheKey = `${text}_${sourceLanguage}_${targetLanguage}`;
    if (this.cache[cacheKey]?.[targetLanguage]) {
      return this.cache[cacheKey][targetLanguage];
    }

    // If no API key, return original text
    if (!this.apiKey) {
      console.warn('Google Translate API key not configured. Returning original text.');
      return text;
    }

    try {
      const url = `https://translation.googleapis.com/language/translate/v2?key=${this.apiKey}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          q: text,
          source: sourceLanguage,
          target: targetLanguage,
          format: 'text',
        }),
      });

      if (!response.ok) {
        throw new Error(`Translation API error: ${response.status}`);
      }

      const data = await response.json();
      const translatedText = data.data.translations[0].translatedText;

      // Cache the result
      if (!this.cache[cacheKey]) {
        this.cache[cacheKey] = {};
      }
      this.cache[cacheKey][targetLanguage] = translatedText;

      return translatedText;
    } catch (error) {
      console.error('Translation error:', error);
      return text; // Fallback to original text
    }
  }

  /**
   * Translate a text to all supported languages
   * Returns an object with language codes as keys
   */
  async translateToAllLanguages(
    text: string,
    sourceLanguage: string = 'en'
  ): Promise<{ [languageCode: string]: string }> {
    const translations: { [languageCode: string]: string } = {};

    // Always include source language
    translations[sourceLanguage] = text;

    // Translate to all other languages in parallel
    const translationPromises = SUPPORTED_LANGUAGES.filter(
      (lang) => lang.code !== sourceLanguage
    ).map(async (lang) => {
      const translated = await this.translateText(text, lang.code, sourceLanguage);
      return { code: lang.code, text: translated };
    });

    const results = await Promise.all(translationPromises);
    results.forEach((result) => {
      translations[result.code] = result.text;
    });

    return translations;
  }

  /**
   * Generate translation object for languageService.ts format
   * Example output:
   * {
   *   'new_key': {
   *     en: 'English text',
   *     ar: 'النص العربي',
   *     hi: 'हिंदी पाठ',
   *     ...
   *   }
   * }
   */
  async generateTranslationObject(
    key: string,
    englishText: string
  ): Promise<{ [key: string]: { [languageCode: string]: string } }> {
    const translations = await this.translateToAllLanguages(englishText, 'en');
    return {
      [key]: translations,
    };
  }

  /**
   * Batch translate multiple keys at once
   */
  async batchTranslate(
    items: Array<{ key: string; text: string }>
  ): Promise<{ [key: string]: { [languageCode: string]: string } }> {
    const result: { [key: string]: { [languageCode: string]: string } } = {};

    for (const item of items) {
      const translations = await this.translateToAllLanguages(item.text, 'en');
      result[item.key] = translations;
    }

    return result;
  }

  /**
   * Clear translation cache
   */
  clearCache(): void {
    this.cache = {};
  }

  /**
   * Check if API key is configured
   */
  isConfigured(): boolean {
    return this.apiKey !== null && this.apiKey.length > 0;
  }
}

export const autoTranslateService = new AutoTranslateService();
export default autoTranslateService;
